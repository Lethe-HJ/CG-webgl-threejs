# three的着色器

```js
import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";
import * as dat from "dat.gui";

// 顶点着色器
import basicVertexShader from "../shader/raw/vertex.glsl";
// 片元着色器
import basicFragmentShader from "../shader/raw/fragment.glsl";

// 目标：认识shader

//创建gui对象
const gui = new dat.GUI();

// console.log(THREE);
// 初始化场景
const scene = new THREE.Scene();

// 创建透视相机
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerHeight / window.innerHeight,
  0.1,
  1000
);
// 设置相机位置
// object3d具有position，属性是1个3维的向量
camera.position.set(0, 0, 2);
// 更新摄像头
camera.aspect = window.innerWidth / window.innerHeight;
//   更新摄像机的投影矩阵
camera.updateProjectionMatrix();
scene.add(camera);

// 加入辅助轴，帮助我们查看3维坐标轴
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 加载纹理

// 创建纹理加载器对象
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("./texture/ca.jpeg");
const params = {
  uFrequency: 10,
  uScale: 0.1,
};

// const material = new THREE.MeshBasicMaterial({ color: "#00ff00" });
// 创建原始着色器材质
const rawShaderMaterial = new THREE.RawShaderMaterial({
  vertexShader: basicVertexShader,
  fragmentShader: basicFragmentShader,
  //   wireframe: true,
  side: THREE.DoubleSide,
  uniforms: {
    uTime: {
      value: 0,
    },
    uTexture: {
      value: texture,
    },
  },
});

// 创建平面
const floor = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(1, 1, 64, 64),
  rawShaderMaterial
);

console.log(floor);
scene.add(floor);

// 初始化渲染器
const renderer = new THREE.WebGLRenderer({ alpha: true });
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.BasicShadowMap;
// renderer.shadowMap.type = THREE.VSMShadowMap;

// 设置渲染尺寸大小
renderer.setSize(window.innerWidth, window.innerHeight);

// 监听屏幕大小改变的变化，设置渲染的尺寸
window.addEventListener("resize", () => {
  //   console.log("resize");
  // 更新摄像头
  camera.aspect = window.innerWidth / window.innerHeight;
  //   更新摄像机的投影矩阵
  camera.updateProjectionMatrix();

  //   更新渲染器
  renderer.setSize(window.innerWidth, window.innerHeight);
  //   设置渲染器的像素比例
  renderer.setPixelRatio(window.devicePixelRatio);
});

// 将渲染器添加到body
document.body.appendChild(renderer.domElement);

// 初始化控制器
const controls = new OrbitControls(camera, renderer.domElement);
// 设置控制器阻尼
controls.enableDamping = true;
// 设置自动旋转
// controls.autoRotate = true;

const clock = new THREE.Clock();
function animate(t) {
  const elapsedTime = clock.getElapsedTime();
  //   console.log(elapsedTime);
  rawShaderMaterial.uniforms.uTime.value = elapsedTime;
  requestAnimationFrame(animate);
  // 使用渲染器渲染相机看这个场景的内容渲染出来
  renderer.render(scene, camera);
}

animate();


```


```glsl
precision lowp float;
varying vec2 vUv;
varying float vElevation;

uniform sampler2D uTexture; 


void main(){
    // gl_FragColor = vec4(vUv, 0.0, 1.0);
    // float height = vElevation + 0.05 * 10.0;
    // gl_FragColor = vec4(1.0*height,0.0, 0.0, 1.0);

    // 根据UV,取出对应的颜色
    float height = vElevation + 0.05 * 20.0;
    vec4 textureColor = texture2D(uTexture,vUv);
    textureColor.rgb*=height;
    gl_FragColor = textureColor;
}
```

```glsl
precision lowp float;
attribute vec3 position;
attribute vec2 uv;


uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

// 获取时间
uniform float uTime;


varying vec2 vUv;

// highp  -2^16 - 2^16
// mediump -2^10 - 2^10
// lowp -2^8 - 2^8

varying float vElevation;


void main(){
    vUv = uv;
    vec4 modelPosition = modelMatrix * vec4( position, 1.0 );
    // modelPosition.x += 1.0;
    // modelPosition.z += 1.0;

    // modelPosition.z += modelPosition.x;

    modelPosition.z = sin((modelPosition.x+uTime) * 10.0)*0.05 ;
    modelPosition.z += sin((modelPosition.y+uTime)  * 10.0)*0.05 ;
    vElevation = modelPosition.z;

    gl_Position = projectionMatrix * viewMatrix * modelPosition ;
}
```

## demo2


```js
import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";
import * as dat from "dat.gui";

// 目标：认识shader

//创建gui对象
const gui = new dat.GUI();

// console.log(THREE);
// 初始化场景
const scene = new THREE.Scene();

// 创建透视相机
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerHeight / window.innerHeight,
  0.1,
  1000
);
// 设置相机位置
// object3d具有position，属性是1个3维的向量
camera.position.set(0, 0, 2);
// 更新摄像头
camera.aspect = window.innerWidth / window.innerHeight;
//   更新摄像机的投影矩阵
camera.updateProjectionMatrix();
scene.add(camera);

// 加入辅助轴，帮助我们查看3维坐标轴
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 加载纹理

// 创建纹理加载器对象
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("./texture/da.jpeg");
const params = {
  uFrequency: 10,
  uScale: 0.1,
};

// const material = new THREE.MeshBasicMaterial({ color: "#00ff00" });
// 创建着色器材质
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: `
        void main(){
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 ) ;
        }
    `,
  fragmentShader: `
        void main(){
            gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
        }
  `,
});

// 创建平面
const floor = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(1, 1, 64, 64),
  shaderMaterial
);

console.log(floor);
scene.add(floor);

// 初始化渲染器
const renderer = new THREE.WebGLRenderer({ alpha: true });
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.BasicShadowMap;
// renderer.shadowMap.type = THREE.VSMShadowMap;

// 设置渲染尺寸大小
renderer.setSize(window.innerWidth, window.innerHeight);

// 监听屏幕大小改变的变化，设置渲染的尺寸
window.addEventListener("resize", () => {
  //   console.log("resize");
  // 更新摄像头
  camera.aspect = window.innerWidth / window.innerHeight;
  //   更新摄像机的投影矩阵
  camera.updateProjectionMatrix();

  //   更新渲染器
  renderer.setSize(window.innerWidth, window.innerHeight);
  //   设置渲染器的像素比例
  renderer.setPixelRatio(window.devicePixelRatio);
});

// 将渲染器添加到body
document.body.appendChild(renderer.domElement);

// 初始化控制器
const controls = new OrbitControls(camera, renderer.domElement);
// 设置控制器阻尼
controls.enableDamping = true;
// 设置自动旋转
// controls.autoRotate = true;

const clock = new THREE.Clock();
function animate(t) {
  const elapsedTime = clock.getElapsedTime();
  //   console.log(elapsedTime);
  requestAnimationFrame(animate);
  // 使用渲染器渲染相机看这个场景的内容渲染出来
  renderer.render(scene, camera);
}

animate();


```


## demo3

```js
import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";
import * as dat from "dat.gui";

// 顶点着色器
import basicVertexShader from "../shader/basic/vertex.glsl";
// 片元着色器
import basicFragmentShader from "../shader/basic/fragment.glsl";

// 目标：认识shader

//创建gui对象
const gui = new dat.GUI();

// console.log(THREE);
// 初始化场景
const scene = new THREE.Scene();

// 创建透视相机
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerHeight / window.innerHeight,
  0.1,
  1000
);
// 设置相机位置
// object3d具有position，属性是1个3维的向量
camera.position.set(0, 0, 2);
// 更新摄像头
camera.aspect = window.innerWidth / window.innerHeight;
//   更新摄像机的投影矩阵
camera.updateProjectionMatrix();
scene.add(camera);

// 加入辅助轴，帮助我们查看3维坐标轴
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 加载纹理

// 创建纹理加载器对象
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("./texture/da.jpeg");
const params = {
  uFrequency: 10,
  uScale: 0.1,
};

// const material = new THREE.MeshBasicMaterial({ color: "#00ff00" });
// 创建着色器材质
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: basicVertexShader,
  fragmentShader: basicFragmentShader,
});

// 创建平面
const floor = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(1, 1, 64, 64),
  shaderMaterial
);

console.log(floor);
scene.add(floor);

// 初始化渲染器
const renderer = new THREE.WebGLRenderer({ alpha: true });
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.BasicShadowMap;
// renderer.shadowMap.type = THREE.VSMShadowMap;

// 设置渲染尺寸大小
renderer.setSize(window.innerWidth, window.innerHeight);

// 监听屏幕大小改变的变化，设置渲染的尺寸
window.addEventListener("resize", () => {
  //   console.log("resize");
  // 更新摄像头
  camera.aspect = window.innerWidth / window.innerHeight;
  //   更新摄像机的投影矩阵
  camera.updateProjectionMatrix();

  //   更新渲染器
  renderer.setSize(window.innerWidth, window.innerHeight);
  //   设置渲染器的像素比例
  renderer.setPixelRatio(window.devicePixelRatio);
});

// 将渲染器添加到body
document.body.appendChild(renderer.domElement);

// 初始化控制器
const controls = new OrbitControls(camera, renderer.domElement);
// 设置控制器阻尼
controls.enableDamping = true;
// 设置自动旋转
// controls.autoRotate = true;

const clock = new THREE.Clock();
function animate(t) {
  const elapsedTime = clock.getElapsedTime();
  //   console.log(elapsedTime);
  requestAnimationFrame(animate);
  // 使用渲染器渲染相机看这个场景的内容渲染出来
  renderer.render(scene, camera);
}

animate();

```


```glsl
void main(){
    gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
}

```


```glsl
void main(){
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 ) ;
}
```

## demo4

```js
import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";
import * as dat from "dat.gui";
import basicVertexShader from "../shaders/basic/vertex.glsl";
import basicFragmentShader from "../shaders/basic/fragment.glsl";

// 目标：认识shader

//创建gui对象
const gui = new dat.GUI();

// console.log(THREE);
// 初始化场景
const scene = new THREE.Scene();

// 创建透视相机
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerHeight / window.innerHeight,
  0.1,
  1000
);
// 设置相机位置
// object3d具有position，属性是1个3维的向量
camera.position.set(0, 0, 2);
// 更新摄像头
camera.aspect = window.innerWidth / window.innerHeight;
//   更新摄像机的投影矩阵
camera.updateProjectionMatrix();
scene.add(camera);

// 加入辅助轴，帮助我们查看3维坐标轴
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 加载纹理

// 创建纹理加载器对象
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("./texture/da.jpeg");
const params = {
  uFrequency: 10,
  uScale: 0.1,
};

// 创建着色器材质;
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: basicVertexShader,
  fragmentShader: basicFragmentShader,
  uniforms: {
    uColor: {
      value: new THREE.Color("purple"),
    },
    // 波浪的频率
    uFrequency: {
      value: params.uFrequency,
    },
    // 波浪的幅度
    uScale: {
      value: params.uScale,
    },
    // 动画时间
    uTime: {
      value: 0,
    },
    uTexture: {
      value: texture,
    },
  },
  side: THREE.DoubleSide,
  transparent: true,
});
// const rawSahderMaterial = new THREE.RawShaderMaterial({
//   vertexShader: basicVertexShader,
//   fragmentShader: basicFragmentShader,
//   uniforms: {
//     uColor: {
//       value: new THREE.Color("purple"),
//     },
//   },
// });

gui
  .add(params, "uFrequency")
  .min(0)
  .max(50)
  .step(0.1)
  .onChange((value) => {
    shaderMaterial.uniforms.uFrequency.value = value;
  });
gui
  .add(params, "uScale")
  .min(0)
  .max(1)
  .step(0.01)
  .onChange((value) => {
    shaderMaterial.uniforms.uScale.value = value;
  });

// new THREE.MeshBasicMaterial({ color: "#00ff00" })
// 创建平面
const floor = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(1, 1, 64, 64),
  shaderMaterial
);

console.log(floor);
scene.add(floor);

// 初始化渲染器
const renderer = new THREE.WebGLRenderer({ alpha: true });
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.BasicShadowMap;
// renderer.shadowMap.type = THREE.VSMShadowMap;

// 设置渲染尺寸大小
renderer.setSize(window.innerWidth, window.innerHeight);

// 监听屏幕大小改变的变化，设置渲染的尺寸
window.addEventListener("resize", () => {
  //   console.log("resize");
  // 更新摄像头
  camera.aspect = window.innerWidth / window.innerHeight;
  //   更新摄像机的投影矩阵
  camera.updateProjectionMatrix();

  //   更新渲染器
  renderer.setSize(window.innerWidth, window.innerHeight);
  //   设置渲染器的像素比例
  renderer.setPixelRatio(window.devicePixelRatio);
});

// 将渲染器添加到body
document.body.appendChild(renderer.domElement);

// 初始化控制器
const controls = new OrbitControls(camera, renderer.domElement);
// 设置控制器阻尼
controls.enableDamping = true;
// 设置自动旋转
// controls.autoRotate = true;

const clock = new THREE.Clock();
function animate(t) {
  const elapsedTime = clock.getElapsedTime();
  shaderMaterial.uniforms.uTime.value = elapsedTime;
  //   console.log(elapsedTime);
  requestAnimationFrame(animate);
  // 使用渲染器渲染相机看这个场景的内容渲染出来
  renderer.render(scene, camera);
}

animate();

```

```glsl
uniform vec3 uColor;
varying float vElevation;
precision highp float;
varying vec2 vUv;

uniform sampler2D uTexture;
void main(){
    float alpha = (vElevation+0.1)+0.8;
    // gl_FragColor = vec4(uColor,alpha);
    // gl_FragColor = vec4(uColor*alpha,1);
    // gl_FragColor= vec4(vUv,0,1);


    vec4 textureColor = texture2D(uTexture,vUv);
    textureColor.rgb*=alpha;
    gl_FragColor = textureColor;
}
```


```glsl
// attribute vec3 position;
// uniform mat4 modelMatrix;
// uniform mat4 viewMatrix;
// uniform mat4 projectionMatrix;
uniform vec3 uColor;
uniform float uFrequency;
uniform float uScale;
uniform float uTime;

varying float vElevation;

varying vec2 vUv;


// highp -2^16-2^16
// mediump = -2^10-2^10
// lowp -2^8-2^8
precision highp float;
void main(){
    vec4 modelPosition = modelMatrix * vec4( position, 1.0 );

    modelPosition.z += sin((modelPosition.x+uTime) * uFrequency)*uScale ;
    modelPosition.z += cos((modelPosition.y+uTime) * uFrequency)*uScale ;

    vElevation = modelPosition.z;
    gl_Position =  projectionMatrix * viewMatrix * modelPosition;
    vUv = uv;

}


```

## demo5

```js
import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";
import * as dat from "dat.gui";
import deepVertexShader from "../shaders/deep/vertex.glsl";
import deepFragmentShader from "../shaders/deep/fragment.glsl";

// 目标：认识shader

//创建gui对象
const gui = new dat.GUI();

// console.log(THREE);
// 初始化场景
const scene = new THREE.Scene();

// 创建透视相机
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerHeight / window.innerHeight,
  0.1,
  1000
);
// 设置相机位置
// object3d具有position，属性是1个3维的向量
camera.position.set(0, 0, 2);
// 更新摄像头
camera.aspect = window.innerWidth / window.innerHeight;
//   更新摄像机的投影矩阵
camera.updateProjectionMatrix();
scene.add(camera);

// 加入辅助轴，帮助我们查看3维坐标轴
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 加载纹理

// 创建纹理加载器对象
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("./texture/da.jpeg");
const params = {
  uFrequency: 10,
  uScale: 0.1,
};

// 创建着色器材质;
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: deepVertexShader,
  fragmentShader: deepFragmentShader,
  uniforms: {
    uColor: {
      value: new THREE.Color("purple"),
    },
    // 波浪的频率
    uFrequency: {
      value: params.uFrequency,
    },
    // 波浪的幅度
    uScale: {
      value: params.uScale,
    },
    // 动画时间
    uTime: {
      value: 0,
    },
    uTexture: {
      value: texture,
    },
  },
  side: THREE.DoubleSide,
  transparent: true,
});
// const rawSahderMaterial = new THREE.RawShaderMaterial({
//   vertexShader: basicVertexShader,
//   fragmentShader: basicFragmentShader,
//   uniforms: {
//     uColor: {
//       value: new THREE.Color("purple"),
//     },
//   },
// });

gui
  .add(params, "uFrequency")
  .min(0)
  .max(50)
  .step(0.1)
  .onChange((value) => {
    shaderMaterial.uniforms.uFrequency.value = value;
  });
gui
  .add(params, "uScale")
  .min(0)
  .max(1)
  .step(0.01)
  .onChange((value) => {
    shaderMaterial.uniforms.uScale.value = value;
  });

// new THREE.MeshBasicMaterial({ color: "#00ff00" })
// 创建平面
const floor = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(1, 1, 64, 64),
  shaderMaterial
);

console.log(floor);
scene.add(floor);

// 初始化渲染器
const renderer = new THREE.WebGLRenderer({ alpha: true });
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.BasicShadowMap;
// renderer.shadowMap.type = THREE.VSMShadowMap;

// 设置渲染尺寸大小
renderer.setSize(window.innerWidth, window.innerHeight);

// 监听屏幕大小改变的变化，设置渲染的尺寸
window.addEventListener("resize", () => {
  //   console.log("resize");
  // 更新摄像头
  camera.aspect = window.innerWidth / window.innerHeight;
  //   更新摄像机的投影矩阵
  camera.updateProjectionMatrix();

  //   更新渲染器
  renderer.setSize(window.innerWidth, window.innerHeight);
  //   设置渲染器的像素比例
  renderer.setPixelRatio(window.devicePixelRatio);
});

// 将渲染器添加到body
document.body.appendChild(renderer.domElement);

// 初始化控制器
const controls = new OrbitControls(camera, renderer.domElement);
// 设置控制器阻尼
controls.enableDamping = true;
// 设置自动旋转
// controls.autoRotate = true;

const clock = new THREE.Clock();
function animate(t) {
  const elapsedTime = clock.getElapsedTime();
  shaderMaterial.uniforms.uTime.value = elapsedTime;
  //   console.log(elapsedTime);
  requestAnimationFrame(animate);
  // 使用渲染器渲染相机看这个场景的内容渲染出来
  renderer.render(scene, camera);
}

animate();

```

```glsl

precision lowp float;
uniform float uTime;
uniform float uScale;
varying vec2 vUv;

#define PI 3.1415926535897932384626433832795

// 随机函数
float random (vec2 st) {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

// 旋转函数
vec2 rotate(vec2 uv, float rotation, vec2 mid)
{
    return vec2(
      cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
      cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
    );
}

// 噪声函数
float noise (in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}


//	Classic Perlin 2D Noise 
//	by Stefan Gustavson
//
vec4 permute(vec4 x)
{
    return mod(((x*34.0)+1.0)*x, 289.0);
}

vec2 fade(vec2 t)
{
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float cnoise(vec2 P)
{
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
}


void main(){
    
    // 1通过顶点对应的uv，决定每一个像素在uv图像的位置，通过这个位置x,y决定颜色
    // gl_FragColor =vec4(vUv,0,1) ;

    // 2对第一种变形
    // gl_FragColor = vec4(vUv,1,1);

    // 3利用uv实现渐变效果,从左到右
    // vUv.x
    // float strength = vUv.x;
    // gl_FragColor =vec4(strength,strength,strength,1);

    // 4利用uv实现渐变效果,从下到上
    // vUv.x
    // float strength = vUv.y;
    // gl_FragColor =vec4(strength,strength,strength,1);

    //5利用uv实现渐变效果,从上到下
    // vUv.x
    // float strength = 1.0-vUv.y;
    // gl_FragColor =vec4(strength,strength,strength,1);

    //6利用uv实现短范围内渐变
    // vUv.x
    // float strength = vUv.y * 10.0;
    // gl_FragColor =vec4(strength,strength,strength,1);


     //7利用通过取模达到反复效果
    // float strength = mod(vUv.y * 10.0 , 1.0) ;
    // gl_FragColor =vec4(strength,strength,strength,1);


    //8利用step(edge, x)如果x < edge，返回0.0，否则返回1.0
    // float strength =  mod(vUv.y * 10.0 , 1.0) ;
    // strength = step(0.5,strength);
    // gl_FragColor =vec4(strength,strength,strength,1);


     //9利用step(edge, x)如果x < edge，返回0.0，否则返回1.0
    // float strength =  mod(vUv.y * 10.0 , 1.0) ;
    // strength = step(0.8,strength);
    // gl_FragColor =vec4(strength,strength,strength,1);

    //10利用step(edge, x)如果x < edge，返回0.0，否则返回1.0
    // float strength =  mod(vUv.x * 10.0 , 1.0) ;
    // strength = step(0.8,strength);
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 11条纹相加
    // float strength = step(0.8, mod(vUv.x * 10.0 , 1.0)) ;
    // strength += step(0.8, mod(vUv.y * 10.0 , 1.0)) ;


    // 12条纹相乘
    // float strength = step(0.8, mod(vUv.x * 10.0 , 1.0)) ;
    // strength *= step(0.8, mod(vUv.y * 10.0 , 1.0)) ;

    // 12条纹相减
    // float strength = step(0.8, mod(vUv.x * 10.0 , 1.0)) ;
    // strength -= step(0.8, mod(vUv.y * 10.0 , 1.0)) ;


    // 13方块图形
    // float strength = step(0.2, mod(vUv.x * 10.0 , 1.0)) ;
    // strength *= step(0.2, mod(vUv.y * 10.0 , 1.0)) ;


    // 14T型图
    // float barX = step(0.4, mod((vUv.x+uTime*0.1) * 10.0 , 1.0))*step(0.8, mod(vUv.y * 10.0 , 1.0)) ;
    // float barX = step(0.4, mod(vUv.x * 10.0 - 0.2 , 1.0))*step(0.8, mod(vUv.y * 10.0 , 1.0)) ;
    // float barY = step(0.4, mod(vUv.y * 10.0 , 1.0))*step(0.8, mod(vUv.x * 10.0 , 1.0))  ;
    // float strength = barX+barY;

    // gl_FragColor =vec4(strength,strength,strength,1);
    // gl_FragColor = vec4(vUv,1,strength);


    // 16 利用绝对值
    // float strength = abs(vUv.x - 0.5) ;
    // gl_FragColor =vec4(strength,strength,strength,1);

    // 17 取2个值的最小值
    // float strength =min(abs(vUv.x - 0.5), abs(vUv.y - 0.5))  ;
    // gl_FragColor =vec4(strength,strength,strength,1);

    // 18 取最大值
    // float strength =max(abs(vUv.x - 0.5), abs(vUv.y - 0.5))  ;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 19 step
    // float strength =step(0.2,max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)))   ;
    // gl_FragColor =vec4(strength,strength,strength,1);

    // 20 小正方形
    // float strength =1.0-step(0.2,max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)))   ;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 21 利用取整，实现条纹渐变
    // float strength = floor(vUv.x*10.0)/10.0;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // float strength = floor(vUv.y*10.0)/10.0;
    // gl_FragColor =vec4(strength,strength,strength,1);

    // 22条纹相乘，实现渐变格子
    // float strength = floor(vUv.x*10.0)/10.0*floor(vUv.y*10.0)/10.0;
    // gl_FragColor =vec4(strength,strength,strength,1);

    // 23向上取整
    // float strength = ceil(vUv.x*10.0)/10.0*ceil(vUv.y*10.0)/10.0;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 24随机效果
    // float strength = random(vUv);
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 24随机+格子效果
    // float strength = ceil(vUv.x*10.0)/10.0*ceil(vUv.y*10.0)/10.0;
    // strength = random(vec2(strength,strength));
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 25 依据length返回向量长度
    // float strength = length(vUv);
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 26 根据distance技术2个向量的距离
    // float strength =1.0 - distance(vUv,vec2(0.5,0.5));
    // gl_FragColor =vec4(strength,strength,strength,1);



    // 27根据相除，实现星星
    // float strength =0.15 / distance(vUv,vec2(0.5,0.5)) - 1.0;
    // gl_FragColor =vec4(strength,strength,strength,strength);

    // 28设置vUv水平或者竖直变量
    // float strength =0.15 / distance(vec2(vUv.x,(vUv.y-0.5)*5.0),vec2(0.5,0.5)) - 1.0;
    // gl_FragColor =vec4(strength,strength,strength,strength);


    // 29十字交叉的星星

    // float  strength = 0.15 / distance(vec2(vUv.x,(vUv.y-0.5)*5.0+0.5),vec2(0.5,0.5)) - 1.0;
    // strength += 0.15 / distance(vec2(vUv.y,(vUv.x-0.5)*5.0+0.5),vec2(0.5,0.5)) - 1.0;
    // gl_FragColor =vec4(strength,strength,strength,strength);


    // 29旋转飞镖，旋转uv
    // vec2 rotateUv = rotate(vUv,3.14*0.25,vec2(0.5));
    // vec2 rotateUv = rotate(vUv,-uTime*5.0,vec2(0.5));
    // float  strength = 0.15 / distance(vec2(rotateUv.x,(rotateUv.y-0.5)*5.0+0.5),vec2(0.5,0.5)) - 1.0;
    // strength += 0.15 / distance(vec2(rotateUv.y,(rotateUv.x-0.5)*5.0+0.5),vec2(0.5,0.5)) - 1.0;
    // gl_FragColor =vec4(strength,strength,strength,strength);


    // 30小日本国旗
    // float strength = step(0.5,distance(vUv,vec2(0.5))+0.25) ;
    // gl_FragColor =vec4(strength,strength,strength,1);

    // 31绘制圆
    // float strength = 1.0 - step(0.5,distance(vUv,vec2(0.5))+0.25) ;
    // gl_FragColor =vec4(strength,strength,strength,1);

    // 32圆环
    // float strength = step(0.5,distance(vUv,vec2(0.5))+0.35) ;
    // strength *= (1.0 - step(0.5,distance(vUv,vec2(0.5))+0.25)) ;
    // gl_FragColor =vec4(strength,strength,strength,1);
    
    // 34渐变环
    // float strength =  abs(distance(vUv,vec2(0.5))-0.25) ;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 35打靶
    // float strength = step(0.1,abs(distance(vUv,vec2(0.5))-0.25))   ;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 36圆环
    // float strength = 1.0 - step(0.1,abs(distance(vUv,vec2(0.5))-0.25))   ;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 37波浪环
    // vec2 waveUv = vec2(
    //     vUv.x,
    //     vUv.y+sin(vUv.x*30.0)*0.1
    // );
    // float strength = 1.0 - step(0.01,abs(distance(waveUv,vec2(0.5))-0.25))   ;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 38
    // vec2 waveUv = vec2(
    //     vUv.x+sin(vUv.y*30.0)*0.1,
    //     vUv.y+sin(vUv.x*30.0)*0.1
    // );
    // float strength = 1.0 - step(0.01,abs(distance(waveUv,vec2(0.5))-0.25))   ;
    // gl_FragColor =vec4(strength,strength,strength,1);


// 39
    // vec2 waveUv = vec2(
    //     vUv.x+sin(vUv.y*100.0)*0.1,
    //     vUv.y+sin(vUv.x*100.0)*0.1
    // );
    // float strength = 1.0 - step(0.01,abs(distance(waveUv,vec2(0.5))-0.25))   ;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 40 根据角度显示视图
    // float angle = atan(vUv.x,vUv.y);
    // float strength = angle;
    // gl_FragColor =vec4(strength,strength,strength,1);

    // 41 根据角度实现螺旋渐变
    // float angle = atan(vUv.x-0.5,vUv.y-0.5);
    // float strength = (angle+3.14)/6.28;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 42 实现雷达扫射
    
    // float alpha =  1.0 - step(0.5,distance(vUv,vec2(0.5)));
    // float angle = atan(vUv.x-0.5,vUv.y-0.5);
    // float strength = (angle+3.14)/6.28;
    // gl_FragColor =vec4(strength,strength,strength,alpha);

    // 43 通过时间实现动态选择
    // vec2 rotateUv = rotate(vUv,3.14*0.25,vec2(0.5));
    // vec2 rotateUv = rotate(vUv,-uTime*5.0,vec2(0.5));
    // float alpha =  1.0 - step(0.5,distance(vUv,vec2(0.5)));
    // float angle = atan(rotateUv.x-0.5,rotateUv.y-0.5);
    // float strength = (angle+3.14)/6.28;
    // gl_FragColor =vec4(strength,strength,strength,alpha);


    // 44 万花筒
    // float angle = atan(vUv.x-0.5,vUv.y-0.5)/PI;
    // float strength = mod(angle*10.0,1.0);
    
    // gl_FragColor =vec4(strength,strength,strength,1);

    // 45 光芒四射
    // float angle = atan(vUv.x-0.5,vUv.y-0.5)/(2.0*PI);
    // float strength = sin(angle*100.0);
    
    // gl_FragColor =vec4(strength,strength,strength,1);

    // 46 使用噪声实现烟雾、波纹效果
    // float strength = noise(vUv);
    // gl_FragColor =vec4(strength,strength,strength,1);


    // float strength = noise(vUv * 10.0);
    // gl_FragColor =vec4(strength,strength,strength,1);


    // float strength = step(0.5,noise(vUv * 100.0)) ;
    // gl_FragColor =vec4(strength,strength,strength,1);

    // 通过时间设置波形
    // float strength = step(uScale,cnoise(vUv * 10.0+uTime)) ;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // float strength = abs(cnoise(vUv * 10.0)) ;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 发光路径
    // float strength =1.0 - abs(cnoise(vUv * 10.0)) ;
    // gl_FragColor =vec4(strength,strength,strength,1);

    // 波纹效果
    // float strength = sin(cnoise(vUv * 10.0)*5.0+uTime) ;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // float strength = step(0.9,sin(cnoise(vUv * 10.0)*20.0))  ;
    // gl_FragColor =vec4(strength,strength,strength,1);


    // 使用混合函数混颜色
    vec3 purpleColor = vec3(1.0, 0.0, 1.0);
    vec3 greenColor = vec3(1.0, 1.0, 1.0);
    vec3 uvColor = vec3(vUv,1.0);
    float strength = step(0.9,sin(cnoise(vUv * 10.0)*20.0))  ;


    vec3 mixColor =  mix(greenColor,uvColor,strength);
    // gl_FragColor =vec4(mixColor,1.0);
    gl_FragColor =vec4(mixColor,1.0);

    



}

```


```glsl
varying vec2 vUv;


// highp -2^16-2^16
// mediump = -2^10-2^10
// lowp -2^8-2^8
precision lowp float;
void main(){
    vec4 modelPosition = modelMatrix * vec4( position, 1.0 );
    vUv=uv;
    gl_Position =  projectionMatrix * viewMatrix * modelPosition;
    

}



```