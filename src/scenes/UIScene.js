/**
 * UIScene — Health/power bars, portrait, score, game over/win screens, pause menu.
 */

import Phaser from 'phaser'

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene')
  }

  init(data) {
    this.data = data || {}
    this.playerHealth = data.playerHealth || 100
    this.playerPower = data.playerPower || 100
    this.playerMaxHealth = data.playerMaxHealth || 100
    this.playerMaxPower = data.playerMaxPower || 100
    this.score = data.score || 0
    this.gameOver = data.gameOver || false
    this.gameWon = data.gameWon || false
  }

  create() {
    console.log('[UI] UIScene.create() starting')
    window.__diag?.setStage('diag-stage-ui', 'ok', 'UI: Started')
    this.add.text(10, 10, 'UI: Started', {
      fontSize: '14px',
      fontFamily: 'Courier New, monospace',
      color: '#4ade80',
      backgroundColor: '#000000',
      padding: { x: 4, y: 4 }
    }).setDepth(1000)

    const width = this.cameras.main.width
    const height = this.cameras.main.height

    if (this.gameOver) {
      this.createGameOverScreen()
      return
    }
    if (this.gameWon) {
      this.createWinScreen()
      return
    }

    // ---------- HUD ----------
    // Health bar background
    this.add.rectangle(20, 20, 200, 24, 0x333333).setOrigin(0).setDepth(10)
    this.healthBar = this.add.rectangle(20, 20, 200, 24, 0xff0000).setOrigin(0).setDepth(11)
    this.updateHealthBar()

    // Power bar background
    this.add.rectangle(20, 52, 200, 24, 0x333333).setOrigin(0).setDepth(10)
    this.powerBar = this.add.rectangle(20, 52, 200, 24, 0xffd700).setOrigin(0).setDepth(11)
    this.updatePowerBar()

    // Labels
    this.add.text(20, 0, 'HEALTH', { fontSize: '14px', fontFamily: 'Courier New, monospace', color: '#ffffff' }).setDepth(11)
    this.add.text(20, 32, 'POWER', { fontSize: '14px', fontFamily: 'Courier New, monospace', color: '#ffffff' }).setDepth(11)

    // Portrait (top right)
    this.portrait = this.add.image(width - 60, 40, 'player-portrait').setOrigin(0.5).setDepth(10)
    this.portrait.setDisplaySize(64, 64)

    // Portrait border
    this.add.rectangle(width - 60, 40, 74, 74, 0x000000, 0).setOrigin(0.5).setStrokeStyle(2, 0xffd700).setDepth(9)

    // Score
    this.scoreText = this.add.text(width - 20, 20, `SCORE: ${this.score}`, {
      fontSize: '16px',
      fontFamily: 'Courier New, monospace',
      color: '#ffffff'
    }).setOrigin(1, 0).setDepth(10)

    // Controls hint (desktop)
    if (!this.sys.game.device.os.android && !this.sys.game.device.os.iOS) {
      this.add.text(20, height - 30, 'WASD/Arrows: Move  •  Space/Click: Attack  •  E/Right-Click: Interact  •  ESC: Pause', {
        fontSize: '14px',
        fontFamily: 'Courier New, monospace',
        color: '#aaaaaa'
      }).setDepth(10)
    }
  }

  update(time, dt) {
    if (this.gameOver || this.gameWon) return

    // Update bars from data
    // Data comes from events, but since we launched UIScene with initial values,
    // we need a way to get live updates. We'll use a registry or events.
    // For now, read from MainScene via global
    const mainScene = this.scene.get('MainScene')
    if (mainScene) {
      this.playerHealth = mainScene.playerHealth
      this.playerPower = mainScene.playerPower
      this.score = mainScene.score
      this.updateHealthBar()
      this.updatePowerBar()
      this.scoreText.setText(`SCORE: ${this.score}`)

      // Update portrait based on state
      if (mainScene.playerInvulnerable > this.time.now) {
        this.portrait.setTexture('player-portrait-hurt')
        this.portrait.setTint(0xff0000)
      } else {
        this.portrait.setTexture('player-portrait')
        this.portrait.clearTint()
      }

      // Low power warning
      if (this.playerPower < 20) {
        this.powerBar.setTint(0xff0000)
      } else {
        this.powerBar.clearTint()
      }
    }
  }

  updateHealthBar() {
    const pct = this.playerHealth / this.playerMaxHealth
    this.healthBar.width = 200 * Math.max(0, pct)
  }

  updatePowerBar() {
    const pct = this.playerPower / this.playerMaxPower
    this.powerBar.width = 200 * Math.max(0, pct)
  }

  createGameOverScreen() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Dark overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0).setDepth(50)

    // Large portrait
    this.add.image(width / 2, height / 2 - 80, 'player-portrait-hurt').setOrigin(0.5).setDepth(51).setDisplaySize(96, 96)

    // Game Over text
    this.add.text(width / 2, height / 2 - 20, 'GAME OVER', {
      fontSize: '48px',
      fontFamily: 'Courier New, monospace',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(51)

    // Score
    this.add.text(width / 2, height / 2 + 30, `Final Score: ${this.score}`, {
      fontSize: '24px',
      fontFamily: 'Courier New, monospace',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(51)

    // Restart button
    const restartBtn = this.add.text(width / 2, height / 2 + 90, 'TRY AGAIN', {
      fontSize: '24px',
      fontFamily: 'Courier New, monospace',
      color: '#4ade80',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true })

    restartBtn.on('pointerdown', () => {
      this.scene.stop('UIScene')
      this.scene.restart('MainScene')
    })

    // Menu button
    const menuBtn = this.add.text(width / 2, height / 2 + 140, 'MAIN MENU', {
      fontSize: '20px',
      fontFamily: 'Courier New, monospace',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true })

    menuBtn.on('pointerdown', () => {
      this.scene.stop('UIScene')
      this.scene.stop('MainScene')
      this.scene.start('BootScene')
    })
  }

  createWinScreen() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Dark overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0).setDepth(50)

    // Victory portrait
    this.add.image(width / 2, height / 2 - 80, 'player-portrait-victory').setOrigin(0.5).setDepth(51).setDisplaySize(96, 96)

    // Victory text
    this.add.text(width / 2, height / 2 - 20, 'VICTORY!', {
      fontSize: '48px',
      fontFamily: 'Courier New, monospace',
      color: '#4ade80',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(51)

    // Score
    this.add.text(width / 2, height / 2 + 30, `Final Score: ${this.score}`, {
      fontSize: '24px',
      fontFamily: 'Courier New, monospace',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(51)

    // Restart button
    const restartBtn = this.add.text(width / 2, height / 2 + 90, 'PLAY AGAIN', {
      fontSize: '24px',
      fontFamily: 'Courier New, monospace',
      color: '#4ade80',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true })

    restartBtn.on('pointerdown', () => {
      this.scene.stop('UIScene')
      this.scene.restart('MainScene')
    })
  }
}
