### 1. 什么是 ThreeJS？

ThreeJS 是一个用于创建 3D 图形的 JavaScript 库。它是一个开源项目，由 WebGL 和 HTML5 canvas 技术驱动。

### 2. ThreeJS 中的几何体(Geometry)是什么？

几何体是 ThreeJS 中用于创建 3D 模型的基本构建块。这些几何体包括立方体、球体、圆柱体、圆环体、平面等。

### 3. ThreeJS 中的组(Group)是什么？

组是 ThreeJS 中用于组合多个对象的容器。可以将对象添加到组中，以便一起移动、旋转或缩放它们。

### 4. 如何创建 ThreeJS 场景？

创建 ThreeJS 场景需要创建一个场景对象，并将所需的几何体、光源、相机等添加到场景中


### 5. 手写一个threejs的小demo

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
    </head>
    <body>
        <div id="container111" style="width:600px;height:300px;position:relative;"></div>
    </body>
    <script type="module">
        import * as THREE from 'https://unpkg.com/three/build/three.module.js';
        const scene = new THREE.Scene();
        const container = document.querySelector("#container111");
        const camera = new THREE.PerspectiveCamera( 75, container.clientWidth / container.clientHeight, 0.1, 1000 );
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize( container.clientWidth, container.clientHeight );
        container.appendChild( renderer.domElement );
        const geometry = new THREE.BoxGeometry( 1, 1, 1 );
        const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        const cube = new THREE.Mesh( geometry, material );
        scene.add( cube );
        camera.position.z = 5;
        function animate() {
            requestAnimationFrame( animate );
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render( scene, camera );
        }
        animate();
    </script>
</html>
```

### 6. ThreeJS 中的相机是什么？

三维空间需要一个相机来拍摄场景。ThreeJS 中有多种相机类型可供选择，包括透视相机（PerspectiveCamera）、正交相机（OrthographicCamera）等。

### 7. ThreeJS 中的光源有哪些类型？

在 ThreeJS 中，有几种不同类型的光源可供选择。其中包括环境光（AmbientLight）、点光源（PointLight）、平行光（DirectionalLight）和聚光灯（SpotLight）。

### 8. ThreeJS 中的材质有哪些类型？

在 ThreeJS 中，有许多不同类型的材质可供选择，以适应各种不同类型的几何体。这些包括基础材质（MeshBasicMaterial）、标准材质（MeshStandardMaterial）和物理材质（MeshPhysicalMaterial）等等。

### 9. ThreeJS 中的渲染器是什么？

渲染器是 ThreeJS 中用于将创建的场景呈现在屏幕上的核心组件。它使用 WebGL 或 canvas 技术将场景中的图形绘制到浏览器中

### 10. 什么是 WebGL？什么是 Three.js？请解释three.js中的WebGL和Canvas的区别？

WebGL(全写Web Graphics Library)是一种3D绘图协议，这种绘图技术标准允许把JavaScript和OpenGL ES 2.0结合在一起，通过增加OpenGL ES 2.0的一个JavaScript绑定，WebGL可以为HTML5 Canvas提供硬件3D加速渲染，这样Web开发人员就可以借助系统显卡来在浏览器里更流畅地展示3D场景和模型了，还能创建复杂的导航和数据视觉化。WebGL技术标准免去了开发网页专用渲染插件的麻烦，可被用于创建具有复杂3D结构的网站页面，甚至可以用来设计3D网页游戏等等。
Three.js是一款基于JavaScript可直接运行GPU驱动游戏与图形驱动应用于浏览器的WebGL引擎，其库提供的特性与API以绘制3D场景于浏览器。
Canvas与WebGL的区别是canvas API提供二维绘图方式，图形的绘制主要通过`CanvasRenderingContext2D`接口完成，通过 canvas.getContext('2d') 获取二维图像绘图上下文；而WebGL  API可以在任何兼容canvas中的渲染2d和3d图形，WebGL API 提供三维接口，图形绘制主要通过`WebGLRenderingContext`接口完成，通过`canvas.getContext('webgl')`来获取WebGL上下文。

### 11. Three.js它有什么特点和优势？以及它为什么会被广泛使用？

Three.js提供了一系列简化的API和工具，使得创建三维图形更加容易的展现在浏览器端。其抽象了底层的复杂性，提供了简单、一致的接口。提供基本的渲染功能之外，还包括了丰富的扩展，如光照、贴图、粒子系统等，可以满足不同类型的三维图形需求。Three.js有一个活跃的社区，提供了大量的文档、教程和示例，方便开发者学习和解决问题。
随着社会的信息化的发展，在数据可视化、图形/游戏引擎、交互演示、图形渲染、地图、VR、物品展示、室内设计、城市规划等方面Web端展示3D的需求大量增多，人们迫切需求一款能打开浏览器即可使用的便捷式3D开发引擎，而基于JavaScript的WebGL引擎Threejs恰好可以满足这一要求，所以得以大规模应用


### 12. Three.js的基本组件和类有哪些？

Three.js的基本组件有场景(Scene)、相机(Camera)、渲染器(Renderer)；
常见的类有`Object3D`、`BufferGeometry`、`Geometry`、`BufferAttribute`、`Layers`、`Raycaster`等；
Object3D类：Object3D是ThreeJs中对物体抽象的基类,包括相机和灯光都是Object3D的子类.一般情况下,我们不会直接使用这个类,对于构造物体,一般我们都是使用的Mesh.
BufferGeometry类：是面片、线或点几何体的有效表述.包括顶点位置,面片索引、法相量、颜色值、UV坐标和自定义缓存属性值.使用BufferGeometry可以有效减少向 GPU 传输上述数据所需的开销.
Geometry类：Geometry 是对 BufferGeometry 的替代,Geometry利用Vector3或Color存储了几何体的相关 attributes(如顶点位置,面信息,颜色等),但比起BufferGeometry更容易读写,但是运行效率不如有类型的队列.
BufferAttribute类：这个类用于存储与BufferGeometry相关联的attribute(例如顶点位置向量,面片索引,法向量,颜色值,UV坐标以及任何自定义attribute).利用BufferAttribute,可以更高效的向GPU传递数据.详情和例子见该页.
在BufferAttribute中,数据被存储为任意长度的矢量(通过itemSize进行定义),下列函数如无特别说明, 函数参数中的index会自动乘以矢量长度进行计算. 当想要处理类似向量的数据时, 可以使用在Vector2,Vector3,Vector4以及Color这些类中的.fromBufferAttribute(attribute,index) 方法来更为便捷地处理.
Layers类：Layers对象为Object3D分配1个到32个图层.32个图层从0到31编号标记.在内部实现上,每个图层对象被存储为一个bit mask,默认的,所有Object3D对象都存储在第0个图层上.图层对象可以用于控制对象的显示.当camera的内容被渲染时与其共享图层相同的物体会被显示.每个对象都需要与一个camera共享图层.每个继承自Object3D的对象都有一个Object3D.layers对象.
Raycaster类：这个类用于进行raycasting(光线投射）.光线投射用于进行鼠标拾取(在三维空间中计算出鼠标移过了什么物体).

### 13. three.js中的场景 (scene)、相机 (camera)和渲染器 (renderer)的作用？

场景是Three.js 中所有 3D 对象的容器。它定义了 3D 空间中的位置、方向和光照。
相机定义了 3D 场景中的视角。通过设置相机的位置和角度，可以控制场景中的视觉效果。
渲染器将场景和相机中的 3D 对象渲染到屏幕上。Three.js 提供了多个渲染器，包括 CanvasRenderer、WebGLRenderer 和 SVGRenderer。

### 14. Three.js 如何创建和处理几何体 **( **Geometry **)? **three.js中的常见几何体（例如立方体、球体、圆柱体等）是如何被创建的？

```js
var geometry = new THREE.BoxGeometry(1, 1, 1);
var material = new THREE.MeshBasicMaterial({color: 0xff0000});
var cube = new THREE.Mesh(geometry,material);
scene.add(cube);
```

### 15. 写一个使用BufferGeometry的例子

```js
// 创建场景
const scene = new THREE.Scene();

// 创建摄像机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 创建渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 定义顶点坐标（两个三角形组成一个四边形）
const vertices = new Float32Array([
    -1.0, -1.0, 0.0,  // 第一个三角形的第一个顶点
     1.0, -1.0, 0.0,  // 第一个三角形的第二个顶点
    -1.0,  1.0, 0.0,  // 第一个三角形的第三个顶点
     1.0, -1.0, 0.0,  // 第二个三角形的第一个顶点
     1.0,  1.0, 0.0,  // 第二个三角形的第二个顶点
    -1.0,  1.0, 0.0   // 第二个三角形的第三个顶点
]);

// 定义法向量
const normals = new Float32Array([
    0.0, 0.0, 1.0,  // 第一个三角形的法向量
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,  // 第二个三角形的法向量
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0
]);

// 定义颜色
const colors = new Float32Array([
    1.0, 0.0, 0.0,  // 第一个顶点的颜色 (红色)
    0.0, 1.0, 0.0,  // 第二个顶点的颜色 (绿色)
    0.0, 0.0, 1.0,  // 第三个顶点的颜色 (蓝色)
    1.0, 0.0, 0.0,  // 第四个顶点的颜色 (红色)
    0.0, 1.0, 0.0,  // 第五个顶点的颜色 (绿色)
    0.0, 0.0, 1.0   // 第六个顶点的颜色 (蓝色)
]);

// 定义 UV 坐标
const uvs = new Float32Array([
    0.0, 0.0,  // 第一个顶点的 UV 坐标
    1.0, 0.0,  // 第二个顶点的 UV 坐标
    0.0, 1.0,  // 第三个顶点的 UV 坐标
    1.0, 0.0,  // 第四个顶点的 UV 坐标
    1.0, 1.0,  // 第五个顶点的 UV 坐标
    0.0, 1.0   // 第六个顶点的 UV 坐标
]);

// 创建 BufferGeometry
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

// 创建材质，启用顶点颜色
const material = new THREE.MeshBasicMaterial({ vertexColors: true });

// 创建网格
const mesh = new THREE.Mesh(geometry, material);

// 将网格添加到场景
scene.add(mesh);

// 渲染循环
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
```

### 16. 如何使three.js来创建复杂的3D模型和场景？

创建复杂的3D模型和场景需要使用Three.js提供的各种高级功能和技术。可以通过加载外部3D模型文件来创建复杂的模型，如.obj或.fbx文件。可以使用Three.js提供的各种几何体工具来构建自定义模型。对于复杂的场景，可以通过管理多个场景对象、使用光源和阴影、应用材质和纹理等来实现。


### 17. 什么是模型导入器Model Loader？Three.js中有哪些常用的模型导入器？

通常叫做模型加载器，一般用来加载外部特定格式的模型文件；常用的模型加载器有GLTFLoader GLTF模型加载器、OBJLoader OBJ模型加载器、STLLoader STL模型加载器、 FBXLoader动画模型加载器等等。

### 18. 哪一种三维物体格式能够得到最好地支持？

推荐使用GLTF(gl传输格式)来对三维物体进行导入和导出,glTF(gl传输格式)是一种开放格式的规范 (open format specification), 用于更高效地传输、加载3D内容。该类文件以JSON(.gltf)格式或二进制（.glb）格式提供,外部文件存储贴图(.jpg、.png)和额外的二进制数据(.bin).一个glTF组件可传输一个或多个场景， 包括网格、材质、贴图、蒙皮、骨架、变形目标、动画、灯光以及摄像机等。

### 19. Three.js 的光照模型有哪些种类？如何应用？

Three.js常见的光源类型有 环境光(AmbientLight) 点光源(PointLight) 聚光灯(SpotLight) 平行光(DirectinalLight) 等。

环境光(AmbientLight)：类似于漫反射，没有光照起点，环境光可以放在任意一个位置，不会衰减，不需要设置光强，各个点都一样，所以不用设置位置。环境光不支持阴影；
点光源(PointLight)：类似于照明弹，点光源是从一个点出发，向各个方向发射光线。其第一个参数表示光颜色；第二个参数表示光照强度，范围为0～1；第3个参数表示光照距离，默认为0，表示无限远；第4个参数表示光照强度随着光照防线逐渐衰减的量，默认为1。

聚光灯(SpotLight)：聚光灯从开始位置以锥形的照射向目标位置发射光线，默认目标位置为原点。第一个参数表示颜色，默认为白色；第二个参数表示光强，默认为1，范围0～1；第三个参数表示光照距离，默认为根据光源距离，线性衰减光源的最大距离；第4个参数表示Math.PI/2；第5个参数表示根据光照锥形计算的阴影的百分比；第6个参数表示光照强度随着光照防线逐渐衰减的量。

平行光(DirectinalLight)：从其位置开始，向目标方向照射，不会随着距离而衰减；目标方向默认是原点，可以自定义，然而对于自定义目标位置，也需要加入到场景中才会生效；类似于太阳光；方向光的创建接收2个参数，第一个表示光照颜色，第二个表示光照强度，光照强度取值范围为0～1，光照递增；

### 20. 什么是法线贴图（Normal Mapping）

法线贴图（Normal Mapping）是一种在计算机图形学中用于增强表面细节的技术，而不增加模型的多边形数量。它是一种更高级的纹理映射技术，用于模拟光照对复杂表面的影响。这种技术特别适用于视频游戏和3D渲染，其中资源和计算能力可能有限。

法线贴图的工作原理
基本概念：在3D图形中，"法线"是垂直于表面的一个向量。它决定了表面与光线相互作用的方式，从而影响光照效果和阴影。
纹理的使用：法线贴图实际上是一种特殊的纹理，它存储了表面上每一点的法线信息。这些信息被编码为纹理的颜色值，通常使用RGB颜色通道来表示三维空间中的向量。
细节模拟：通过改变法线向量，法线贴图模拟了表面细节的变化，如凹凸不平、裂缝或其他纹理。这种变化影响了光照在表面上的分布，从而在视觉上产生更加复杂和详细的表面效果。
性能优势：使用法线贴图可以在不显著增加模型复杂度或渲染负担的情况下，实现高度详细的视觉效果。这对于需要实时渲染的应用程序（如视频游戏）尤其重要。
法线贴图与置换贴图的区别
法线贴图与置换贴图（Displacement Mapping）经常被并提，但它们有本质的区别：

法线贴图改变的是光照对表面的影响，但不改变几何体的实际形状。因此，它对性能的影响较小，但不适合模拟高度显著的几何变化。
置换贴图实际改变了几何体的形状，可以创建真实的几何细节，但代价是更高的计算复杂度。
总之，法线贴图是一种有效的技术，用于在保持渲染性能的同时增加3D模型的视觉细节。

### 21. 什么是环境贴图（Environment Mapping）？

环境贴图（Environment Mapping）是一种在计算机图形学中用于模拟周围环境对物体表面反射的技术。这种技术广泛用于创建金属、水面、玻璃等具有高反射性的材料的视觉效果。环境贴图提供了一种有效的方式来模拟复杂环境的反射，而无需实时计算周围每个物体的反射效果，从而在保持较高视觉真实感的同时减少计算负担。

环境贴图的工作原理
捕捉环境：首先，需要捕捉周围环境的图像。这可以通过渲染场景的全景图、使用现实世界的照片，或预先绘制的图像来完成。

映射到物体：这些环境图像被映射到3D物体的表面。根据物体的几何形状和视角，环境贴图决定了物体表面应该反射的环境部分。

反射效果：环境贴图模拟了光线从物体表面反射进入观察者眼睛的效果。这种反射取决于物体的材料属性（如光泽度和反射率）、观察者的角度，以及环境本身的特性。


### 22. three.js中的材质（Material）、纹理（Texture）、贴图(Texture Map)的区别？

材质（Material）是描述物体外观和光学特性的属性集合。它包括物体的颜色、反射属性（如漫反射、高光反射）、透明度、折射率等。材质定义了物体如何与光线进行交互，决定了物体在渲染时的外观效果。

纹理（Texture）是一种图像，用于模拟物体表面的细节和纹理。它可以包含颜色信息、细节图案、纹理细节等。通过将纹理映射到模型表面，可以赋予模型更加真实的外观和细节。

贴图（Texture Map） 是将纹理应用到3D模型表面的过程。贴图是通过将纹理图像与模型的顶点或像素相匹配，使得纹理图像覆盖在模型表面，在渲染过程中，根据贴图的坐标信息来确定模型表面的颜色、纹理细节等。

### 23. three.js如何实现镜面反射和折射效果？

在 Three.js 中实现镜面反射和折射效果通常涉及到环境贴图（Environment Mapping）的使用。环境贴图能够模拟光线在物体表面的反射和折射，从而创造出这些效果。下面是实现这两种效果的基本方法：

镜面反射（Mirror Reflection）
镜面反射可以通过使用环境贴图来实现。在 Three.js 中，可以使用 CubeTexture 或 CubeReflectionMapping 来创建这种效果。通常步骤如下：

创建环境贴图：使用一组表示环境的六个图像（通常是立方体贴图）创建一个环境贴图。
应用贴图到材质：将环境贴图应用到反射性材质中，如 MeshPhongMaterial 或 MeshStandardMaterial。
调整反射属性：调整材质的反射率（reflectivity）和反射贴图（envMap）来控制反射效果。
折射效果（Refraction）
折射效果可以通过修改环境贴图来实现，使得光线看起来像是在物体内部或通过透明物体弯曲。在 Three.js 中，这可以通过调整材质的折射率和透明度来实现：

创建环境贴图：与反射类似，首先创建一个环境贴图。
应用贴图到材质：使用一个支持透明度的材质，如 MeshPhysicalMaterial。
调整折射属性：设置材质的 refractionRatio 和 envMap 属性来模拟光线通过物体时的弯曲效果。
代码示例
以下是一个简单的代码示例，展示了如何为一个球体设置镜面反射：

```js
// 加载立方体贴图
const loader = new THREE.CubeTextureLoader();
const texture = loader.load([
    'px.jpg', 'nx.jpg',
    'py.jpg', 'ny.jpg',
    'pz.jpg', 'nz.jpg'
]);

// 创建反射性材质
const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    envMap: texture, // 设置环境贴图
    metalness: 1.0, // 金属感强度
    roughness: 0.0  // 粗糙度
});

// 创建球体
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const sphere = new THREE.Mesh(sphereGeometry, material);
scene.add(sphere);
```

在 Three.js 中，还有另外一种实现镜面反射的方案，即插件Reflector 是一个用于实现镜面反射效果的插件。它基于平面几何体创建一个反射表面，模拟镜子的效果。

### 24. three.js中的几何变换（例如平移、旋转、缩放等）如何实现？

平移：设置模型的position或者translateX、translateY、translateZ等；
如果要求沿着自定义方向平移，
var axis = new THREE.Vector3(1, 1, 1); // 向量Vector3对象表示方向
axis.normalize(); // 向量归一化
mesh.translateOnAxis(axis, 100);  // 沿着axis轴表示方向平移100
旋转： rotateX、rotateY、rotateZ 沿X、Y、Z轴旋转
沿自定义轴旋转
var axis = new THREE.Vector3(0,1,0); // 向量axis
mesh.rotateOnAxis(axis,Math.PI/8); // 绕axis轴旋转π/8
缩放： 修改scale的值，1以上表示放大多少，1以下表示缩小多少


### 25. 什么是动画？three.js中的动画有哪些类型？如何创建动画和更新？

简单动画：利用物体的平移、缩放、旋转、闪烁等创建的动画；
摄像机动画：使用摄像机来实现第一人称视角、飞行视角、翻滚控制、轨迹球、轨道控制等动画；
变形动画：变形动画，要定义网格变形之后的关键位置。对于变形目标，所有顶点位置都会被存储下来。你需要做的就是将所有顶点从一个位置移动到另外一个定义好的关键位置，并重复该过程。
骨骼动画：使用骨骼动画需要定义骨骼，也就是网格的骨头，并将顶点绑定到特定的骨头上。然后移动一块骨头时，任何与其相连的骨头都会做相应的移动，同时骨头上绑定到顶点也会随之移动。网格的变形也是基于骨头的位置、移动和缩放实现的。
帧动画：创建关键帧动画，并控制其播放。
简单动画就是改变物体的长宽高位置颜色等属性，摄像机动画的第一人称视角通过FirstPersonControls(第一视角控制器)或PointerLockControls来实现，该控制器类似于第一视角射击游戏中的摄像机。使用键盘控制移动，使用鼠标转动。飞行视角通过FlyControls(飞行模拟控制器)，用键盘鼠标控制摄像机移动。RollControls(翻滚控制器)该控制器是飞行控制器的简化版，允许绕着z轴旋转。TrackBallControls(轨迹球控制器),最常用的控制器，可以用鼠标(或者控制球)来轻松移动、平移和缩放场景。注意，OrtographicCamera摄像机专用控制器为OrtographicTrack BallControls。OrbitControls(轨道控制器)该控制器可以在特定场景中模拟轨道中的卫星，你可以使用鼠标键盘在场景中游走。除了使用控制器，还可以使用修改position属性移动摄像机,空过lookAt()方法改变摄像机的朝向。
three.js提供了三个核心动画类：
**THREE.AnimationClip： **当具有动画数据的模型被加载后，获得的模型对象往往具有一个名为animations的成员对象。该对象包含了一个THREE.AnimationClip对象集合。一个模型所包含的THREE.AnimationClip对象通常保存有某种特定类型的动画数据，或者是该模型能够执行的某种动作。例如，加载一个小鸟的模型，它可能包含两个THREE.AnimationClip对象，一个是拍打翅膀的动作，另一个是张嘴闭嘴的动作。
**THREE.AnimationMixer： **THREE.AnimationMixer对象用于控制多个THREE.AnimationClip对象，确保这些动画在适当的时间发生，使动画同步或者控制从一个动画过渡到另一个动画。
**THREE.AnimationAction： **当THREE.AnimationMixer对象添加一个THREE.AnimationClip对象时，调用者将会获得一个THREE.AnimationAction。很多动画控制功能是通过THREE.AnimationAction来调用的，而THREE.AnimationMixer本身并没有提供很全面的接口。除了添加动画外，THREE.AnimationAction对象也可以随时从THREE.AnimationMixe获取。

### 26. Three.js 中如何实现动画，包括基于时间的动画和骨骼动画？

你可以使用 requestAnimationFrame 或 Three.js 的动画循环来创建基于时间的动画。骨骼动画则涉及骨骼和动画混合器，用于控制模型的骨骼动作。


### 27. three.js如何实现交互操作，例如鼠标控制和触摸控制？

three.js可以通过鼠标交互 **、 **触摸交互 **、 **键盘交互 **、 **碰撞检测 、 ****物理引擎等方式交互。
鼠标交互:可以使用threeJS中的鼠标事件来实现模型的交互，例如点击、拖拽、旋转等。
触摸交互:对于移动设备，可以使用threeJS中的触摸事件来实现模型的交互，例如滑动、缩放等。
键盘交互:可以使用threeJS中的键盘事件来实现模型的交互，例如按键控制模型的移动、旋转等。
碰撞检测:可以使用threeJS中的碰撞检测功能来实现模型之间的交互，例如模型之间的碰撞、触发事件等。
物理引擎:可以使用threeJS中的物理引擎来实现模型的物理交互，例如重力、摩擦力、弹性等。
通过OrbitControls插件给模型添加缩放，旋转，平移和拖拽等效果；
通过EffectComposer效果组合插件和OutlinePass插件给模型添加光晕等效果；
通过Raycaster光影投射实现鼠标拾取效果；


### 28. 什么是缓冲区？在three.js中如何使用缓冲区？

缓冲区是用于存储和管理数据的一种内存区域。在Three.js中，可以通过BufferGeometry来创建自定义的缓冲区，以实现更高效的渲染。例如，可以通过BufferGeometry来直接操作顶点数据、索引数据和材质数据等。

https://juejin.cn/post/7304917265941069875