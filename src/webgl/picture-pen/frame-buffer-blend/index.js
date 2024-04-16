import { DRAW_MODE } from "./constant.js";
import ImageLayerManger from "./layer-manager.js";

const config = {
  mode: DRAW_MODE.pen,
  pen: {
    size: 4,
    color: [1, 0, 0, 1],
  },
};

(function main() {
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("WebGL2 is not supported");

  const imagePaths = [
    "../../../../assets/star.jpg",
    "../../../../assets/leaves.jpg",
    "../../../../assets/keyboard.jpg",
  ];
  const imageLayerManger = new ImageLayerManger(gl, imagePaths, config);
  window.imageLayerManger = imageLayerManger;
  let initialized = false;
  const resizeObserver = new ResizeObserver(() => {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    if (!initialized) {
      imageLayerManger.textureInfos[imageLayerManger.layerIndex].promise.then(
        () => {
          imageLayerManger.render();
        }
      );
    } else {
      imageLayerManger.render();
    }
  });
  resizeObserver.observe(canvas);
  webglLessonsUI.setupSlider("#size", {
    slide: (event, ui) => {
      config.pen.size = ui.value;
      updateConfig();
    },
    min: 1.0,
    max: 40.0,
    value: config.pen.size,
  });

  window.handleColorChange = function (element) {
    config.pen.color = [...hexToRgb(element.value), 1];
    updateConfig();
  };
  window.handleModeChange = function (element) {
    config.mode = DRAW_MODE[element.value];
    imageLayerManger.annotationManager.setMode(config.mode);
    updateConfig();
  };

  function updateConfig() {
    imageLayerManger.annotationManager.setConfig(config);
  }
})();

function hexToRgb(hex) {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length == 7) {
    r = parseInt(hex.substr(1, 2), 16) / 255;
    g = parseInt(hex.substr(3, 2), 16) / 255;
    b = parseInt(hex.substr(5, 2), 16) / 255;
  }
  return [r, g, b];
}
