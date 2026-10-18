import Phaser from 'phaser';
import { sanctuaryObjects } from './sanctuaryObjects.js';

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1000;
const BACKGROUND_KEY = 'treehouse-sanctuary';
const BACKGROUND_URL = '/assets/backgrounds/treehouse-sanctuary-concept.png';
const AUTO_REPAIR_DELAY_MS = 2600;
const ROOM_LAYER_SCALE = 1.22;
const ROOM_LAYER_OFFSET = { x: -190, y: -135 };

const palette = {
  panel: 0x211713,
  cream: 0xf5efe0,
  muted: 0xd9c8aa,
  olive: 0x6b6e4e,
  mustard: 0xd4a54a,
  rust: 0x9e4a2a,
  brass: 0xc49b5c,
  glow: 0xffe2a3,
  blue: 0x85b8ff
};

class InteractableZone {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.state = 'clean';
    this.repairQueued = false;
    this.polygon = new Phaser.Geom.Polygon(config.polygon.map(([x, y]) => ({ x, y })));
    this.center = this.getPolygonCenter();

    this.debug = scene.add.graphics();
    this.debug.setDepth(40);
    this.label = scene.add.text(this.center.x, this.center.y - 60, '', {
      fontFamily: 'Inter, Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#f5efe0',
      backgroundColor: 'rgba(33, 23, 19, 0.82)',
      padding: { x: 10, y: 6 }
    });
    this.label.setOrigin(0.5);
    this.label.setDepth(100);
    this.label.setVisible(false);
    scene.roomLayer.add([this.debug, this.label]);
  }

  getPolygonCenter() {
    const bounds = this.polygon.points.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxX: Math.max(acc.maxX, point.x),
        maxY: Math.max(acc.maxY, point.y)
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );

    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2
    };
  }

  contains(x, y) {
    return Phaser.Geom.Polygon.Contains(this.polygon, x, y);
  }

  damage() {
    if (this.state === 'clean') {
      this.setState('messy');
    } else if (this.state === 'messy') {
      this.setState('broken');
    } else {
      this.scene.showToast(`${this.config.label} already needs love`);
    }
  }

  setState(nextState) {
    this.state = nextState;
    if (nextState === 'clean') this.repairQueued = false;
    this.render();
  }

  render(isHovered = false) {
    this.debug.clear();
    const needsAttention = this.state !== 'clean';
    const fillColor = this.state === 'broken' ? palette.rust : palette.mustard;
    const hoverColor = isHovered ? palette.brass : fillColor;

    if (needsAttention || isHovered) {
      this.debug.fillStyle(hoverColor, needsAttention ? 0.16 : 0.08);
      this.debug.fillPoints(this.polygon.points, true);
      this.debug.lineStyle(2, hoverColor, needsAttention ? 0.8 : 0.45);
      this.debug.strokePoints(this.polygon.points, true);
    }

    if (needsAttention) {
      const text = this.state === 'broken' ? this.config.broken : this.config.messy;
      this.label.setText(text);
      this.label.setVisible(true);
    } else {
      this.label.setVisible(false);
    }
  }

  repair() {
    this.setState('clean');
    this.scene.createSparkles(this.center.x, this.center.y);
  }
}

export class SanctuaryScene extends Phaser.Scene {
  constructor() {
    super('SanctuaryScene');
  }

  preload() {
    this.load.image(BACKGROUND_KEY, BACKGROUND_URL);
  }

  create() {
    this.zones = [];
    this.repairQueue = [];
    this.currentTask = 'settling into the sanctuary';
    this.hoveredZone = null;

    this.roomLayer = this.add.container(ROOM_LAYER_OFFSET.x, ROOM_LAYER_OFFSET.y);
    this.roomLayer.setScale(ROOM_LAYER_SCALE);
    this.roomLayer.setDepth(20);
    this.createBackground();
    this.createZones();
    this.createCharacter();
    this.createHud();
    this.createInput();
    this.createIdleRoutine();
    this.updateHud();
  }

  createBackground() {
    const backdrop = this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x151413);
    backdrop.setDepth(-100);
    const bg = this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, BACKGROUND_KEY);
    bg.setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);
    bg.setDepth(0);

    const vignette = this.add.graphics();
    vignette.setDepth(10);
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.24, 0.12, 0.12, 0.26);
    vignette.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.roomLayer.add([bg, vignette]);
  }

  createZones() {
    this.zones = sanctuaryObjects.map(config => new InteractableZone(this, config));
  }

  createCharacter() {
    this.character = this.add.container(840, 640);
    this.character.setDepth(90);

    const shadow = this.add.ellipse(0, 30, 42, 16, 0x000000, 0.28);
    const body = this.add.graphics();
    body.fillStyle(0x2f2b24);
    body.fillRoundedRect(-12, 6, 10, 26, 5);
    body.fillRoundedRect(4, 6, 10, 26, 5);
    body.fillStyle(palette.olive);
    body.fillRoundedRect(-18, -30, 36, 44, 14);
    body.fillStyle(0xd2a57e);
    body.fillCircle(0, -42, 14);
    body.fillStyle(0x211713);
    body.fillRoundedRect(-13, -54, 26, 13, 8);
    body.fillStyle(0x15110f);
    body.fillCircle(-5, -42, 2);
    body.fillCircle(5, -42, 2);

    this.character.add([shadow, body]);
    this.roomLayer.add(this.character);
    this.restoreIdleBob();
  }

  createHud() {
    const panel = this.add.graphics();
    panel.setDepth(200);
    panel.fillStyle(palette.panel, 0.88);
    panel.fillRoundedRect(26, 26, 370, 134, 12);
    panel.lineStyle(1, palette.cream, 0.16);
    panel.strokeRoundedRect(26, 26, 370, 134, 12);

    this.titleText = this.add.text(48, 44, 'Treehouse Sanctuary', {
      fontFamily: 'Inter, Segoe UI, sans-serif',
      fontSize: '24px',
      color: '#f5efe0',
      fontStyle: '700'
    });
    this.titleText.setDepth(201);

    this.statusText = this.add.text(48, 82, '', {
      fontFamily: 'Inter, Segoe UI, sans-serif',
      fontSize: '15px',
      color: '#d9c8aa',
      lineSpacing: 5
    });
    this.statusText.setDepth(201);

    this.helpText = this.add.text(WORLD_WIDTH - 34, WORLD_HEIGHT - 32, 'Click objects to make messes. The character restores them automatically.', {
      fontFamily: 'Inter, Segoe UI, sans-serif',
      fontSize: '15px',
      color: '#f5efe0',
      backgroundColor: 'rgba(33, 23, 19, 0.76)',
      padding: { x: 12, y: 8 }
    });
    this.helpText.setOrigin(1, 1);
    this.helpText.setDepth(201);

    this.toast = this.add.text(WORLD_WIDTH / 2, 34, '', {
      fontFamily: 'Inter, Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#f5efe0',
      backgroundColor: 'rgba(33, 23, 19, 0.86)',
      padding: { x: 14, y: 9 }
    });
    this.toast.setOrigin(0.5, 0);
    this.toast.setDepth(220);
    this.toast.setVisible(false);
  }

  createInput() {
    this.input.on('pointermove', pointer => {
      const localPointer = this.toRoomSpace(pointer);
      const nextZone = this.getZoneAt(localPointer.x, localPointer.y);
      if (nextZone !== this.hoveredZone) {
        if (this.hoveredZone) this.hoveredZone.render(false);
        this.hoveredZone = nextZone;
        if (this.hoveredZone) this.hoveredZone.render(true);
      }
      this.input.setDefaultCursor(nextZone ? 'pointer' : 'default');
    });

    this.input.on('pointerdown', pointer => {
      const localPointer = this.toRoomSpace(pointer);
      const zone = this.getZoneAt(localPointer.x, localPointer.y);
      if (zone) {
        zone.damage();
        this.queueRepair(zone);
        this.showToast(`${zone.config.label}: ${zone.state}`);
        this.updateHud();
        return;
      }

      this.moveCharacterTo(localPointer.x, localPointer.y, 'wandering');
    });
  }

  toRoomSpace(pointer) {
    return {
      x: (pointer.x - this.roomLayer.x) / ROOM_LAYER_SCALE,
      y: (pointer.y - this.roomLayer.y) / ROOM_LAYER_SCALE
    };
  }

  createIdleRoutine() {
    this.time.addEvent({
      delay: 5200,
      loop: true,
      callback: () => {
        if (this.currentRepair || this.repairQueue.length > 0) return;
        const idlePoint = Phaser.Math.RND.pick([
          { x: 720, y: 640, task: 'straightening pillows' },
          { x: 1136, y: 582, task: 'checking the desk' },
          { x: 604, y: 338, task: 'warming by the fire' },
          { x: 1160, y: 274, task: 'choosing a record' }
        ]);
        this.moveCharacterTo(idlePoint.x, idlePoint.y, idlePoint.task);
      }
    });
  }

  getZoneAt(x, y) {
    return this.zones.find(zone => zone.contains(x, y));
  }

  queueRepair(zone) {
    if (zone.state === 'clean' || zone.repairQueued) return;
    zone.repairQueued = true;
    this.repairQueue.push(zone);
    this.scheduleRepair();
  }

  scheduleRepair() {
    if (this.repairTimer || this.currentRepair) return;
    this.repairTimer = this.time.delayedCall(AUTO_REPAIR_DELAY_MS, () => {
      this.repairTimer = null;
      this.repairNext();
    });
  }

  repairNext() {
    const zone = this.repairQueue.shift();
    if (!zone) {
      this.updateHud();
      return;
    }

    this.currentRepair = zone;
    this.moveCharacterTo(zone.center.x, zone.center.y + 36, zone.config.action, () => {
      this.time.delayedCall(900, () => {
        zone.repair();
        this.showToast(`${zone.config.label} restored`);
        this.currentRepair = null;
        this.currentTask = 'checking the room';
        this.updateHud();
        if (this.repairQueue.length > 0) this.scheduleRepair();
      });
    });
  }

  moveCharacterTo(x, y, task, onComplete) {
    this.currentTask = task;
    this.updateHud();
    this.tweens.killTweensOf(this.character);
    const distance = Phaser.Math.Distance.Between(this.character.x, this.character.y, x, y);
    this.tweens.add({
      targets: this.character,
      x,
      y,
      duration: Phaser.Math.Clamp(distance * 2.8, 420, 1500),
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.restoreIdleBob();
        if (onComplete) onComplete();
      }
    });
  }

  restoreIdleBob() {
    this.tweens.add({
      targets: this.character,
      y: this.character.y - 5,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  updateHud() {
    const messy = this.zones.filter(zone => zone.state === 'messy').length;
    const broken = this.zones.filter(zone => zone.state === 'broken').length;
    const clean = this.zones.length - messy - broken;

    this.statusText.setText([
      `Task: ${this.currentTask}`,
      `Room: ${clean} calm / ${messy} messy / ${broken} broken`,
      `Repair queue: ${this.repairQueue.length}`
    ]);
  }

  showToast(text) {
    this.toast.setText(text);
    this.toast.setVisible(true);
    this.toast.setAlpha(1);
    this.toast.setY(34);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({
      targets: this.toast,
      alpha: 0,
      y: 18,
      duration: 1500,
      delay: 700,
      onComplete: () => this.toast.setVisible(false)
    });
  }

  createSparkles(x, y) {
    for (let i = 0; i < 9; i += 1) {
      const sparkle = this.add.graphics();
      sparkle.setDepth(130);
      sparkle.x = x + Phaser.Math.Between(-28, 28);
      sparkle.y = y + Phaser.Math.Between(-24, 20);
      this.roomLayer.add(sparkle);
      sparkle.fillStyle(palette.glow, 0.95);
      sparkle.fillCircle(0, 0, Phaser.Math.Between(2, 5));
      this.tweens.add({
        targets: sparkle,
        alpha: 0,
        y: sparkle.y - Phaser.Math.Between(12, 28),
        scale: 1.8,
        duration: 620,
        delay: i * 35,
        onComplete: () => sparkle.destroy()
      });
    }
  }
}
