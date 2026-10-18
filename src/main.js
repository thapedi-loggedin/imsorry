import Phaser from 'phaser';
import './styles.css';
import { SanctuaryScene } from './scenes/SanctuaryScene.js';

const app = document.querySelector('#app');
const gameHost = document.createElement('div');
gameHost.id = 'game';
app.appendChild(gameHost);

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1600,
  height: 1000,
  backgroundColor: '#151413',
  antialias: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [SanctuaryScene]
};

const game = new Phaser.Game(config);
window.game = game;
