#ifndef EM_PORT_API
#if defined(__EMSCRIPTEN__)
#include <emscripten.h>
#if defined(__cplusplus)
#define EM_PORT_API(rettype) extern "C" rettype EMSCRIPTEN_KEEPALIVE
#else
#define EM_PORT_API(rettype) rettype EMSCRIPTEN_KEEPALIVE
#endif
#else
#if defined(__cplusplus)
#define EM_PORT_API(rettype) extern "C" rettype
#else
#define EM_PORT_API(rettype) rettype
#endif
#endif
#endif

// SurfaceNets, 10 August 2015, Roberto Toro
// translated from Mikola Lysenko
// http://0fps.net/2012/07/12/smooth-voxel-terrain-part-2/

#include <stdio.h>
#include <stdlib.h>
#include <math.h>

typedef struct
{
    float x, y, z;
} float3D;

typedef struct
{
    int a, b, c;
} int3D;

typedef struct
{
    int np, nt;
    float3D *p;
    int3D *t;
} Mesh;

int cube_edges[24];
int edge_table[256];
int buffer[4096];

EM_PORT_API(void) surfaceNets(float *data, int *dims, float level, Mesh *mesh, int storeFlag){
    float3D *vertices = mesh->p;
    int3D *faces = mesh->t;
    int n = 0;
    float x[3];
    int R[3];
    float *grid = (float *)calloc(8, sizeof(float));
    int buf_no = 1;
    int *buffer;
    int buffer_length = 0;
    int vertices_length = 0;
    int faces_length = 0;
    int i, j, k;

    R[0] = 1;
    R[1] = dims[0] + 1;
    R[2] = (dims[0] + 1) * (dims[1] + 1);

    if (R[2] * 2 > buffer_length)
        buffer = (int *)calloc(R[2] * 2, sizeof(int));

    for (x[2] = 0; x[2] < dims[2] - 1; ++x[2])
    {
        int m = 1 + (dims[0] + 1) * (1 + buf_no * (dims[1] + 1));
        for (x[1] = 0; x[1] < dims[1] - 1; ++x[1], ++n, m += 2)
            for (x[0] = 0; x[0] < dims[0] - 1; ++x[0], ++n, ++m)
            {
                int mask = 0, g = 0, idx = n;
                for (k = 0; k < 2; ++k, idx += dims[0] * (dims[1] - 2))
                    for (j = 0; j < 2; ++j, idx += dims[0] - 2)
                        for (i = 0; i < 2; ++i, ++g, ++idx)
                        {
                            float p = data[idx] - level;
                            grid[g] = p;
                            mask |= (p < 0) ? (1 << g) : 0;
                        }
                if (mask == 0 || mask == 0xff)
                    continue;
                int edge_mask = edge_table[mask];
                float3D v = {0.0, 0.0, 0.0};
                int e_count = 0;
                for (i = 0; i < 12; ++i)
                {
                    if (!(edge_mask & (1 << i)))
                        continue;
                    ++e_count;
                    int e0 = cube_edges[i << 1]; // Unpack vertices
                    int e1 = cube_edges[(i << 1) + 1];
                    float g0 = grid[e0]; // Unpack grid values
                    float g1 = grid[e1];
                    float t = g0 - g1; // Compute point of intersection
                    if (fabs(t) > 1e-6)
                        t = g0 / t;
                    else
                        continue;
                    k = 1;
                    for (j = 0; j < 3; ++j)
                    {
                        int a = e0 & k;
                        int b = e1 & k;
                        if (a != b)
                            ((float *)&v)[j] += a ? 1.0 - t : t;
                        else
                            ((float *)&v)[j] += a ? 1.0 : 0;
                        k = k << 1;
                    }
                }
                float s = 1.0 / e_count;
                for (i = 0; i < 3; ++i)
                    ((float *)&v)[i] = x[i] + s * ((float *)&v)[i];
                buffer[m] = vertices_length;
                if (storeFlag)
                    vertices[vertices_length++] = v;
                else
                    vertices_length++;
                for (i = 0; i < 3; ++i)
                {
                    if (!(edge_mask & (1 << i)))
                        continue;
                    int iu = (i + 1) % 3;
                    int iv = (i + 2) % 3;
                    if (x[iu] == 0 || x[iv] == 0)
                        continue;
                    int du = R[iu];
                    int dv = R[iv];

                    if (storeFlag)
                    {
                        if (mask & 1)
                        {
                            faces[faces_length++] = (int3D){buffer[m], buffer[m - du - dv], buffer[m - du]};
                            faces[faces_length++] = (int3D){buffer[m], buffer[m - dv], buffer[m - du - dv]};
                        }
                        else
                        {
                            faces[faces_length++] = (int3D){buffer[m], buffer[m - du - dv], buffer[m - dv]};
                            faces[faces_length++] = (int3D){buffer[m], buffer[m - du], buffer[m - du - dv]};
                        }
                    }
                    else
                        faces_length += 2;
                }
            }
        n += dims[0];
        buf_no ^= 1;
        R[2] = -R[2];
    }
    mesh->np = vertices_length;
    mesh->nt = faces_length;
}

EM_PORT_API(Mesh) computeSurfaceNets(float *data, int *dims, float level)
{
    Mesh m;
    surfaceNets(data, dims, level, &m, 0); // 1st pass: evaluate memory requirements
    m.p = (float3D *)calloc(m.np, sizeof(float3D));
    m.t = (int3D *)calloc(m.nt, sizeof(int3D));
    surfaceNets(data, dims, level, &m, 1); // 2nd pass: store vertices and triangles
    return m;
}

// 获取 Mesh 中的顶点数
EM_PORT_API(int) getMeshVertexCount(Mesh* mesh) {
    return mesh->np;
}

// 获取 Mesh 中的三角形数
EM_PORT_API(int) getMeshTriangleCount(Mesh* mesh) {
    return mesh->nt;
}

// 获取 Mesh 的顶点数组指针
EM_PORT_API(float3D*) getMeshVertices(Mesh* mesh) {
    return mesh->p;
}

// 获取 Mesh 的三角形数组指针
EM_PORT_API(int3D*) getMeshTriangles(Mesh* mesh) {
    return mesh->t;
}

EM_PORT_API(void) freeMesh(Mesh* mesh) {
    // 先检查指针是否为 NULL，避免尝试释放未分配的内存
    if (mesh->p != NULL) {
        free(mesh->p); // 释放顶点数组
        mesh->p = NULL; // 避免悬挂指针
    }
    if (mesh->t != NULL) {
        free(mesh->t); // 释放三角形数组
        mesh->t = NULL; // 避免悬挂指针
    }
}