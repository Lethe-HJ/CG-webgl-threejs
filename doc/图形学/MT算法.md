
# MT算法讲解

### **Möller-Trumbore 算法详解**

Möller-Trumbore 算法（简称 **MT算法**）是一种高效的**射线-三角形相交检测算法**，由 Tomas Möller 和 Ben Trumbore 在 1997 年提出。它被广泛应用于 3D 图形学中的光线追踪（Ray Tracing）、碰撞检测（Collision Detection）以及 Three.js 等引擎的射线拾取（Raycasting）功能。

该算法的核心优势在于：
1. **直接计算交点**，无需预计算三角形所在平面方程。
2. **仅需一次求解线性方程组**，计算量小，效率高。
3. **返回交点的重心坐标（Barycentric Coordinates）**，可用于插值计算纹理坐标、法线等信息。

---

## **1. 算法输入与输出**
### **输入参数**
- **射线（Ray）**：
  - 起点 $$\mathbf{O}$$（`ray.origin`）。
  - 方向 $$\mathbf{D}$$（`ray.direction`，**单位向量**）。
- **三角形三个顶点**：
  - $$\mathbf{V_0}, \mathbf{V_1}, \mathbf{V_2}$$。

### **输出结果**
- **是否相交（`true/false`）**。
- 如果相交，返回：
  - 交点距离 $$t$$（沿射线的参数）。
  - 交点在该三角形上的**重心坐标  $$(u, v)$$**。

---

## **2. 数学推导**
MT算法的核心思想是**将射线方程和三角形参数方程联立求解**。

### **(1) 射线的参数方程**
射线上的任意一点可表示为：
$$\mathbf{R}(t) = \mathbf{O} + t \mathbf{D}, \quad t \geq 0$$

### **(2) 三角形的参数方程（重心坐标表示）**
三角形内的任意一点可表示为：
$$\mathbf{T}(u, v) = \mathbf{V_0} + u (\mathbf{V_1} - \mathbf{V_0}) + v (\mathbf{V_2} - \mathbf{V_0})$$
其中：
- $$u \geq 0$$, $$v \geq 0$$, $$u + v \leq 1$$（保证点在三角形内）。
- $$(\mathbf{V_1} - \mathbf{V_0})$$ 和 $$(\mathbf{V_2} - \mathbf{V_0})$$ 是两条边向量。

### **(3) 联立方程求交点**
令 $$\mathbf{R}(t) = \mathbf{T}(u, v)$$，得到：
$$\mathbf{O} + t \mathbf{D} = \mathbf{V_0} + u (\mathbf{V_1} - \mathbf{V_0}) + v (\mathbf{V_2} - \mathbf{V_0})$$
整理后：
$$\mathbf{O} - \mathbf{V_0} = -t \mathbf{D} + u (\mathbf{V_1} - \mathbf{V_0}) + v (\mathbf{V_2} - \mathbf{V_0})$$
写成矩阵形式：
```math
\begin{bmatrix} - \mathbf{D} & \mathbf{V_1} - \mathbf{V_0} & \mathbf{V_2} - \mathbf{V_0} \end{bmatrix} \begin{bmatrix}  t \\ u \\ v \end{bmatrix} = \mathbf{O} - \mathbf{V_0}
```
即：
$$\mathbf{A} \mathbf{x} = \mathbf{b}$$
其中：
```math
 \mathbf{A} = \begin{bmatrix} -\mathbf{D} & \mathbf{E_1} & \mathbf{E_2} \end{bmatrix}（\mathbf{E_1} = \mathbf{V_1} - \mathbf{V_0}, \mathbf{E_2} = \mathbf{V_2} - \mathbf{V_0})
```
```math
\mathbf{x} = \begin{bmatrix} t \\ u \\ v \end{bmatrix}
```
```math
\mathbf{b} = \mathbf{O} - \mathbf{V_0}
```

### **(4) 使用克莱姆法则（Cramer's Rule）求解**
解该线性方程组，可以使用**克莱姆法则**：
$$t = \frac{\det(\mathbf{A_t})}{\det(\mathbf{A})}, \quad
u = \frac{\det(\mathbf{A_u})}{\det(\mathbf{A})}, \quad
v = \frac{\det(\mathbf{A_v})}{\det(\mathbf{A})}$$
其中：
- $$\mathbf{A_t}$$：用 $$\mathbf{b}$$ 替换 $$\mathbf{A}$$ 的第 1 列。
- $$\mathbf{A_u}$$：用 $$\mathbf{b}$$ 替换 $$\mathbf{A}$$ 的第 2 列。
- $$\mathbf{A_v}$$：用 $$\mathbf{b}$$ 替换 $$\mathbf{A}$$ 的第 3 列。
- $$\det(\mathbf{A})$$ 为矩阵 $$\mathbf{A}$$ 的行列式。

### **(5) 向量叉乘优化计算**
MT算法采用向量叉乘来高效计算行列式：
1. 定义：
   $$\mathbf{P} = \mathbf{D} \times \mathbf{E_2}$$

   $$\mathbf{Q} = \mathbf{T} \times \mathbf{E_1}, \quad \text{其中} \quad \mathbf{T} = \mathbf{O} - \mathbf{V_0}$$

2. 计算行列式：
   $$\det(\mathbf{A}) = \mathbf{E_1} \cdot \mathbf{P}$$
   
   $$t = \frac{\mathbf{E_2} \cdot \mathbf{Q}}{\det(\mathbf{A})}, \quad
   u = \frac{\mathbf{T} \cdot \mathbf{P}}{\det(\mathbf{A})}, \quad
   v = \frac{\mathbf{D} \cdot \mathbf{Q}}{\det(\mathbf{A})}$$

### **(6) 相交条件判断**
最终，交点有效的条件是：
1. $$\det(\mathbf{A}) \neq 0$$（避免除零错误）。
2. $$t \geq 0$$（交点在射线正方向上）。
3. $$u \geq 0$$, $$v \geq 0$$, $$u + v \leq 1$$（交点在三角形内部）。

---

## **3. 伪代码实现**
```python
def rayTriangleIntersect(O, D, V0, V1, V2):
    E1 = V1 - V0
    E2 = V2 - V0
    P = cross(D, E2)
    det = dot(E1, P)
    
    # 如果行列式接近0，射线与三角形平行
    if abs(det) < epsilon:
        return False, None
    
    inv_det = 1.0 / det
    T = O - V0
    
    # 计算u参数
    u = dot(T, P) * inv_det
    if u < 0 or u > 1:
        return False, None
    
    # 计算v参数
    Q = cross(T, E1)
    v = dot(D, Q) * inv_det
    if v < 0 or u + v > 1:
        return False, None
    
    # 计算t参数
    t = dot(E2, Q) * inv_det
    if t < 0:
        return False, None
    
    return True, (t, u, v)
```

---

## **4. 在 Three.js 中的应用**
Three.js 的 `Raycaster` 类在检测 `Mesh` 物体时，底层使用了 MT算法（见 `Ray.intersectTriangle` 方法）：
```javascript
// Three.js 源码中的简化实现
function intersectTriangle(ray, a, b, c, backfaceCulling, target) {
    const edge1 = subVectors(b, a);
    const edge2 = subVectors(c, a);
    const normal = crossVectors(edge1, edge2);

    // 背面剔除（backfaceCulling）
    const DdN = dot(ray.direction, normal);
    if (backfaceCulling && DdN >= 0) return null;

    // MT算法核心计算
    const P = crossVectors(ray.direction, edge2);
    const det = dot(edge1, P);
    if (det === 0) return null;

    const invDet = 1 / det;
    const T = subVectors(ray.origin, a);
    const u = dot(T, P) * invDet;
    if (u < 0 || u > 1) return null;

    const Q = crossVectors(T, edge1);
    const v = dot(ray.direction, Q) * invDet;
    if (v < 0 || u + v > 1) return null;

    const t = dot(edge2, Q) * invDet;
    if (t < 0) return null;

    return { distance: t, point: ray.at(t), uv: [u, v] };
}
```

---

## **5. 性能优化**
MT算法已经非常高效，但在大规模场景（如数百万三角形）中仍需优化：
1. **BVH加速**：使用 Bounding Volume Hierarchy（层次包围盒）减少检测的三角形数量。
2. **SIMD加速**：利用现代CPU的SIMD指令（如SSE/AVX）并行计算多个三角形。
3. **GPU计算**：在着色器中实现射线-三角形相交检测（用于光线追踪）。

---

## **6. 总结**
Möller-Trumbore 算法的核心是：
1. **联立射线和三角形方程**，用线性代数求解 $$(t, u, v)$$。
2. **利用向量叉乘和点乘优化行列式计算**，避免显式求逆矩阵。
3. **检查 $$t \geq 0$$、$$u \geq 0$$、$$v \geq 0$$、$$u + v \leq 1$$** 确认交点有效性。

它是 Three.js 射线拾取、光线追踪、碰撞检测等功能的数学基础，理解其原理对于优化 3D 交互至关重要。
