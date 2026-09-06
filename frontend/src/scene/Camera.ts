/* Smooth lerp-based camera with edge clamping. */

import { Container } from 'pixi.js';

const LERP_SPEED = 0.08;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;

export class Camera {
  private container: Container;
  private currentX = 0;
  private currentY = 0;
  private currentZoom = 1;
  private targetX = 0;
  private targetY = 0;
  private targetZoom = 1;
  private viewWidth = 800;
  private viewHeight = 600;
  private mapWidth = 800;
  private mapHeight = 600;
  private manualOverride = false;
  private nudgeOffsetX = 0;
  private nudgeOffsetY = 0;
  private nudgeDuration = 0;

  constructor(container: Container) {
    this.container = container;
  }

  setViewSize(w: number, h: number) {
    this.viewWidth = w;
    this.viewHeight = h;
  }

  setMapSize(w: number, h: number) {
    this.mapWidth = w;
    this.mapHeight = h;
  }

  fitToScreen() {
    this.targetX = this.mapWidth / 2;
    this.targetY = this.mapHeight / 2;
    this.targetZoom = Math.min(
      this.viewWidth / this.mapWidth,
      this.viewHeight / this.mapHeight,
    );
    this.manualOverride = false;
  }

  focusOn(worldX: number, worldY: number, zoom?: number) {
    this.targetX = worldX;
    this.targetY = worldY;
    if (zoom !== undefined) this.targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    this.manualOverride = true;
  }

  nudgeToward(worldX: number, worldY: number, duration = 1200) {
    if (this.manualOverride) return;
    this.nudgeOffsetX = worldX - this.targetX;
    this.nudgeOffsetY = worldY - this.targetY;
    this.nudgeDuration = duration;
  }

  update(dt: number) {
    this.currentX += (this.targetX - this.currentX) * LERP_SPEED;
    this.currentY += (this.targetY - this.currentY) * LERP_SPEED;
    this.currentZoom += (this.targetZoom - this.currentZoom) * LERP_SPEED;

    if (this.nudgeDuration > 0) {
      this.nudgeDuration -= dt * 1000;
      const ease = Math.max(0, this.nudgeDuration / 1200);
      this.currentX += this.nudgeOffsetX * ease;
      this.currentY += this.nudgeOffsetY * ease;
    }

    this.container.scale.set(this.currentZoom);
    this.container.x = this.viewWidth / 2 - this.currentX * this.currentZoom;
    this.container.y = this.viewHeight / 2 - this.currentY * this.currentZoom;

    const scaledW = this.mapWidth * this.currentZoom;
    const scaledH = this.mapHeight * this.currentZoom;

    if (scaledW <= this.viewWidth) {
      this.container.x = (this.viewWidth - scaledW) / 2;
    } else {
      this.container.x = Math.min(0, Math.max(this.viewWidth - scaledW, this.container.x));
    }

    if (scaledH <= this.viewHeight) {
      this.container.y = (this.viewHeight - scaledH) / 2;
    } else {
      this.container.y = Math.min(0, Math.max(this.viewHeight - scaledH, this.container.y));
    }
  }

  getZoom() {
    return this.currentZoom;
  }
}
