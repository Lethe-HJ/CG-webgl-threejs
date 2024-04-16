import AnnotationManager from "./annotation-manager.js";
import { loadImageAndCreateTextureInfo } from "./libs.js";

export default class ImageLayerManger {
  layerIndex = 0;
  constructor(gl, imagePaths, config) {
    this.gl = gl;
    this.config = config;
    this.init(imagePaths);
  }
  init(imagePaths) {
    const gl = this.gl;
    this.textureInfos = imagePaths.map((path) =>
      loadImageAndCreateTextureInfo(gl, path)
    );
    this.annotationManager = new AnnotationManager(
      this.gl,
      this.textureInfos,
      this.layerIndex,
      this.config
    );
    this.handleDomEvent();
  }

  render() {
    this.annotationManager.setLayerIndex(this.layerIndex);
    this.annotationManager.render(this.layerIndex);
  }

  clearOldestDrawInfo() {
    const drawInfos = this.annotationManager.drawInfos;
    const drawInfosLen = drawInfos.length;
    // 离当前最远的是 距离现在一半长度的位置
    const oldestDrawInfoIndex =
      (this.layerIndex + Math.floor(drawInfosLen / 2)) % drawInfosLen;
    drawInfos[oldestDrawInfoIndex] = {
      ...drawInfos[oldestDrawInfoIndex],
      fbo: {
        image: null,
        paint: null,
      },
      lastArrayDrawnIndex: 0,
    };
  }

  handleDomEvent() {
    const throttleDuration = 200;
    let lastEventTime = 0;
    document.addEventListener("wheel", (e) => {
      const currentTime = Date.now();
      if (currentTime - lastEventTime > throttleDuration) {
        const length = this.textureInfos.length;
        const delta = e.deltaY > 0 ? 1 : -1;
        this.layerIndex = (length + this.layerIndex + delta) % length;
        lastEventTime = currentTime;
        this.clearOldestDrawInfo();
        this.render();
      }
    });
  }
}
