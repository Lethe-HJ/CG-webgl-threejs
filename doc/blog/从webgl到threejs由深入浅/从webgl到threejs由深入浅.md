# 从webgl到threejs(由深入浅)

从口入，初其狭，才通人，复行数十步，豁然开朗 ———— 陶渊明

## 1. 前言

+ 先讲webgl的原因: 先对webgl从三维如何渲染到二维屏幕的机制,Geometry的本质,材质和光源的本质,相机的本质等知识点提前有大概的了解. 后面再讲threejs的时候就可以与前面的webgl的内容一一呼应上, 如此便豁然开朗.
+ 本文主要使用webgl1和threejs, 全是干货!!!!

## 2. web3d技术展望

WebGL（Web Graphics Library）是一种在不需要插件的情况下在网页浏览器中使用的 3D 绘图API。它是一个低级的、基于 OpenGL ES 2.0（WebGL 1.0）和 OpenGL ES 3.0（WebGL 2.0）的图形API，允许开发者在支持的浏览器上直接利用 GPU（图形处理单元）进行图形渲染。
WebGL 被广泛用于开发网页游戏、3D模型查看器、数据可视化、虚拟现实（VR）和增强现实（AR）应用等。它能够在不牺牲性能的情况下，在浏览器中提供丰富的交互式3D体验。

本文主要使用webgl1, 但在本文的threejs中是默认使用webgl2的

> 延申知识 webgl2的增强
>
> 新特性和改进
> - 3D纹理支持： WebGL 2 支持3D纹理，这对于一些高级效果和技术，如体积渲染，是非常有用的。
> - 多目标渲染（MRT）： WebGL 2 允许开发者在单次渲染通道中向多个渲染目标写入数据，这可以显著提高效率和性能。
> - 更好的性能： 通过引入实例化渲染、变换反馈等功能，WebGL 2 允许更高效的数据处理和渲染。
> - 增强的纹理功能： WebGL 2 提供了更多的纹理格式和更好的纹理控制功能，包括非幂次方纹理的更好支持。
> - 新增的着色器功能： 包括对整数和位操作的支持，这使得着色器编程更加灵活和强大。
> - Uniform Buffer Objects（UBO）： 通过这种机制，可以更高效地管理着色器程序中的uniform数据。
> 兼容性和过渡
> - 向后兼容性： WebGL 2 设计时考虑到了与 WebGL 1 的兼容性，许多 WebGL 1 的代码可以直接在 WebGL 2 环境中运行，尽管可能需要一些调整来充分利用新特性。
> - 浏览器支持： 虽然大多数现代浏览器都支持 WebGL 1 和 WebGL 2，但后者的支持可能不如前者广泛，特别是在一些旧设备和浏览器上

> 延申知识 WebGPU
> WebGPU 是一种新的网页图形和计算接口，旨在提供比 WebGL1 和 WebGL2 更高效、更强大的性能和功能。
> WebGPU 设计初衷是充分利用现代图形处理单元（GPU）的能力，包括对图形渲染和通用计算的支持。做个类比,webgl对标的是老古董opengl,webgpu对标的是DirectX 12这种现代图形API;与 WebGL2 相比，WebGPU 提供了一系列的优势：
> 1. 更接近硬件的性能: WebGPU 提供了更低层次的GPU控制，减少了驱动程序的开销，使得它能够更接近硬件的性能。这种设计使得应用可以更高效地执行，尤其是对于需要高性能图形渲染和大规模并行计算的应用。
> 2. 现代GPU特性的支持: WebGPU 被设计为能够利用现代GPU的先进特性，包括更复杂的渲染管线、计算着色器、高效的资源管理和同步机制等。这意味着开发者可以实现更复杂和动态的视觉效果，同时保持高效的性能。
> 3. 统一的图形和计算接口: 与 WebGL 主要聚焦于图形渲染不同，WebGPU 提供了一个统一的接口，既支持图形渲染也支持通用计算任务。这使得开发者可以在同一个API中处理图形和计算，为开发高性能应用和算法提供了便利。
> 4. 跨平台和跨设备的一致性: WebGPU 目标是提供一个跨平台、跨设备的标准，这包括桌面、移动设备和其他可能的平台。与 WebGL 相比，WebGPU 旨在通过减少API的差异性，提高在不同设备和平台上的一致性和可预测性。
> 5. 安全性和可移植性: WebGPU 考虑到了现代网络环境中的安全需求，设计了一套更加安全的接口，旨在减少潜在的安全风险。同时，通过提供更一致的行为和性能，增加了代码的可移植性。
目前最新的chrome浏览器已经支持webgpu, threejs和babylonjs已经在积极推进使用webgpu作为底层渲染api

[threejs官网的webgpu的demo](https://threejs.org/examples/?q=webgpu#webgpu_backdrop_water)
 
## 3. webgl

### 3.1 三维成像原理

#### 3.2.1 webgl中的坐标系


3.2.2 视图矩阵
[图片]
视图矩阵的作用: 将世界坐标转换到摄像机为原点的摄像机坐标系下
视图矩阵的推导思路: 先将摄像机的位置移动到世界坐标的原点位置, 再旋转摄像机坐标系到与世界坐标系重合, 得到的矩阵就是如何将摄像机坐标系下的坐标转换到世界坐标系下的坐标, 再求逆就得到了世界坐标系下的坐标如何转换到摄像机坐标系下的坐标 (其实也可以直接反向求,就不需要求逆了,这是webgl官方文档给出的求视图矩阵的代码的原理,不知道为什么不直接求而是要反向求再求逆)
具体推导过程如下图(正向的推导)
[图片]
3.2.3 正射投影矩阵
[图片]
[图片]
[图片]

// 获取正射投影矩阵
export function ortho(l, r, t, b, n, f) {
  // prettier-ignore
  return new Float32Array([
    2 / (r - l), 0,           0,           0,
    0,           2/(t-b),     0,           0,
    0,           0,           -2/(f-n),    0,
    -(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1
  ])
}
3.2.4 透视投影矩阵
[图片]
具体的推导过程如下:
先将透视投影的棱台映射为长方体
[图片]
[图片]
[图片]
[图片]
3.3 渲染管线与着色器
3.3.1 渲染管线
[图片]
[图片]
1. 顶点着色器: 顶点着色器一般用来对模型的顶点进行矩阵变换
2. 图元装配: GPU会将我们传入的顶点装配成三角形、线段或者点；装配好之后，会自动截去不在可视区域的部分
3. 光栅化: GPU会将装配好的三角形转换成对应的像素，并将这些像素传入下一个阶段
4. 片元着色器: 得到光栅化的片段像素位置数据之后，就可以通过片段着色器为这些像素进行上色了
5. 裁剪测试: 会有一个裁剪的范围，如果像素位于该范围之外，会被剔除，不会到达绘制缓存
6. 多重采样操作: 修改像素的alpha值和覆盖值，主要用来实现抗锯齿的效果
7. 背面剔除: 通过避免渲染背对观察者的几何体面来提高性能
8. alpha测试: 将像素点的alpha值和一个固定值比较，如果比较的结果失败，像素将不会被写到显示输出中
9. 模板测试: 是否将某个像素写入后台缓存
10. alpha融合: 将当前要进行的光栅化的像素的颜色与先前已经光栅化并处于同一位置的像素的颜色进行合成
11. 深度测试: 进行深度测试，抛弃掉位置靠后的像素值
12. 融合: 将新的颜色值和已经存在的颜色值进行组合，得出融合后的颜色值
13. 抖动: 解决可使用的颜色过少会出现色带的问题，通过较少的颜色来模拟较多颜色的技术
14. 缓存: 数据经过整个渲染管线处理之后，最终会写入到帧缓存中，帧缓存存储了最终会显示到屏幕上的颜色数据

3.3.2 着色器
webgl的着色器语言是glsl(OpenGL Shading Language)
WebGL 1.0 , 使用 GLSL ES 1.00
WebGL 2.0 , 使用 GLSL ES 3.00
语法类似c语法, 下面是一段glsl代码, 体会一下语法
attribute vec4 a_position;
attribute vec4 a_normal;
uniform vec3 u_pointLightColor;
uniform vec3 u_pointLightPosition;
uniform vec3 u_ambientLightColor;
uniform vec3 u_materialColor;
uniform int u_materialType;
uniform mat4 u_mvpMatrix;
uniform mat4 u_normalMatrix;

varying vec4 v_color;

const int MATERIAL_LAMBERT = 1;

void main() {
  vec4 color = vec4(u_materialColor, 1.0); // 物体表面的颜色
  vec4 vertexPosition = u_mvpMatrix * a_position; // 顶点的世界坐标
  if (u_materialType == MATERIAL_LAMBERT) { // lambert类型的材质
    vec3 lightDirection = normalize(u_pointLightPosition - vec3(vertexPosition)); // 点光源的方向
    vec3 ambient = u_ambientLightColor * vec3(color); // 环境反射
    vec3 transformedNormal = normalize(vec3(u_normalMatrix * vec4(vec3(a_normal), 0.0)));
    float dotDeg = max(dot(transformedNormal, lightDirection), 0.0); // 计算入射角 光线方向和法线方向的点积
    vec3 diffuseColor = u_pointLightColor * vec3(color) * dotDeg; // 漫反射光的颜色
    v_color = vec4(ambient + diffuseColor, color.a);
  } else {
    v_color = color;
  }
  gl_Position =  vertexPosition;
}
glsl中还可以使用结构体, 但不支持从js传入对象作为结构体, 只能挨个字段通过uniform单独传入
// 定义一个结构体
struct Light {
    vec3 position;
    vec3 color;
    float intensity;
};

// 使用这个结构体的变量
uniform Light u_light;

void main() {
    // 使用 light 结构体中的数据
    vec3 lightDirection = normalize(u_light.position - gl_FragCoord.xyz);
    float brightness = dot(lightDirection, vec3(0.0, 0.0, 1.0)) * u_light.intensity;
    gl_FragColor = vec4(u_light.color * brightness, 1.0);
}
3.4 几何体(Geometry)的构造
1. 顶点: 关键数据 用来构建面
2. 面: 通过三个不共线点的索引来构建一个三角面, 通过n个三角面组成几何体
3. 法向量: 可选数据用于计算光照
以一顶点为端点的逆时针方向两条边的叉积则为平面法向量
暂时无法在飞书文档外展示此内容
function initGeometry() {
  // 物体位置
  const vertices = new Float32Array([
    // 0123
    1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
    // 0345
    1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1,
    // 0156
    1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1,
    // 1267
    -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1,
    // 2347
    -1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1,
    // 4567
    1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, -1,
  ]);

  // 法向量
  const normals = new Float32Array([
    // 0123
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    // 0345
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    // 0156
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    // 1267
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    // 2347
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    // 4567
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
  ]);

  // 面
  const indices = new Uint8Array([
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
    15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
  ]);
  // ...
  
}
3.5 线性变换矩阵与模型矩阵(世界矩阵)
3.5.1 平移
[图片]
推导过程如下:
[图片]
[图片]
具体的代码实现如下:
const m4 = {
  // ...
  translation(tx, ty, tz) {
    // prettier-ignore
    return [
      1,  0,  0,  0,
      0,  1,  0,  0,
      0,  0,  1,  0,
      tx, ty, tz, 1,
    ];
  },
  // ...
}
3.5.2 缩放
[图片]
推导过程如下:
[图片]
[图片]
具体的实现如下:
const m4 = {
  // ...
  scaling(sx, sy, sz) {
    // prettier-ignore
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },
  // ...
}
3.5.3 旋转变换
绕z轴的旋转变换
[图片]
[图片]
如果你将你的右手的拇指指向旋转轴的正方向，那么你的手指弯曲的方向就指示了旋转的正方向


推导过程如下
[图片]
[图片]
实现代码如下:
const m4 = {
  // ...
  zRotation(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    // prettier-ignore
    return [
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  },
  // ...
}
3.5.4 模型矩阵/世界矩阵(modelMatrix/worldMatrix)
模型矩阵又叫世界矩阵, 是指从局部坐标转换成世界坐标的完整变换(包括了旋转平移等), 在本文的webgl例子中由于没有使用场景图, 所以模型矩阵等于transformMatrix
如果使用了场景图(也称为场景树或节点树用于描述场景中的树结构的物体节点关系), 模型矩阵的获取需要一级一级向上递归处理即逐级乘每一级的transformMatrix
export function createScene() {
  return {
    meshes: [],
    objects: [],
    groups: [],
    children: [],
    add(object) {
      this.children.push(object); // 总是添加到 children 中

      if (object.name === AbstractName.Mesh) {
        this.meshes.push(object); // 添加 mesh 到 meshes 数组
      } else if (object.name === AbstractName.Group) {
        this.groups.push(object); // 仅添加顶级 group 到 groups 数组
        // 递归添加组内的所有 mesh 到 meshes 数组
        object.children.forEach((child) => {
          if (child.name === AbstractName.Mesh) {
            this.meshes.push(child);
          } else if (child.name === AbstractName.Group) {
            // 如果组内还有子组，则递归处理
            this.add(child);
          }
        });
      } else {
        this.objects.push(object);
      }
    },
  };
}

export function createGroup() {
  return {
    name: AbstractName.Group,
    matrixes: {
      model: m4.identity(),
      localModel: m4.identity(),
      rotation: m4.identity(),
      translate: m4.identity(),
      scale: m4.identity(),
    },
    children: [],
    parent: null,
    updateModelMatrix() {
      this.matrixes.localModel = m4.multiplySeries(
        this.matrixes.translate,
        this.matrixes.rotation,
        this.matrixes.scale
      );
      this.matrixes.model = this.parent
        ? m4.multiply(this.parent.matrixes.model, this.matrixes.localModel)
        : this.matrixes.localModel;
      this.children.forEach((child) => child.updateModelMatrix());
    },
  }
}
 export function createRenderer(gl) {
  gl.enable(gl.DEPTH_TEST);
  return {
    render(scene, camera) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      scene.children.forEach((object) => {
        if ([AbstractName.Group, AbstractName.Mesh].includes(object.name))
          object.updateModelMatrix();
      });
  }
}
3.6 光线计算与法线矩阵 
3.6.1 法线矩阵(normalMatrix)
[图片]
[图片]
首先我们定义一个概念 transformMatrix:指缩放,旋转,剪切,平移(齐次)等用3阶矩阵即可实现的线性变换的矩阵的乘积, 即 transformMatrix = scaleMatrix * rotationMatrix * shearMatrix *translationMatrix
注意顺序不能随便交换.因为缩放、旋转和剪切通常都是相对于对象的原点进行的, 而平移则是移动对象到另一个位置.如果先执行平移, 再进行缩放或旋转, 对象会根据全局原点而不是自身的原点进行缩放或旋转, 这通常不是预期的效果.
当我们只进行了旋转变换那么线性变换矩阵(transformMatrix)就是rotationMatrix, 我们用transformMatrix去乘顶点坐标就实现了顶点坐标的旋转变换, 但是顶点对应的法向量还是原来的值, 我们也需要对其做相同的变换,即也用TransformMatrix乘法向量得到旋转后的新的法向量. 这个时候我们说的法线矩阵和其实旋转矩阵是一样的
当我们只进行了平移变换那么实际上法线矩阵都不需要更新.
当我们进行缩放或者剪切变换时, 可能会改变物体表面上各点之间的角度关系，导致法向量变形. 这个时候我们就不能用transformMatrix去变换法向量了, 需要用模型矩阵的逆转置矩阵去做这个法向量更新的变换, 这个方法对平移和旋转也同样适用.
延申: 为什么使用模型矩阵的逆转置矩阵变换法向量能够正确地处理缩放和剪切导致的法向量变形问题? (下面是chagpt4的回答)
等距变换和法向量
- 旋转和平移是等距变换，保持了物体的形状和大小，因此直接应用旋转矩阵到法向量上就能得到正确的结果，不需要特殊处理。
- 平移对法向量没有影响，因为法向量描述的是方向而不是位置。
非等距变换
- 对于缩放和剪切，由于它们是非等距变换，直接应用变换矩阵到法向量上会导致法向量不再垂直于变换后的表面。特别是在非均匀缩放时，法向量的方向会失真。
逆转置矩阵的作用
- 逆矩阵：对变换矩阵应用逆操作相当于将变换“撤销”。考虑到法向量是需要保持垂直于表面，逆变换可以帮助理解为什么逆操作是必要的。
- 转置操作：转置矩阵的几何意义在于它可以调换矩阵的拉伸方向。在处理法向量时，由于它们需要维持垂直于表面，转置操作有助于校正因变换而产生的拉伸或压缩。
组合起来，对模型矩阵取逆后再转置，能够为法向量提供一个正确的变换矩阵，使得在缩放和剪切后，变换的法向量仍然垂直于变换后的表面。这种方法保证了即使在非等距变换后，法向量也能正确表示表面的垂直方向，从而保证了光照和渲染的正确性。
简而言之，使用模型矩阵的逆转置矩阵来变换法向量，可以解决由于缩放和剪切变换导致的法向量变形问题，确保法向量在变换后仍正确地表示表面的法线方向。这对于光照计算尤为重要，因为正确的法线方向对于计算漫反射和镜面反射光照至关重要。
export function createMesh(geometry, material) {
  return {
    name: AbstractName.Mesh,
    geometry,
    material,
    parent: null,
    matrixes: {
      mvp: { value: null, location: null },
      model: { value: null, location: null },
      normal: { value: null, location: null },
      rotation: m4.identity(),
      translate: m4.identity(),
      scale: m4.identity(),
      localModel: m4.identity(),
    },
    updateMatrix(gl, camera) {
      const modelMatrix = this.matrixes.model.value;
      const mvpMatrix = m4.multiply(camera.matrix.vp, modelMatrix);
      this.matrixes.mvp.value = mvpMatrix;
      const normalMatrix = m4.transpose(m4.inverse(modelMatrix)); // 法线矩阵为模型矩阵的逆转置
      this.matrixes.normal.value = normalMatrix;
    }
}


const mat4 = {
  // ...
  inverse(m) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    var tmp_0 = m22 * m33;
    var tmp_1 = m32 * m23;
    var tmp_2 = m12 * m33;
    var tmp_3 = m32 * m13;
    var tmp_4 = m12 * m23;
    var tmp_5 = m22 * m13;
    var tmp_6 = m02 * m33;
    var tmp_7 = m32 * m03;
    var tmp_8 = m02 * m23;
    var tmp_9 = m22 * m03;
    var tmp_10 = m02 * m13;
    var tmp_11 = m12 * m03;
    var tmp_12 = m20 * m31;
    var tmp_13 = m30 * m21;
    var tmp_14 = m10 * m31;
    var tmp_15 = m30 * m11;
    var tmp_16 = m10 * m21;
    var tmp_17 = m20 * m11;
    var tmp_18 = m00 * m31;
    var tmp_19 = m30 * m01;
    var tmp_20 = m00 * m21;
    var tmp_21 = m20 * m01;
    var tmp_22 = m00 * m11;
    var tmp_23 = m10 * m01;

    var t0 =
      tmp_0 * m11 +
      tmp_3 * m21 +
      tmp_4 * m31 -
      (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    var t1 =
      tmp_1 * m01 +
      tmp_6 * m21 +
      tmp_9 * m31 -
      (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    var t2 =
      tmp_2 * m01 +
      tmp_7 * m11 +
      tmp_10 * m31 -
      (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    var t3 =
      tmp_5 * m01 +
      tmp_8 * m11 +
      tmp_11 * m21 -
      (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    // prettier-ignore
    return [
      d * t0,
      d * t1,
      d * t2,
      d * t3,
      d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
          (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
      d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
          (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
      d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
          (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
      d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
          (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
      d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
          (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
      d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
          (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
      d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
          (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
      d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
          (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
      d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
          (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
      d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
          (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
      d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
          (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
      d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
          (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))
    ];
  },

  // prettier-ignore
  transpose: function(m) {
    return [
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15],
    ];
  },
}
3.6.2 环境反射
[图片]
<环境反射光颜色>=<入射光颜色>*<表面基底色>
    vec3 ambient = u_ambientLightColor * vec3(u_material.color);
3.6.3 漫反射
[图片]
<漫反射光颜色>=<⼊射光颜色>*<表面基底色> * 入射角的余弦值
入射角的余弦值 = <光线方向>·<法线方向>
当漫反射和环境反射同时存在时 <表面的反射光颜色> = <漫反射光颜色>+<环境反射光颜色>
float dotDeg = max(dot(transformedNormal, lightDirection), 0.0); // 计算入射角 光线方向和法线方向的点积
vec3 diffuseColor = u_pointLight.color * vec3(color) * dotDeg; // 漫反射光的颜色
v_color = vec4(ambientColor + diffuseColor, color.a);
3.6.4 光线衰减
光线衰减的计算
[图片]
 vec3 transformedNormal = normalize(vec3(u_normalMatrix * vec4(vec3(a_normal), 0.0)));

//  计算衰减
float dist = length(u_pointLight.position -  worldPosition.xyz);
float attenuation = 1.0 / (u_pointLight.constant + u_pointLight.linear * dist + u_pointLight.quadratic * dist * dist);

float dotDeg = max(dot(transformedNormal, lightDirection), 0.0); // 计算入射角 光线方向和法线方向的点积
vec3 diffuseColor = u_pointLight.color * vec3(color) * dotDeg; // 漫反射光的颜色
v_color = vec4(ambientColor + diffuseColor * attenuation, color.a);
延申: 光照计算可以在顶点着色器或片元着色器中执行，这取决于具体的需求和预期的渲染质量
1. 在顶点着色器中执行光照计算：这种方法也被称为"Gouraud着色"。在这种情况下，光照计算是在每个顶点上执行的，然后光照的结果（即顶点的颜色）在顶点之间进行插值以着色片元。这种方法的计算成本相对较低，因为顶点的数量通常远少于片元的数量。然而，这种方法可能会导致光照不连续的现象，尤其是在几何体边缘或者光照效果高度变化的场景中。
2. 在片元着色器中执行光照计算：这种方法也被称为"Phong着色"。光照计算是在每个片元上独立执行的，允许对场景中的光照和阴影效果进行更精细的控制。因为片元的数量远远超过顶点的数量，所以这种方法提供了更高质量的渲染效果，但相应的计算开销也更大。在现代图形应用中，尤其是在追求高质量渲染效果的场景里，常常在片元着色器中进行光照计算。

3.7 实例化渲染
下面是webgl官网给出的实例化渲染的代码
'use strict';

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  const ext = gl.getExtension('ANGLE_instanced_arrays');
  if (!ext) {
    return alert('need ANGLE_instanced_arrays');  // eslint-disable-line
  }

  // setup GLSL programs
  // compiles shaders, links program
  const program = webglUtils.createProgramFromScripts(
      gl, ['vertex-shader-3d', 'fragment-shader-3d']);

  const positionLoc = gl.getAttribLocation(program, 'a_position');
  const colorLoc = gl.getAttribLocation(program, 'color');
  const matrixLoc = gl.getAttribLocation(program, 'matrix');

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -0.1,  0.4,
      -0.1, -0.4,
       0.1, -0.4,
       0.1, -0.4,
      -0.1,  0.4,
       0.1,  0.4,
       0.4, -0.1,
      -0.4, -0.1,
      -0.4,  0.1,
      -0.4,  0.1,
       0.4, -0.1,
       0.4,  0.1,
    ]), gl.STATIC_DRAW);
  const numVertices = 12;

  // setup matrices, one per instance
  const numInstances = 5;
  // make a typed array with one view per matrix
  const matrixData = new Float32Array(numInstances * 16);
  const matrices = [];
  for (let i = 0; i < numInstances; ++i) {
    const byteOffsetToMatrix = i * 16 * 4;
    const numFloatsForView = 16;
    matrices.push(new Float32Array(
        matrixData.buffer,
        byteOffsetToMatrix,
        numFloatsForView));
  }

  const matrixBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
  // just allocate the buffer
  gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);

  // setup colors, one per instance
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([
          1, 0, 0, 1,  // red
          0, 1, 0, 1,  // green
          0, 0, 1, 1,  // blue
          1, 0, 1, 1,  // magenta
          0, 1, 1, 1,  // cyan
        ]),
      gl.STATIC_DRAW);

  function render(time) {
    time *= 0.001; // seconds

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // update all the matrices
    matrices.forEach((mat, ndx) => {
      m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
      m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);
    });

    // upload the new matrix data
    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);

    // set all 4 attributes for matrix
    const bytesPerMatrix = 4 * 16;
    for (let i = 0; i < 4; ++i) {
      const loc = matrixLoc + i;
      gl.enableVertexAttribArray(loc);
      // note the stride and offset
      const offset = i * 16;  // 4 floats per row, 4 bytes per float
      gl.vertexAttribPointer(
          loc,              // location
          4,                // size (num values to pull from buffer per iteration)
          gl.FLOAT,         // type of data in buffer
          false,            // normalize
          bytesPerMatrix,   // stride, num bytes to advance to get to next set of values
          offset,           // offset in buffer
      );
      // this line says this attribute only changes for each 1 instance
      ext.vertexAttribDivisorANGLE(loc, 1);
    }

    // set attribute for color
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    // this line says this attribute only changes for each 1 instance
    ext.vertexAttribDivisorANGLE(colorLoc, 1);

    ext.drawArraysInstancedANGLE(
      gl.TRIANGLES,
      0,             // offset
      numVertices,   // num vertices per instance
      numInstances,  // num instances
    );
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();

webgl文档-实例化渲染
4. threejs
4.1 demo
暂时无法在飞书文档外展示此内容
扩展: 自r118起，WebGLRenderer会自动使用 WebGL 2 渲染上下文
4.2 几何体(Geometry)
1. 点数据 面数据 颜色数据 uv数据 法向量数据 
2. BufferGeometry
const ATTRIBUTE_LENGTH = {
    vertices: 3000, // 顶点数量*3 因为需要三个一组存储 所以顶点数量应该是1000
    indices: 666, // 三角面的数量
}

class MyGeometry extends THREE.BufferGeometry {
    constructor(...args){
        super();
        this.parameters = args;
    }
    
    init(){
        const vertices = new Float32Array(ATTRIBUTE_LENGTH.vertices);
        // 不计算光线的话 一般normals可以不设置
        // 每个顶点的法向量 我们一般设置为所在三角面的法向量
        const normals = new Float32Array(ATTRIBUTE_LENGTH.vertices); // 每个顶点需要三个值表示法向量
        // 不贴图的话 一般uv坐标可以不设置
        const uvs = new Float32Array((ATTRIBUTE_LENGTH.vertices / 3) * 2); // 每个顶点需要uv两个值
        const indices = new Uint32Array(ATTRIBUTE_LENGTH.indices); // 每个元素是顶点的索引 每三个顶点的索引指示一个三角面
        // 如果使用材质颜色的话 一般colors可以不设置
        const colors = new Uint8Array(ATTRIBUTE_LENGTH.indices); // 每个顶带你需要三个值表示颜色 对应rgb
        
        // .... 给vertices normals uvs indices设置值
        // for
        // vertices[i] = 0.1;
        // vertices[i+1] = 0.1;
        // vertices[i+2] = 0.1;
        
        // 可以给几何体设置组 一般情况下都不需要设置这个group
        this.addGroup(group1_indices_start, group1_indices_length); // 指示这些三角面是单独的一组
        this.groups[group1_index].materialIndex = 1; // 默认是0
        
        // 当我们 new THREE.Mesh(geometry, material);时 第二个参数可以是一个材质数组 THREE.Material[] 这里的materialIndex就是对应传入的材质数组的索引 就是说可以单独给几何体的某些三角面设置不一样的材质 
        
              
        this.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
        this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        // 不计算光线的话 一般normals可以不设置
        this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        // 不贴图的话 uv坐标可以不设置
        this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        const normalized = true;
        this.setAttribute('color', new THREE.BufferAttribute(colors, 3, normalized));
    }
    
    /**
     * 当初始化完毕后 后续对类型化数组进行的手动修改 都需要手动标记类型数组为需要更新
     */
    updateAttributes() {
        this.index.needsUpdate = true;
        this.attributes.position.needsUpdate = true;
        this.attributes.normal.needsUpdate = true;
        this.attributes.color.needsUpdate = true;
        this.attributes.uv.needsUpdate = true;
    }
}
4.3 常用材质(Material) 自定义材质
1. 材质的概念
  在Three.js中，材质（Material）是决定几何体外观如何被渲染的属性的集合。它定义了对象表面的颜色、是否反光、是否透明、贴图等多种特性
2. 材质的简单实现
  材质本质上就是着色器程序
export const basicShader = {
  vertex: /*glsl */ `
    attribute vec4 a_position;
    uniform mat4 u_mvpMatrix;
    uniform vec3 u_materialColor;

    varying vec4 v_color;

    void main() {
      vec4 color = vec4(u_materialColor, 1.0); // 物体表面的颜色
      v_color = color;
      vec4 vertexPosition = u_mvpMatrix * a_position;
      gl_Position =  vertexPosition;
    }
  `,
  fragment: /*glsl */ `
    precision highp float;
    varying vec4 v_color; // 从顶点着色器传来的颜色值
    
    void main() {
        gl_FragColor = v_color;
    }
  `,
};

export const shadersMap = {
  [MaterialType.Basic]: Shaders.basicShader,
  [MaterialType.Lambert]: Shaders.lambertShader,
  [MaterialType.Phong]: Shaders.phongShader,
};

export function createShaderProgram(
  gl,
  vertexShaderSource,
  fragmentShaderSource
) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertexShader, vertexShaderSource); // 指定顶点着色器的源码
  gl.shaderSource(fragmentShader, fragmentShaderSource); // 指定片元着色器的源码

  // 编译着色器
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(
      "ERROR compiling vertex shader!",
      gl.getShaderInfoLog(vertexShader)
    );
    return;
  }

  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(
      "ERROR compiling fragment shader!",
      gl.getShaderInfoLog(fragmentShader)
    );
    return;
  }

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);

  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(
      "ERROR linking program!",
      gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }
  return shaderProgram;
}

export function createMaterial(config, gl) {
  const { vertex, fragment } = shadersMap[config.type];
  const shaderProgram = createShaderProgram(gl, vertex, fragment);
  const _color = color.hexToRgbNormalized(config.color);
  return {
    shaderProgram,
    color: _color,
    attach(gl) {
      gl.useProgram(shaderProgram);
      gl.uniform3fv(
        gl.getUniformLocation(shaderProgram, "u_material.color"),
        _color
      );
      if (config.type === MaterialType.Phong) {
        gl.uniform1f(
          gl.getUniformLocation(shaderProgram, "u_material.shininess"),
          config.shininess
        );
      }
    },
  };
}
3. 常见的材质
  1. MeshBasicMaterial 简单着色的材质 和上面webgl的demo里面的Basic着色器效果一致
  2. MeshLambertMaterial 非光泽表面的材质，没有镜面高光 和上面webgl的demo里面的Lambert着色器效果基本一致
  3. MeshPhongMaterial 具有镜面高光的光泽表面的材质 和上面webgl的demo里面的Phong着色器效果基本一致
  4. MeshStandardMaterial 基于物理的标准材质
  5. MeshPhysicalMaterial 更高级的基于物理的渲染的材质
  6. MeshToonMaterial 实现卡通着色的材质
  7. PointsMaterial 粒子系统的默认材质
4. 如何自定义材质
const material = new THREE.ShaderMaterial( {
    uniforms: {
        time: { value: 1.0 },
        resolution: { value: new THREE.Vector2() }
    },
    vertexShader: vertexShaderStr,
    fragmentShader: fragmentShaderStr
} );

// 或者 直接继承THREE.ShaderMaterial

class AnnulusShaderMaterial extends THREE.ShaderMaterial {
    static annulus_texture;
    constructor() {
        super({
            vertexShader: vertex_shader,
            fragmentShader: normal_map_fragment_shader,
            vertexColors: true,
            uniforms: { customTexture: { value: null } }
        });
        this.setTexture();
    }

    setTexture() {
        if (isUndefined(AnnulusShaderMaterial.annulus_texture)) {
            const circle_texture_path = path.resolve(__dirname, './resource/annulus.png');
            AnnulusShaderMaterial.annulus_texture = new THREE.TextureLoader().load(circle_texture_path);
        }
        this.uniforms.customTexture.value = AnnulusShaderMaterial.annulus_texture;
    }
}
4.4  网格Mesh
1. 网格的概念
在Three.js中，Mesh是一种表示3D对象的类，它将几何体（Geometry或BufferGeometry）和材质（Material）结合起来，在3D场景中创建可视化的物体。Mesh是继承自Object3D的，这意味着它具备了位置（position）、旋转（rotation）、缩放（scale）等属性，可以被加入到场景中并进行相应的变换
2. 网格的简单实现
export function createMesh(geometry, material) {
  return {
    name: AbstractName.Mesh,
    geometry,
    material,
    parent: null,
    matrixes: {
      mvp: { value: null, location: null },
      model: { value: null, location: null },
      normal: { value: null, location: null },
      rotation: m4.identity(),
      translate: m4.identity(),
      scale: m4.identity(),
      localModel: m4.identity(),
    },
    attach(gl) {
      material.attach(gl);
      const program = this.material.shaderProgram;
      gl.useProgram(program);
      this.matrixes.mvp.location = gl.getUniformLocation(
        program,
        "u_mvpMatrix"
      );
      this.matrixes.model.location = gl.getUniformLocation(
        program,
        "u_modelMatrix"
      );
      this.matrixes.normal.location = gl.getUniformLocation(
        program,
        "u_normalMatrix"
      );

      geometry.attach(gl, program);
      return {};
    },

    updateModelMatrix() {
      this.matrixes.localModel = m4.multiplySeries(
        this.matrixes.translate,
        this.matrixes.rotation,
        this.matrixes.scale
      );
      this.matrixes.model.value = this.parent
        ? m4.multiply(this.parent.matrixes.model, this.matrixes.localModel)
        : this.matrixes.localModel;
    },

    updateMatrix(gl, camera) {
      const modelMatrix = this.matrixes.model.value;
      const mvpMatrix = m4.multiply(camera.matrix.vp, modelMatrix);
      this.matrixes.mvp.value = mvpMatrix;
      const normalMatrix = m4.transpose(m4.inverse(modelMatrix)); // 法线矩阵为模型矩阵的逆转置
      this.matrixes.normal.value = normalMatrix;
      gl.uniformMatrix4fv(this.matrixes.model.location, false, modelMatrix);
      gl.uniformMatrix4fv(
        this.matrixes.mvp.location,
        false,
        this.matrixes.mvp.value
      );
      gl.uniformMatrix4fv(
        this.matrixes.normal.location,
        false,
        this.matrixes.normal.value
      );
    },
    setRotation(xDeg, yDeg, zDeg) {
      this.matrixes.rotation = m4.multiplySeries(
        m4.identity(),
        m4.xRotation(xDeg),
        m4.yRotation(yDeg),
        m4.zRotation(zDeg)
      );
    },
    setPosition(x, y, z) {
      this.matrixes.translate = m4.multiplySeries(
        m4.identity(),
        m4.translation(x, y, z)
      );
    },
    setScale(x, y, z) {
      this.matrixes.scale = m4.multiplySeries(
        m4.identity(),
        m4.scaling(x, y, z)
      );
    },
  };
}
4.5 光源(Light)
1. 光源的概念
在Three.js中，光源（Light）是影响场景中物体渲染效果的重要因素之一。光源能模拟现实世界中的光照效果，如阳光、灯光等，它们与材质（Material）和几何体（Geometry）共同作用，决定了物体的最终外观
2. 光源的实现
export function createAmbientLight(config) {
  const _color = color.hexToRgbNormalized(config.color);
  return {
    color: _color,
    attach(gl, program) {
      gl.uniform3fv(
        gl.getUniformLocation(program, "u_ambientLightColor"),
        _color
      );
    },
  };
}

export function createPointLight(pointLight) {
  const _color = color.hexToRgbNormalized(pointLight.color);
  return {
    ...pointLight,
    attach(gl, program) {
      gl.uniform3fv(
        gl.getUniformLocation(program, "u_pointLight.position"),
        pointLight.position
      );
      gl.uniform3fv(
        gl.getUniformLocation(program, "u_pointLight.color"),
        _color
      );
      gl.uniform1f(
        gl.getUniformLocation(program, "u_pointLight.constant"),
        pointLight.attenuation[0]
      );
      gl.uniform1f(
        gl.getUniformLocation(program, "u_pointLight.linear"),
        pointLight.attenuation[1]
      );
      gl.uniform1f(
        gl.getUniformLocation(program, "u_pointLight.quadratic"),
        pointLight.attenuation[2]
      );
    },
  };
}
3. 常见的光源的分类与特性
  1. AmbientLight 环境光，从各个方向均匀照射场景中的所有物体，没有方向性，也不会产生阴影。它通常用于为场景提供基础的明亮度，模拟光线散射产生的均匀效果
  2. DirectionalLight 平行光，模拟远处的光源（如太阳），所有的光线都沿着同一个方向发射，能产生阴影。它适用于模拟日光等远处光源的效果
  3. PointLight 点光源，从一个点向所有方向均匀发散光线，类似于裸露的灯泡或蜡烛。点光源可以产生阴影，并且可以通过设置衰减参数来模拟光线随距离减弱的效果
  4. SpotLight 聚光灯，从一个点沿特定方向发射锥形光束，模拟手电筒或舞台灯光等效果。聚光灯可以产生阴影，并且可以设置锥形光束的大小和衰减
4.6 相机(Camera)
1. 相机的概念
在Three.js中，相机（Camera）决定了3D场景中哪部分内容将被渲染到屏幕上。它模拟了人眼或摄像机的观察角度，定义了视场（what is seen）的位置、方向和深度
2. 相机的简单实现
export const m4 = {
  //...
  perspective(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);
    // prettier-ignore
    return [
      f / aspect, 0, 0,                         0,
      0,          f, 0,                         0,
      0,          0, (near + far) * rangeInv,   -1,
      0,          0, near * far * rangeInv * 2, 0
    ];
  }
  
 lookAt(cameraPosition, target, up) {
    var zAxis = v3.normalize(v3.subtractVectors(cameraPosition, target));
    var xAxis = v3.normalize(v3.cross(up, zAxis));
    var yAxis = v3.normalize(v3.cross(zAxis, xAxis));
    // prettier-ignore
    return [
        xAxis[0],       xAxis[1],      xAxis[2],        0,
        yAxis[0],       yAxis[1],      yAxis[2],        0,
        zAxis[0],       zAxis[1],      zAxis[2],        0,
        cameraPosition[0], cameraPosition[1], cameraPosition[2], 1,
      ];
  },
}

export function createCamera(config) {
  const { position, target, up, fov, aspect, near, far } = config;

  const cameraMatrix = m4.lookAt(position, target, up);
  const viewMatrix = m4.inverse(cameraMatrix);

  const projectionMatrix = m4.perspective(fov, aspect, near, far);

  const vpMatrix = m4.multiply(projectionMatrix, viewMatrix);

  return {
    ...config,
    matrix: {
      camera: cameraMatrix,
      projection: projectionMatrix,
      view: viewMatrix,
      vp: vpMatrix,
    },
    attach(gl, program) {
      gl.useProgram(program);
      gl.uniform3fv(
        gl.getUniformLocation(program, "u_cameraPosition"),
        position
      );
    },
  };
}
3. 正交相机与透视相机
  1. PerspectiveCamera 透视相机
    透视相机是最常用的相机类型，它模拟了人眼所看到的视角，近大远小，用于创建真实世界的透视效果。这种相机非常适合大多数3D场景 
    透视相机的几个重要参数包括：
    - fov（Field of View，视角）：摄像机视锥体垂直视角的大小，以度为单位。
    - aspect（宽高比）：渲染输出的宽度除以高度。
    - near和far：摄像机到视景体最近、最远的距离，只有在这个范围内的对象才会被渲染
  2. OrthographicCamera 正交相机
    正交相机使用正交投影，即在这种相机视角中，来自场景中所有物体的光线平行地进入相机，不会因距离远近产生大小变化。这种相机常用于2D渲染和某些特定的3D场景，如建筑可视化。
    正交相机的主要参数包括：
    - left、right：视锥体左侧和右侧的平面。
    - top、bottom：视锥体上侧和下侧的平面。
    - near和far：与透视相机相同，表示视锥体的近平面和远平面。
    
4.7 场景(Scene)与组(Group)
1. 场景的概念
  在Three.js中，Scene对象是一个场景图的容器，它允许你设置和管理要渲染的3D世界的所有部分，包括光源、物体、相机和其他图形对象。可以将Scene想象成一个虚拟的3D空间，其中包含了所有你希望在屏幕上渲染的内容。它是Three.js中最基本的组成部分之一，用于组织和存储渲染过程中需要的各种元素
2. 场景的简单实现
export function createScene() {
  return {
    meshes: [],
    objects: [],
    groups: [],
    children: [],
    add(object) {
      this.children.push(object); // 总是添加到 children 中

      if (object.name === AbstractName.Mesh) {
        this.meshes.push(object); // 添加 mesh 到 meshes 数组
      } else if (object.name === AbstractName.Group) {
        this.groups.push(object); // 仅添加顶级 group 到 groups 数组
        // 递归添加组内的所有 mesh 到 meshes 数组
        object.children.forEach((child) => {
          if (child.name === AbstractName.Mesh) {
            this.meshes.push(child);
          } else if (child.name === AbstractName.Group) {
            // 如果组内还有子组，则递归处理
            this.add(child);
          }
        });
      } else {
        this.objects.push(object);
      }
    },
  };
}
3. 组的概念
在Three.js中，Group对象是一种特殊的Object3D，用于将多个对象组合成一个单独的对象群组。这使得可以对一组对象执行统一的变换操作，例如平移、旋转和缩放，而不必单独操作每一个对象。Group的使用简化了场景图的管理，特别是当你需要对一系列对象作为整体进行操作时
4. 组的简单实现
export function createGroup() {
  return {
    name: AbstractName.Group,
    matrixes: {
      model: m4.identity(),
      localModel: m4.identity(),
      rotation: m4.identity(),
      translate: m4.identity(),
      scale: m4.identity(),
    },
    children: [],
    parent: null,
    add(object) {
      this.children.push(object);
      object.parent = this;
    },
    updateModelMatrix() {
      this.matrixes.localModel = m4.multiplySeries(
        this.matrixes.translate,
        this.matrixes.rotation,
        this.matrixes.scale
      );
      this.matrixes.model = this.parent
        ? m4.multiply(this.parent.matrixes.model, this.matrixes.localModel)
        : this.matrixes.localModel;
      this.children.forEach((child) => child.updateModelMatrix());
    },
    setRotation(xDeg, yDeg, zDeg) {
      this.matrixes.rotation = m4.multiplySeries(
        m4.identity(),
        m4.xRotation(xDeg),
        m4.yRotation(yDeg),
        m4.zRotation(zDeg)
      );
    },
    setPosition(x, y, z) {
      this.matrixes.translate = m4.multiplySeries(
        m4.identity(),
        m4.translation(x, y, z)
      );
    },
    setScale(x, y, z) {
      this.matrixes.scale = m4.multiplySeries(
        m4.identity(),
        m4.scaling(x, y, z)
      );
    },
  };
}
5. 优化
1. 复用材质
  少切换着色器程序, 切换着色器程序有加载的开销
2. 使用计算量少的材质(比如Lambert)
一般来说在片元着色器中进行光照计算的材质GPU开销很大, 片元着色器调用次数一般都远大于顶点着色器次数
3. 合并批次渲染
比如大geometry, 在一次绘制(draw)中渲染更多的物体 前提是这些物体的attribute需要在一块
4. 实例化渲染(THREE.InstanMesh)
InstancedMesh允许你高效地渲染大量相同几何体的实例，但每个实例可以具有不同的变换（位置、旋转、缩放）和材质属性（如颜色）。这比传统的逐个渲染每个对象方式要高效得多，因为它大大减少了对GPU的绘制调用，从而提高了渲染性能。这在需要渲染大量相似对象的场景中非常有用，如森林、草地、城市等
// 创建一个几何体和材质
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });

// 定义实例数量
const instanceCount = 100;

// 创建InstancedMesh对象
const instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount);

// 使用矩阵为每个实例设置位置和旋转
const dummy = new THREE.Object3D();

for (let i = 0; i < instanceCount; i++) {
    // 随机设置每个实例的位置
    dummy.position.set(
        Math.random() * 20 - 10,
        Math.random() * 20 - 10,
        Math.random() * 20 - 10
    );
    // 随机设置每个实例的旋转
    dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    dummy.updateMatrix();
    // 将这个变换应用到instancedMesh的第i个实例上
    instancedMesh.setMatrixAt(i, dummy.matrix);
}

// 更新实例的变换信息
instancedMesh.instanceMatrix.needsUpdate = true;

// 将instancedMesh添加到场景中
scene.add(instancedMesh);

5. 时间优化
浏览器的开发者工具中的performance
6. 内存优化
  浏览器的开发者工具中的Memory => Allocation sampling
7. 调试
  webgl的调试可以用浏览器插件spector
[图片]

