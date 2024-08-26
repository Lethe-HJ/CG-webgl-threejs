#include <emscripten.h>
#include <stdbool.h>
#include <math.h>
#include <stdio.h>

struct Edge
{
  float r, b, y1, y2;
};

struct BoundingBox
{
  float minX, maxX, minY, maxY;
};

const float epsilon = 0.001;

struct Edge *precalculateEdges(const float *restrict vertices, const int edgesLen)
{
  struct Edge *restrict edges = malloc(edgesLen * sizeof(struct Edge));
  if (!edges)
    return NULL;
  float x1, y1, x2, y2, r, dy;
  int verticesIndex;
  bool notHorizontal;
  for (int edgeIndex = 0; edgeIndex < edgesLen - 1; edgeIndex++)
  {
    verticesIndex = 2 * edgeIndex;
    x1 = vertices[verticesIndex];
    y1 = vertices[verticesIndex + 1];
    x2 = vertices[verticesIndex + 2];
    y2 = vertices[verticesIndex + 3];
    dy = y2 - y1;
    if (fabs(dy) > epsilon) // 不是水平边时 才做缓存
    {
      r = (x2 - x1) / dy;
      edges[edgeIndex].r = r;
      edges[edgeIndex].b = r * y1 - x1;
      edges[edgeIndex].y1 = y1;
      edges[edgeIndex].y2 = y2;
    }
  }

  // 最后一个边是最后一个顶点与第一个顶点相连
  const int lastIndex = edgesLen - 1;
  verticesIndex = 2 * lastIndex;
  x1 = vertices[verticesIndex];
  y1 = vertices[verticesIndex + 1];
  x2 = vertices[0];
  y2 = vertices[1];
  dy = y2 - y1;
  if (fabs(dy) > epsilon) // 不是水平边时 才做缓存
  {
    r = (x2 - x1) / dy;
    edges[lastIndex].r = r;
    edges[lastIndex].b = r * y1 - x1;
    edges[lastIndex].y1 = y1;
    edges[lastIndex].y2 = y2;
  }

  return edges;
}

/**
 * 射线法原理: 射线起点为(x, y), 方向默认水平向右
 * 该射线与多边形的所有边的总交点数如果是奇数 则该点在多边形内部
 */
bool isPointInPolygon(const int x, const int y, const struct Edge *precalculatedEdges, const int edgesLen)
{
  bool inside = false;
  struct Edge edge;
  for (int i = 0; i < edgesLen; i++)
  {
    edge = precalculatedEdges[i];
    // 对于每一条边 分别有(x1, y1)和(x2, y2)两个顶点

    // 优化前
    // 代码解释: 判断点 P 的 y 坐标是否在边 P1P2 的两端点坐标y1与y2之间 这一是为了排除水平边或点与边共线的情况 二是因为 如果边在射线上方不相交或者下方不相交 就不需要计算这条边
    // 判断点 P 是否在边 P1P2 的左侧
    // bool intersect = ((y1 > y) != (y2 > y)) && (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1);

    // 优化手段 对公式进行展开 在预计算中缓存需要的计算结果
    // dx = x2 - x1
    // dy = y2 - y1
    // 右边的公式展开后变成 x < dx/dy * y - (dx/dy * y1 - x1) 这个公式看作 x < ry-b
    // 其中 可以预计算的有如下
    // 斜率倒数 r = dx/dy
    // b = r * y1 - x1

    // 优化后 代码如下
    bool intersect = ((edge.y1 > y) != (edge.y2 > y)) && (x < edge.r * y - edge.b);
    if (intersect)
    {
      inside = !inside; // 翻转 inside 标记 奇数为true  偶数为false
    }
  }

  return inside;
}

/**
 * 计算外部多边形的包围盒
 *
 */
struct BoundingBox
getBoundingBox(const float *vertices, const int count)
{
  struct BoundingBox box;
  box.minX = INFINITY;
  box.maxX = -INFINITY;
  box.minY = INFINITY;
  box.maxY = -INFINITY;
  float x, y;
  for (int i = 0, index; i < count; i++)
  {
    index = 2 * i;
    x = vertices[index];
    y = vertices[index + 1];
    box.minX = fminf(box.minX, x);
    box.maxX = fmaxf(box.maxX, x);
    box.minY = fminf(box.minY, y);
    box.maxY = fmaxf(box.maxY, y);
  }
  return box;
}

EMSCRIPTEN_KEEPALIVE int calculatePointsInPolygon(
    int *points,               // 待过滤的点数组 [x1, y1, x2, y2, ...]
    const int pointsLen,       // points数组的长度
    float *vertices,           // 多边形路径的顶点数组 [x1, y1, x2, y2, ...]
    const int verticesLen,     // vertices数组的长度
    int *holeIndices,          // 多边形路径中的洞的分割索引
    const int holeIndicesLen,  // holeIndices的长度
    int *filteredPointsIndices // 过滤后的点在points中的索引的数组
)
{

  int filteredPointsLen = 0;
  const int outerPolygonEndIndices = (holeIndicesLen > 0 ? holeIndices[0] : verticesLen);
  // 预计算外部多边形和所有孔的边
  const int outerPolygonVerticesCount = outerPolygonEndIndices / 2; // 外部多边形的点的数量

  // 生成外部多边形的包围盒
  struct BoundingBox outerPolygonBoundingBox;
  outerPolygonBoundingBox = getBoundingBox(vertices, outerPolygonVerticesCount);

  const int outerPolygonEdgesLen = outerPolygonVerticesCount; // 外部多边形的点的数量与外部多边形的边的数量一致 因为是闭合路径
  const struct Edge *outerPolygonEdges = precalculateEdges(vertices, outerPolygonEdgesLen);

  // holes的包围盒
  struct BoundingBox *holeBoundingBoxes;
  struct Edge **holeEdgesArray;
  if (holeIndicesLen > 0)
  {
    holeBoundingBoxes = malloc(holeIndicesLen * sizeof(struct BoundingBox));
    holeEdgesArray = malloc(holeIndicesLen * sizeof(const struct Edge *));
  }

  // 分配内存
  int holeEdgesLenArray[holeIndicesLen];
  if (holeIndicesLen > 0)
  {
    for (int i = 0; i < holeIndicesLen; i++)
    {
      const int endIndices = (i == holeIndicesLen - 1) ? verticesLen : holeIndices[i + 1];
      const int holeEdgeVerticesLen = endIndices - holeIndices[i];
      const int holeEdgeLen = holeEdgeVerticesLen / 2;
      holeEdgesArray[i] = malloc(holeEdgeLen * sizeof(struct Edge));
      const float *holeVertices = vertices + holeIndices[i];
      holeEdgesArray[i] = precalculateEdges(holeVertices, holeEdgeLen);
      holeEdgesLenArray[i] = holeEdgeLen;

      // 计算hole包围盒
      holeBoundingBoxes[i] = getBoundingBox(holeVertices, holeEdgeLen);
    }
  }
  // double start_time = emscripten_get_now();
  bool outsideHole;
  struct BoundingBox holeBoundingBox;
  for (int i = 0, x, y; i < pointsLen; i += 2)
  {
    x = points[i];
    y = points[i + 1];
    if (
        x > outerPolygonBoundingBox.minX &&
        x < outerPolygonBoundingBox.maxX &&
        y > outerPolygonBoundingBox.minY &&
        y < outerPolygonBoundingBox.maxY &&
        isPointInPolygon(x, y, outerPolygonEdges, outerPolygonEdgesLen))
    {
      outsideHole = true;
      // 仅当存在洞时检查点是否在洞内
      if (holeIndicesLen > 0)
      {
        for (int j = 0; j < holeIndicesLen; j++)
        {
          holeBoundingBox = holeBoundingBoxes[j];

          if (
              x >= holeBoundingBox.minX &&
              x <= holeBoundingBox.maxX &&
              y >= holeBoundingBox.minY &&
              y <= holeBoundingBox.maxY &&
              isPointInPolygon(x, y, holeEdgesArray[j], holeEdgesLenArray[j]))
          {
            outsideHole = false;
            break;
          }
        }
      }
      if (outsideHole)
      {
        filteredPointsIndices[filteredPointsLen++] = i / 2; // 除2
      }
    }
  }

  // double end_time = emscripten_get_now();
  // double elapsed_time = end_time - start_time;
  // printf("calculatePointsInPolygon: %f ms\n", elapsed_time);

  // 释放内存
  free((void *)outerPolygonEdges); // 将 outerPolygonEdges 强制转换为 void *
  for (int i = 0; i < holeIndicesLen; i++)
  {
    free((void *)holeEdgesArray[i]); // 将 holeEdgesArray[i] 强制转换为 void *
  }
  free(holeEdgesArray);
  free((void *)holeBoundingBoxes);

  return filteredPointsLen;
}