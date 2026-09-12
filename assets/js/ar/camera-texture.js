import * as THREE from "../three.module.js";

export class CameraTexture extends THREE.Texture {
  constructor(video) {
    super(video);
    this.isVideoTexture = true;
    this.minFilter = THREE.LinearFilter;
    this.magFilter = THREE.LinearFilter;
    this.generateMipmaps = false;
    this.colorSpace = THREE.SRGBColorSpace;
    this.lastTime = -1;
  }

  update() {
    if (this.image?.readyState >= 2 && this.lastTime !== this.image.currentTime) {
      this.lastTime = this.image.currentTime;
      this.needsUpdate = true;
    }
  }

  fit(metrics, mirrored) {
    const horizontal = metrics.width / metrics.drawWidth;
    const vertical = metrics.height / metrics.drawHeight;
    this.repeat.set(mirrored ? -horizontal : horizontal, vertical);
    this.offset.set(mirrored ? (1 + horizontal) / 2 : (1 - horizontal) / 2, (1 - vertical) / 2);
    this.updateMatrix();
  }
}
