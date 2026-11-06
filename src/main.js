import Phaser from 'phaser'
import BootScene from './scenes/BootScene.js'
import MainScene from './scenes/MainScene.js'
import UIScene from './scenes/UIScene.js'

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#000000',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 640, height: 360 },
    max: { width: 1920, height: 1080 }
  },
  scene: [BootScene, MainScene, UIScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  }
}

const game = new Phaser.Game(config)

window.game = game
