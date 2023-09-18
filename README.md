# CG-webgl-threejs

从计算机图形学到 webgl 到 threejs

## 1. 使用前的准备

vscode插件

1. js-in-string
2. inline-html
3. Node.js Notebooks



## 2. 使用示例

### 2.1 原生web环境的使用

```js
const { display } = require("node-kernel");
const import_map = {
  imports: {
    three: "../../node_modules/three/build/three.module.js",
    "three/addons/": "../../node_modules/three/examples/jsm/"
  },
};
const js = /*js*/`
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    const scene = new THREE.Scene();
    const container = document.querySelector("#code_cell1");
    const camera = new THREE.PerspectiveCamera( 75, container.clientWidth / container.clientHeight, 0.1, 1000 );

    const renderer = new THREE.WebGLRenderer({alpha: true});

    renderer.setSize( container.clientWidth, container.clientHeight );
    container.appendChild( renderer.domElement );

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    // 创建平面
    const floor_geometry = new THREE.PlaneGeometry(1,1,64,64);
    const floor = new THREE.Mesh( floor_geometry, material );
    scene.add( floor );

    camera.position.z = 5;


    function animate() {
        requestAnimationFrame(animate);
        // 使用渲染器渲染相机看这个场景的内容渲染出来
        renderer.render(scene, camera);
    }
    animate();
`;
const html = /*html*/ `
    <div id="code_cell1" style="width:600px;height:600px;position:relative;"></div>
    <script async src="https://unpkg.com/es-module-shims@1.8.0/dist/es-module-shims.js"></script>
    <script type="importmap-shim">${JSON.stringify(import_map)}</script>
    <script type="module-shim">${js}</script>
`;
display.html(html);

```

### 2.2 原生web环境的使用

使用src/utils.js中的封装

```js
const { runJsInWebEnv } = require("./utils.js");
const html = /*html*/ `<div id="code_cell1" style="width:600px;height:600px;position:relative;"></div>`;
runJsInWebEnv({
  imports: {
    three: "../../node_modules/three/build/three.module.js",
    "three/addons/": "../../node_modules/three/examples/jsm/",
  },
  js: /*js*/ `
      import * as THREE from 'three';
      import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
      const scene = new THREE.Scene();
      window.container.innerHTML = '${html}';
      const container = window.container.querySelector("#code_cell1");
      const camera = new THREE.PerspectiveCamera( 75, container.clientWidth / container.clientHeight, 0.1, 1000 );
  
      const renderer = new THREE.WebGLRenderer({alpha: true});
  
      renderer.setSize( container.clientWidth, container.clientHeight );
      container.appendChild( renderer.domElement );
  
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);
  
      const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
      // 创建平面
      const floor_geometry = new THREE.PlaneGeometry(1,1,64,64);
      const floor = new THREE.Mesh( floor_geometry, material );
      scene.add( floor );
  
      camera.position.z = 5;
  
  
      function animate() {
          requestAnimationFrame(animate);
          // 使用渲染器渲染相机看这个场景的内容渲染出来
          renderer.render(scene, camera);
      }
      animate();
      `,
});


```