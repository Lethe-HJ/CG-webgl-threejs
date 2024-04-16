import MaskDrawManager from "./draw-manager.js";
import { loadImageAndCreateTextureInfo } from "./libs.js";

export default class ImageLayerManger {
  layerIndex = 0;
  constructor(gl, imagePaths) {
    this.gl = gl;
    this.init(imagePaths);
  }
  init(imagePaths) {
    const gl = this.gl;
    this.textureInfos = imagePaths.map((path) =>
      loadImageAndCreateTextureInfo(gl, path)
    );
    this.maskDrawer = new MaskDrawManager(
      this.gl,
      this.textureInfos,
      this.layerIndex
    );
    this.handleDomEvent();
  }

  render() {
    this.maskDrawer.setLayerIndex(this.layerIndex);
    this.maskDrawer.render(this.layerIndex);
  }

  clearOldestDrawInfo() {
    const drawInfos = this.maskDrawer.drawInfos;
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
