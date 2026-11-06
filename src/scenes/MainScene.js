/**
 * MainScene — Core gameplay: maze, player, enemies, combat, power, shops, lady ghost.
 * WITH DIAGNOSTICS for black screen troubleshooting.
 */

import Phaser from 'phaser'

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene')
  }

  init() {
    // ---------- GAME STATE ----------
    this.tileSize = 32
    this.mazeCols = 25
    this.mazeRows = 19
    this.maze = null
    this.walls = null
    this.floorTiles = null

    // Player
    this.player = null
    this.playerHealth = 100
    this.playerMaxHealth = 100
    this.playerPower = 100
    this.playerMaxPower = 100
    this.playerSpeed = 160
    this.playerAttackCooldown = 0
    this.playerInvulnerable = 0
    this.score = 0
    this.gameWon = false
    this.gameOver = false

    // Power system
    this.powerDrainRate = 8
    this.powerAttackDrain = 15
    this.powerHitDrain = 25

    // Enemies
    this.enemies = null
    this.enemySpawnTimer = 0
    this.enemySpawnInterval = 3000

    // Tattoo shops
    this.shops = null
    this.shopCooldown = 0

    // Lady ghost
    this.ladyGhost = null
    this.ladyGhostTimer = 0
    this.ladyGhostInterval = 15000
    this.ladyGhostActive = false
    this.ladyGhostPrankTimer = 0
    this.prankActive = false
    this.prankType = null
    this.prankEndTime = 0

    // V2 Environmental sprites
    this.envSprites = null
    this.lanternGlows = null
    this.trees = null
    this.tombstones = null
    this.fences = null
    this.lanterns = null

    // Fog of war / darkness
    this.darkness = null
    this.lightRadius = 180
    this.lightMask = null

    // Input
    this.cursors = null
    this.wasd = null
    this.pointerLockActive = false

    // Audio context
    this.audioCtx = null
    this.audioEnabled = false

    // Particles
    this.particles = null

    // Camera shake
    this.cameraShake = 0
    this.cameraShakeIntensity = 0

    // Diagnostics
    this.diagText = null
    this.diagStage = 'INIT'
  }

  create() {
    try {
      console.log('[MAIN] create() starting')

      // ---------- DIAGNOSTIC OVERLAY ----------
      this.diagText = this.add.text(10, 10, 'MAIN: starting...', {
        fontSize: '14px',
        fontFamily: 'Courier New, monospace',
        color: '#ffff00',
        backgroundColor: '#000000',
        padding: { x: 4, y: 4 }
      }).setDepth(1000)

      this.setDiag('AUDIO')
      // ---------- AUDIO ----------
      this.initAudio()

      this.setDiag('MAZE')
      // ---------- MAZE ----------
      this.createMaze()

      this.setDiag('PLAYER')
      // ---------- PLAYER ----------
      this.createPlayer()

      this.setDiag('ENEMIES')
      // ---------- ENEMIES ----------
      this.enemies = this.physics.add.group()

      this.setDiag('SHOPS')
      // ---------- SHOPS ----------
      this.shops = this.add.group()
      this.createShops()

      this.setDiag('CRYPT')
      // ---------- EXIT CRYPT ----------
      this.createExitCrypt()

      this.setDiag('PARTICLES')
      // ---------- PARTICLES ----------
      this.particles = this.add.particles(0, 0, 'sparkle', {
        speed: 20,
        scale: { start: 0.5, end: 0 },
        blendMode: 'ADD',
        lifespan: 400,
        emitting: false
      })

      this.setDiag('COLLIDERS')
      // ---------- COLLIDERS ----------
      this.physics.add.collider(this.player, this.walls)
      this.physics.add.collider(this.enemies, this.walls)

      // Player vs enemies (combat)
      this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyOverlap, null, this)

      // Player vs shops
      this.physics.add.overlap(this.player, this.shops, this.handleShopOverlap, null, this)

      // Player vs exit crypt
      this.physics.add.overlap(this.player, this.exitCrypt, this.handleExitCrypt, null, this)

      this.setDiag('CAMERA')
      // ---------- CAMERA ----------
      this.cameras.main.setZoom(2.5)
      // Pad camera bounds so edge spawns appear centered instead of clamped to corner
      const cam = this.cameras.main
      const left = this.player.x - cam.width / 2 / cam.zoom
      const top = this.player.y - cam.height / 2 / cam.zoom
      this.cameras.main.setBounds(
        left,
        top,
        this.mazeCols * this.tileSize - left,
        this.mazeRows * this.tileSize - top
      )
      this.cameras.main.centerOn(this.player.x, this.player.y)
      // Explicitly set camera to center on player (centerOn + setBounds clamping interaction)
      this.cameras.main.scrollX = this.player.x - this.cameras.main.width / 2 / this.cameras.main.zoom
      this.cameras.main.scrollY = this.player.y - this.cameras.main.height / 2 / this.cameras.main.zoom
      console.log('CAMERA_AFTER_CENTERON', 'scrollX=' + this.cameras.main.scrollX, 'scrollY=' + this.cameras.main.scrollY, 'zoom=' + this.cameras.main.zoom)

      this.setDiag('INPUT')
      // ---------- INPUT ----------
      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = this.input.keyboard.addKeys('W,A,S,D')
      this.input.keyboard.on('keydown-SPACE', () => this.tryAttack())
      this.input.keyboard.on('keydown-E', () => this.tryInteract())
      this.input.keyboard.on('keydown-ESC', () => this.scene.pause())
      this.input.keyboard.on('keydown-F1', () => {
        const diag = document.getElementById('diag-panel')
        if (diag) diag.style.display = diag.style.display === 'none' ? 'block' : 'none'
      })

      // Click to attack / interact
      this.input.on('pointerdown', (pointer) => {
        if (this.gameOver || this.gameWon) return
        if (pointer.leftButtonDown()) this.tryAttack()
        else if (pointer.rightButtonDown()) this.tryInteract()
      })

      // ---------- TOUCH CONTROLS ----------
      this.touch = {
        up: false,
        down: false,
        left: false,
        right: false,
        attack: false,
        interact: false
      }

      // Touch control buttons are created in index.html as HTML elements
      const setupTouch = (id, key) => {
        const el = document.getElementById(id)
        if (!el) return
        const start = () => { this.touch[key] = true }
        const end = () => { this.touch[key] = false }
        el.addEventListener('touchstart', (e) => { e.preventDefault(); start() }, { passive: false })
        el.addEventListener('touchend', end)
        el.addEventListener('touchcancel', end)
        el.addEventListener('mousedown', (e) => { e.preventDefault(); start() })
        el.addEventListener('mouseup', end)
        el.addEventListener('mouseleave', end)
      }

      setupTouch('btn-up', 'up')
      setupTouch('btn-down', 'down')
      setupTouch('btn-left', 'left')
      setupTouch('btn-right', 'right')
      setupTouch('btn-attack', 'attack')
      setupTouch('btn-interact', 'interact')

      this.setDiag('UI')
      // ---------- UI ----------
      // UIScene is started dynamically from BootScene.create() via scene.add().
      // It reads player data from MainScene every frame in its update() loop.

      this.setDiag('DARKNESS')
      // ---------- FOG / DARKNESS ----------
      this.createDarkness()

      this.setDiag('LADYGHOST')
      // ---------- LADY GHOST TIMER ----------
      this.ladyGhostTimer = this.time.now + Phaser.Math.Between(8000, 20000)

      this.setDiag('DONE')
      console.log('[MAIN] Scene created successfully')

    } catch (err) {
      console.error('[MAIN] create() FAILED:', err)
      if (this.diagText) {
        this.diagText.setText('MAIN ERROR: ' + err.message).setColor('#ff0000')
      }
      throw err
    }
  }

  setDiag(stage) {
    this.diagStage = stage
    if (this.diagText) {
      this.diagText.setText('MAIN: ' + stage)
    }
  }

  // ---------- AUDIO ----------
  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.audioCtx = new AudioContext()
      this.audioEnabled = true
    } catch (e) {
      console.warn('Web Audio API not available')
    }
  }

  playTone(freq, type, duration, when = 0) {
    if (!this.audioCtx || !this.audioEnabled) return
    const t = this.audioCtx.currentTime + when
    const osc = this.audioCtx.createOscillator()
    const gain = this.audioCtx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + duration)
    gain.gain.setValueAtTime(0.1, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.connect(gain)
    gain.connect(this.audioCtx.destination)
    osc.start(t)
    osc.stop(t + duration)
  }

  playSound(name) {
    if (!this.audioCtx) return
    const now = this.audioCtx.currentTime
    switch (name) {
      case 'step':
        this.playTone(120, 'sine', 0.05, now)
        break
      case 'attack':
        this.playTone(300, 'square', 0.1, now)
        break
      case 'hit':
        this.playTone(150, 'sawtooth', 0.2, now)
        break
      case 'enemy-death':
        this.playTone(600, 'sine', 0.15, now)
        break
      case 'shop':
        this.playTone(800, 'sine', 0.1, now)
        this.playTone(1000, 'sine', 0.1, now + 0.1)
        break
      case 'power-up':
        this.playTone(1200, 'sine', 0.2, now)
        break
      case 'prank':
        this.playTone(400, 'square', 0.3, now)
        break
      case 'win':
        for (let i = 0; i < 5; i++) {
          this.playTone(400 + i * 200, 'sine', 0.2, now + i * 0.15)
        }
        break
      case 'game-over':
        for (let i = 4; i >= 0; i--) {
          this.playTone(200 + i * 100, 'sawtooth', 0.3, now + (4 - i) * 0.2)
        }
        break
    }
  }

  // ---------- MAZE GENERATION ----------
  createMaze() {
    const cols = this.mazeCols
    const rows = this.mazeRows
    this.maze = Array(rows).fill(null).map(() => Array(cols).fill(1))

    const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]]
    const stack = []

    const startX = 1
    const startY = 1
    this.maze[startY][startX] = 0
    stack.push({ x: startX, y: startY })

    while (stack.length > 0) {
      const current = stack[stack.length - 1]
      const neighbors = []

      for (const [dx, dy] of dirs) {
        const nx = current.x + dx
        const ny = current.y + dy
        if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && this.maze[ny][nx] === 1) {
          neighbors.push({ x: nx, y: ny, wx: current.x + dx / 2, wy: current.y + dy / 2 })
        }
      }

      if (neighbors.length > 0) {
        const next = neighbors[Phaser.Math.Between(0, neighbors.length - 1)]
        this.maze[next.wy][next.wx] = 0
        this.maze[next.y][next.x] = 0
        stack.push(next)
      } else {
        stack.pop()
      }
    }

    // Guarantee exit connectivity: carve a corridor from the nearest floor cell to the exit
    const exitX = this.mazeCols - 3
    const exitY = this.mazeRows - 3
    let nearestX = null, nearestY = null, nearestDist = Infinity
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        if (this.maze[y][x] === 0) {
          const d = Math.abs(x - exitX) + Math.abs(y - exitY)
          if (d < nearestDist) {
            nearestDist = d
            nearestX = x
            nearestY = y
          }
        }
      }
    }
    if (nearestX !== null) {
      for (let x = Math.min(nearestX, exitX); x <= Math.max(nearestX, exitX); x++) {
        if (x > 0 && x < cols - 1 && exitY > 0 && exitY < rows - 1) this.maze[exitY][x] = 0
      }
      for (let y = Math.min(nearestY, exitY); y <= Math.max(nearestY, exitY); y++) {
        if (nearestX > 0 && nearestX < cols - 1 && y > 0 && y < rows - 1) this.maze[y][nearestX] = 0
      }
    }

    // Create tilemap layer
    this.floorTiles = this.add.group()
    this.walls = this.add.group()

    // Ensure start area is clear BEFORE wall bodies are created
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = startX + dx
        const y = startY + dy
        if (x > 0 && x < cols - 1 && y > 0 && y < rows - 1) {
          this.maze[y][x] = 0
        }
      }
    }

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const wx = x * this.tileSize
        const wy = y * this.tileSize
        if (this.maze[y][x] === 0) {
          // V2: Randomize among grass variants for natural variation
          const grassRoll = Math.random()
          let floorTex = 'tile-grass-deep'
          if (grassRoll > 0.25) floorTex = 'tile-grass-lush'
          if (grassRoll > 0.5) floorTex = 'tile-grass-shadow'
          if (grassRoll > 0.75) floorTex = 'tile-grass-mossy'

          const floor = this.add.sprite(wx, wy, floorTex)
          floor.setOrigin(0, 0)
          this.floorTiles.add(floor)
        } else {
          // V2: Use handcrafted cobblestone for walls
          const wall = this.add.sprite(wx, wy, 'tile-cobblestone')
          wall.setOrigin(0, 0)
          this.physics.add.existing(wall, true)
          this.walls.add(wall)
        }
      }
    }

    // ---------- V2 ENVIRONMENTAL SPRITES ----------
    this.createEnvironmentalSprites()
  }

  // ---------- V2 ENVIRONMENTAL SPRITES ----------
  createEnvironmentalSprites() {
    const cols = this.mazeCols
    const rows = this.mazeRows
    const ts = this.tileSize

    this.envSprites = this.add.group()
    this.lanternGlows = this.add.group()
    this.trees = []
    this.tombstones = []
    this.fences = []
    this.lanterns = []

    // ---------- MAUSOLEUM ----------
    // Imposing structure at top-right, away from spawn and exit
    const mausTx = 26
    const mausTy = 4
    this.mausoleum = this.add.sprite(
      mausTx * ts + 96,
      mausTy * ts + 176,
      'struct-mausoleum'
    )
    this.mausoleum.setOrigin(0.5, 1.0)
    this.mausoleum.setDepth(15)
    this.envSprites.add(this.mausoleum)

    // ---------- TREES ----------
    // Large twisted trees at four corners
    const treePositions = [
      { tx: 2, ty: 2 },
      { tx: cols - 3, ty: 2 },
      { tx: 2, ty: rows - 3 },
      { tx: cols - 3, ty: rows - 3 },
    ]
    for (const pos of treePositions) {
      const tree = this.add.sprite(
        pos.tx * ts + 80,
        pos.ty * ts + 180,
        'foliage-tree-large'
      )
      tree.setOrigin(0.5, 1.0)
      tree.setDepth(10)
      this.envSprites.add(tree)
      this.trees.push(tree)
    }

    // ---------- TOMBSTONES ----------
    // Scattered on floor tiles, avoiding spawn, exit, and mausoleum
    const tombstoneTypes = [
      'prop-tombstone-classic',
      'prop-tombstone-cross',
      'prop-tombstone-obelisk',
      'prop-tombstone-broken',
    ]
    const placedTombs = []
    for (let i = 0; i < 12; i++) {
      let attempts = 0
      let placed = false
      while (!placed && attempts < 50) {
        const x = Phaser.Math.Between(3, cols - 4)
        const y = Phaser.Math.Between(3, rows - 4)
        if (this.maze[y][x] !== 0) { attempts++; continue }
        if (Math.abs(x - 1) < 3 && Math.abs(y - 1) < 3) { attempts++; continue }
        if (Math.abs(x - 22) < 3 && Math.abs(y - 16) < 3) { attempts++; continue }
        if (x >= 24 && x <= 30 && y >= 2 && y <= 9) { attempts++; continue }
        let tooClose = false
        for (const p of placedTombs) {
          if (Math.abs(x - p.x) < 4 && Math.abs(y - p.y) < 4) { tooClose = true; break }
        }
        if (tooClose) { attempts++; continue }
        const tex = tombstoneTypes[Phaser.Math.Between(0, tombstoneTypes.length - 1)]
        const tomb = this.add.sprite(
          x * ts + 16,
          y * ts + 32,
          tex
        )
        tomb.setOrigin(0.5, 1.0)
        tomb.setDepth(5)
        this.envSprites.add(tomb)
        this.tombstones.push(tomb)
        placedTombs.push({ x, y })
        placed = true
      }
    }

    // ---------- FENCING ----------
    // Along boundary walls
    for (let x = 2; x < cols - 2; x += 2) {
      if (this.maze[1][x] === 1) {
        const fence = this.add.sprite(x * ts + 32, 1 * ts + 28, 'prop-fence-section')
        fence.setOrigin(0.5, 1.0)
        fence.setDepth(8)
        this.envSprites.add(fence)
        this.fences.push(fence)
      }
      if (this.maze[rows - 2][x] === 1) {
        const fence = this.add.sprite(x * ts + 32, (rows - 2) * ts + 28, 'prop-fence-section')
        fence.setOrigin(0.5, 1.0)
        fence.setDepth(8)
        this.envSprites.add(fence)
        this.fences.push(fence)
      }
    }

    // ---------- LANTERNS WITH GLOW ----------
    const lanternPositions = [
      { tx: 26, ty: 8 },
      { tx: 30, ty: 8 },
      { tx: 10, ty: 2 },
      { tx: cols - 3, ty: 2 },
    ]
    for (const pos of lanternPositions) {
      if (this.maze[pos.ty][pos.tx] !== 0) continue
      const lantern = this.add.sprite(
        pos.tx * ts + 28,
        pos.ty * ts + 84,
        'light-lantern-post'
      )
      lantern.setOrigin(0.5, 1.0)
      lantern.setDepth(20)
      this.envSprites.add(lantern)
      this.lanterns.push(lantern)
      // Glow layer — additive blend
      const glow = this.add.sprite(
        pos.tx * ts + 28,
        pos.ty * ts + 80,
        'light-lantern-post-glow'
      )
      glow.setOrigin(0.5, 1.0)
      glow.setDepth(22)
      glow.setBlendMode(Phaser.BlendModes.ADD)
      this.lanternGlows.add(glow)
    }

    // ---------- FOG PATCHES ----------
    // Layered fog at low depth — doesn't obscure gameplay
    const fogPositions = [
      { x: 2 * ts, y: 30 * ts, tex: 'light-fog-large' },
      { x: 40 * ts, y: 32 * ts, tex: 'light-fog-medium' },
      { x: 2 * ts, y: 6 * ts, tex: 'light-fog-small' },
      { x: 45 * ts, y: 8 * ts, tex: 'light-fog-small' },
      { x: 22 * ts, y: 34 * ts, tex: 'light-fog-medium' },
    ]
    for (const fog of fogPositions) {
      const f = this.add.sprite(fog.x, fog.y, fog.tex)
      f.setOrigin(0, 1)
      f.setDepth(1)
      f.setAlpha(0.7)
      this.envSprites.add(f)
    }
  }

  createShops() {
    const shopCount = 4
    const placed = []

    for (let i = 0; i < shopCount; i++) {
      let attempts = 0
      let placedShop = false
      while (!placedShop && attempts < 100) {
        const x = Phaser.Math.Between(3, this.mazeCols - 4)
        const y = Phaser.Math.Between(3, this.mazeRows - 4)
        if (this.maze[y][x] === 0) {
          let tooClose = false
          for (const s of placed) {
            const dist = Math.hypot(x - s.x, y - s.y)
            if (dist < 6) { tooClose = true; break }
          }
          if (!tooClose) {
            const shop = this.add.sprite(x * this.tileSize, y * this.tileSize, 'tattoo-shop')
            shop.setOrigin(0.5, 0.5)
            shop.setDisplaySize(40, 40)
            this.physics.add.existing(shop, true)
            this.shops.add(shop)
            placed.push({ x, y })
            placedShop = true
            this.tweens.add({
              targets: shop,
              scale: { from: 0.9, to: 1.1 },
              duration: 1500,
              yoyo: true,
              repeat: -1
            })
          }
        }
        attempts++
      }
    }
  }

  createExitCrypt() {
    const exitX = this.mazeCols - 3
    const exitY = this.mazeRows - 3
    this.maze[exitY][exitX] = 0
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = exitX + dx
        const y = exitY + dy
        if (x > 0 && x < this.mazeCols - 1 && y > 0 && y < this.mazeRows - 1) {
          this.maze[y][x] = 0
        }
      }
    }

    this.exitCrypt = this.add.sprite(exitX * this.tileSize, exitY * this.tileSize, 'exit-crypt')
    this.exitCrypt.setOrigin(0.5, 0.5)
    this.exitCrypt.setDisplaySize(44, 44)
    this.physics.add.existing(this.exitCrypt, true)

    this.tweens.add({
      targets: this.exitCrypt,
      scale: { from: 0.9, to: 1.15 },
      duration: 2000,
      yoyo: true,
      repeat: -1
    })
  }

  createPlayer() {
    const spawnX = 1 * this.tileSize + this.tileSize / 2   // center of open tile (1,1)
    const spawnY = 1 * this.tileSize + this.tileSize / 2   // center of open tile (1,1)

    this.player = this.physics.add.sprite(spawnX, spawnY, 'player-idle-front')
    this.player.setDisplaySize(24, 24)
    this.player.setCollideWorldBounds(true)
    this.player.body.setSize(20, 20)

    this.player.lastDir = { x: 0, y: -1 }
    this.player.walkFrame = 0
    this.player.walkTimer = 0
    this.player.attacking = false
    this.player.attackTimer = 0
  }

  createDarkness() {
    // FIXED: Use alpha-tinted overlay instead of ERASE blend mode
    // ERASE blend mode can fail in WebGL2, causing a black screen
    this.darkness = this.add.rectangle(
      0, 0,
      this.mazeCols * this.tileSize,
      this.mazeRows * this.tileSize,
      0x000000,
      0.6
    )
    this.darkness.setOrigin(0, 0)
    this.darkness.setDepth(50)
    this.darkness.setAlpha(0)  // Phase 1A: darkness disabled for baseline visibility test

    // Light mask — circular light around player that cuts hole in darkness
    this.lightMask = this.add.circle(0, 0, this.lightRadius, 0xffffff, 0)  // Phase 1A: light mask disabled for baseline
    this.lightMask.setDepth(51)
    this.lightMask.setBlendMode(Phaser.BlendModes.ERASE)
  }

  // ---------- PLAYER CONTROL ----------
  tryAttack() {
    if (this.gameOver || this.gameWon || this.player.attacking) return
    if (this.playerPower < 10) return

    this.player.attacking = true
    this.player.attackTimer = 0.4
    this.playerPower = Math.max(0, this.playerPower - this.powerAttackDrain)

    const dir = this.player.lastDir
    const attackRange = 40
    const attackWidth = 20
    const attackX = this.player.x + dir.x * attackRange
    const attackY = this.player.y + dir.y * attackRange

    const attackZone = this.add.circle(attackX, attackY, attackWidth, 0xff0000, 0.3)
    this.physics.add.existing(attackZone)
    this.time.delayedCall(200, () => attackZone.destroy())

    this.enemies.getChildren().forEach(enemy => {
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, attackX, attackY)
      if (dist < attackRange + enemy.displayWidth / 2) {
        this.hitEnemy(enemy)
      }
    })

    this.playSound('attack')
    this.cameraShake = 0.15
    this.cameraShakeIntensity = 6
  }

  tryInteract() {
    if (this.gameOver || this.gameWon) return
    this.shops.getChildren().forEach(shop => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, shop.x, shop.y)
      if (dist < 60) {
        this.enterShop(shop)
      }
    })
  }

  hitEnemy(enemy) {
    enemy.health -= 30
    if (enemy.health <= 0) {
      this.destroyEnemy(enemy)
    } else {
      const dir = new Phaser.Math.Vector2(enemy.x - this.player.x, enemy.y - this.player.y).normalize()
      enemy.setVelocity(dir.x * 100, dir.y * 100)
      this.time.delayedCall(200, () => enemy.setVelocity(0, 0))
    }
    this.playSound('hit')
    this.playerPower = Math.max(0, this.playerPower - this.powerHitDrain)
    this.createParticles(enemy.x, enemy.y, 0xff0000, 5)
  }

  destroyEnemy(enemy) {
    this.score += 50
    this.playerPower = Math.min(this.playerMaxPower, this.playerPower + 20)
    this.createParticles(enemy.x, enemy.y, 0xffffff, 10)
    this.playSound('enemy-death')
    enemy.destroy()
  }

  enterShop(shop) {
    if (this.shopCooldown > this.time.now) return
    this.shopCooldown = this.time.now + 2000

    this.playerPower = this.playerMaxPower
    this.playSound('shop')

    const buffs = ['speed', 'strength', 'light']
    const buff = buffs[Phaser.Math.Between(0, 2)]
    this.applyBuff(buff)

    this.showInkedAnimation(buff)
  }

  applyBuff(buff) {
    if (buff === 'speed') {
      this.playerSpeed = 240
      this.time.delayedCall(5000, () => { this.playerSpeed = 160 })
    } else if (buff === 'strength') {
      this.playerAttackDamage = 60
      this.time.delayedCall(10000, () => { this.playerAttackDamage = 30 })
    } else if (buff === 'light') {
      this.lightRadius = 300
      this.time.delayedCall(8000, () => { this.lightRadius = 180 })
    }
  }

  showInkedAnimation(buff) {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    const portrait = this.add.image(width / 2, height / 2, 'player-portrait-inked')
    portrait.setDepth(200)
    portrait.setScale(0)
    this.tweens.add({
      targets: portrait,
      scale: 1.2,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: portrait,
          alpha: 0,
          duration: 1000,
          onComplete: () => portrait.destroy()
        })
      }
    })

    const buffText = {
      speed: 'SPEED BOOST!',
      strength: 'ATTACK UP!',
      light: 'BRIGHTER LIGHT!'
    }[buff]

    const text = this.add.text(width / 2, height / 2 + 60, buffText, {
      fontSize: '24px',
      fontFamily: 'Courier New, monospace',
      color: '#4ade80',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(201)
    text.setScale(0)
    this.tweens.add({
      targets: text,
      scale: 1,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.tweens.add({ targets: text, alpha: 0, duration: 500, onComplete: () => text.destroy() })
        })
      }
    })

    this.createParticles(width / 2, height / 2 - 40, 0x000000, 15)
  }

  createParticles(x, y, color, count) {
    this.particles.setPosition(x, y)
    this.particles.start(count, 0, 0, 0)
  }

  // ---------- LADY GHOST ----------
  updateLadyGhost(dt) {
    if (this.prankActive) return
    if (this.ladyGhostActive) {
      this.ladyGhostPrankTimer -= dt
      if (this.ladyGhostPrankTimer <= 0) {
        this.triggerPrank()
      }
      return
    }

    this.ladyGhostTimer -= dt
    if (this.ladyGhostTimer <= 0 && !this.ladyGhostActive) {
      this.spawnLadyGhost()
    }
  }

  spawnLadyGhost() {
    const side = Phaser.Math.Between(0, 3)
    let x, y
    if (side === 0) { x = 0; y = Phaser.Math.Between(0, this.cameras.main.height) }
    else if (side === 1) { x = this.cameras.main.width; y = Phaser.Math.Between(0, this.cameras.main.height) }
    else if (side === 2) { x = Phaser.Math.Between(0, this.cameras.main.width); y = 0 }
    else { x = Phaser.Math.Between(0, this.cameras.main.width); y = this.cameras.main.height }

    this.ladyGhost = this.add.sprite(x, y, 'lady-ghost')
    this.ladyGhost.setDepth(150)
    this.ladyGhost.setScale(1.5)
    this.ladyGhostActive = true
    this.ladyGhostPrankTimer = 4000

    this.tweens.add({
      targets: this.ladyGhost,
      x: this.ladyGhost.x + (side === 0 ? 60 : side === 1 ? -60 : 0),
      y: this.ladyGhost.y + (side === 2 ? 60 : side === 3 ? -60 : 0),
      duration: 1000,
      yoyo: true
    })

    const lines = ["Boo!", "Gotcha!", "Hee hee!", "Nice tunic!", "Watch your step!"]
    const line = lines[Phaser.Math.Between(0, lines.length - 1)]
    const bubble = this.add.text(this.ladyGhost.x, this.ladyGhost.y - 50, line, {
      fontSize: '18px',
      fontFamily: 'Courier New, monospace',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(151)
    bubble.setScale(0)
    this.tweens.add({
      targets: bubble,
      scale: 1,
      duration: 200,
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.tweens.add({ targets: bubble, alpha: 0, duration: 500, onComplete: () => bubble.destroy() })
        })
      }
    })

    this.playSound('prank')
  }

  triggerPrank() {
    if (!this.ladyGhost) return
    this.prankActive = true
    this.prankEndTime = this.time.now + 3000

    const pranks = ['reverse', 'spin', 'float', 'confetti']
    this.prankType = pranks[Phaser.Math.Between(0, 3)]

    this.showReactionFace('hurt')

    if (this.prankType === 'reverse') {
    } else if (this.prankType === 'spin') {
      this.player.setAngularVelocity(360)
    } else if (this.prankType === 'float') {
      this.player.setVelocity(0, -100)
    } else if (this.prankType === 'confetti') {
      for (let i = 0; i < 20; i++) {
        this.createParticles(this.player.x, this.player.y, 0xff6b6b, 1)
      }
    }

    this.playSound('prank')

    this.tweens.add({
      targets: this.ladyGhost,
      alpha: 0,
      scale: 0,
      duration: 1000,
      onComplete: () => {
        this.ladyGhost.destroy()
        this.ladyGhost = null
        this.ladyGhostActive = false
        this.prankActive = false
        this.prankType = null
        this.ladyGhostTimer = this.time.now + Phaser.Math.Between(15000, 25000)
        this.player.setAngularVelocity(0)
        this.player.setRotation(0)
      }
    })
  }

  showReactionFace(type) {
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    const texture = type === 'hurt' ? 'player-portrait-hurt' : 'player-portrait-victory'

    const portrait = this.add.image(width / 2, height / 2 - 60, texture)
    portrait.setDepth(200)
    portrait.setScale(0)
    this.tweens.add({
      targets: portrait,
      scale: 1.5,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: portrait,
          alpha: 0,
          duration: 800,
          onComplete: () => portrait.destroy()
        })
      }
    })
  }

  // ---------- GAME OVER / WIN ----------
  showGameOver() {
    this.gameOver = true
    this.physics.pause()
    this.playSound('game-over')
    this.scene.launch('UIScene', { gameOver: true, score: this.score })
  }

  showWin() {
    this.gameWon = true
    this.physics.pause()
    this.playSound('win')
    this.showReactionFace('victory')
    this.scene.launch('UIScene', { gameWon: true, score: this.score })
  }

  handleExitCrypt() {
    if (this.gameOver || this.gameWon) return
    this.showWin()
  }

  handlePlayerEnemyOverlap(player, enemy) {
    if (this.gameOver || this.gameWon) return
    if (this.playerInvulnerable > this.time.now) return

    this.playerHealth = Math.max(0, this.playerHealth - 20)
    this.playerPower = Math.max(0, this.playerPower - this.powerHitDrain)
    this.playerInvulnerable = this.time.now + 1500

    this.player.setAlpha(0.5)
    this.time.delayedCall(1500, () => this.player.setAlpha(1))

    this.showReactionFace('hurt')
    this.playSound('hit')
    this.cameraShake = 0.1
    this.cameraShakeIntensity = 4

    const dir = new Phaser.Math.Vector2(player.x - enemy.x, player.y - enemy.y).normalize()
    player.setVelocity(dir.x * 120, dir.y * 120)
    this.time.delayedCall(300, () => player.setVelocity(0, 0))

    if (this.playerHealth <= 0) {
      this.showGameOver()
    }
  }

  handleShopOverlap(player, shop) {
  }

  handleExitCrypt() {
  }

  // ---------- UPDATE ----------
  update(time, dt) {
    if (this.gameOver || this.gameWon) return

    const dtSec = dt / 1000

    // ---------- POWER DRAIN ----------
    const isMoving = this.cursors.left.isDown || this.cursors.right.isDown ||
                     this.cursors.up.isDown || this.cursors.down.isDown ||
                     this.wasd.W.isDown || this.wasd.A.isDown ||
                     this.wasd.S.isDown || this.wasd.D.isDown ||
                     this.touch.left || this.touch.right ||
                     this.touch.up || this.touch.down

    let drainRate = this.powerDrainRate * dtSec
    if (this.player.attacking) drainRate += this.powerAttackDrain * dtSec

    this.playerPower = Math.max(0, this.playerPower - drainRate)

    if (this.playerPower <= 0) {
      this.playerSpeed = 80
    } else {
      this.playerSpeed = 160
    }

    // ---------- PLAYER MOVEMENT ----------
    if (this.player.attacking) {
      this.player.attackTimer -= dtSec
      if (this.player.attackTimer <= 0) {
        this.player.attacking = false
      }
      this.player.setVelocity(0, 0)
    } else {
      let vx = 0
      let vy = 0

      if (this.cursors.left.isDown || this.wasd.A.isDown || this.touch.left) { vx = -1; this.player.lastDir = { x: -1, y: 0 } }
      if (this.cursors.right.isDown || this.wasd.D.isDown || this.touch.right) { vx = 1; this.player.lastDir = { x: 1, y: 0 } }
      if (this.cursors.up.isDown || this.wasd.W.isDown || this.touch.up) { vy = -1; this.player.lastDir = { x: 0, y: -1 } }
      if (this.cursors.down.isDown || this.wasd.S.isDown || this.touch.down) { vy = 1; this.player.lastDir = { x: 0, y: 1 } }

      const len = Math.sqrt(vx * vx + vy * vy)
      if (len > 0) {
        vx /= len
        vy /= len
      }

      this.player.setVelocity(vx * this.playerSpeed, vy * this.playerSpeed)

      // Directional texture based on last movement direction
      const dir = this.player.lastDir
      const move = len > 0
      const frame = this.player.walkFrame === 0 ? 1 : 2
      const base = `player-${move ? 'walk' : 'idle'}-${dir.y === -1 ? 'back' : dir.y === 1 ? 'front' : dir.x === -1 ? 'left' : 'right'}`
      const tex = move ? `player-walk-${dir.y === -1 ? 'back' : dir.y === 1 ? 'front' : dir.x === -1 ? 'left' : 'right'}-${frame}` : `player-idle-${dir.y === -1 ? 'back' : dir.y === 1 ? 'front' : dir.x === -1 ? 'left' : 'right'}`
      this.player.setTexture(tex)

      if (len > 0) {
        this.player.walkTimer += dtSec
        if (this.player.walkTimer > 0.15) {
          this.player.walkTimer = 0
          this.player.walkFrame = (this.player.walkFrame + 1) % 2
          this.player.setTexture(`player-walk-${dir.y === -1 ? 'back' : dir.y === 1 ? 'front' : dir.x === -1 ? 'left' : 'right'}-${this.player.walkFrame === 0 ? 1 : 2}`)
        }
      } else {
        this.player.setTexture(`player-idle-${dir.y === -1 ? 'back' : dir.y === 1 ? 'front' : dir.x === -1 ? 'left' : 'right'}`)
      }
    }

    // ---------- TOUCH ATTACK / INTERACT ----------
    if (this.touch.attack) {
      this.touch.attack = false
      this.tryAttack()
    }
    if (this.touch.interact) {
      this.touch.interact = false
      this.tryInteract()
    }

    // ---------- INVULNERABILITY ----------
    if (this.playerInvulnerable > 0 && this.time.now > this.playerInvulnerable) {
      this.playerInvulnerable = 0
    }

    // ---------- CAMERA SHAKE ----------
    if (this.cameraShake > 0) {
      this.cameras.main.shake(this.cameraShake * 100, 0.01)
      this.cameraShake -= dtSec
    }

    // ---------- CAMERA FOLLOW (zoom-correct smooth follow) ----------
    if (this.player && !this.gameOver && !this.gameWon) {
      const targetX = this.player.x - this.cameras.main.width / 2 / this.cameras.main.zoom
      const targetY = this.player.y - this.cameras.main.height / 2 / this.cameras.main.zoom
      this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetX, 0.08)
      console.log('CAMERA_FOLLOW_ACTIVE'); this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, targetY, 0.08)
      // CAMERA_FOLLOW_TEST_MARKER
    }

    // ---------- DARKNESS / LIGHT ----------
    if (this.lightMask && this.player) {
      this.lightMask.setPosition(this.player.x, this.player.y)
      const currentRadius = 120 + (this.playerPower / this.playerMaxPower) * 120
      this.lightMask.setRadius(currentRadius)
    }

    // ---------- LADY GHOST ----------
    this.updateLadyGhost(dtSec)

    // ---------- ENEMY SPAWNING ----------
    this.enemySpawnTimer -= dt
    if (this.enemySpawnTimer <= 0 && this.enemies.countActive(true) < 6) {
      this.spawnEnemy()
      this.enemySpawnTimer = Phaser.Math.Between(2000, 5000)
    }

    // ---------- ENEMY AI ----------
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active) return

      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y)

      if (enemy.type === 'ghost') {
        if (dist < 200) {
          const dir = new Phaser.Math.Vector2(this.player.x - enemy.x, this.player.y - enemy.y).normalize()
          enemy.setVelocity(dir.x * enemy.speed, dir.y * enemy.speed)
        } else {
          if (!enemy.patrolTarget || Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y) < 10) {
            enemy.patrolTarget = {
              x: Phaser.Math.Between(0, this.mazeCols * this.tileSize),
              y: Phaser.Math.Between(0, this.mazeRows * this.tileSize)
            }
          }
          const dir = new Phaser.Math.Vector2(enemy.patrolTarget.x - enemy.x, enemy.patrolTarget.y - enemy.y).normalize()
          enemy.setVelocity(dir.x * enemy.speed * 0.5, dir.y * enemy.speed * 0.5)
        }
      } else if (enemy.type === 'goblin') {
        if (dist < 150) {
          const dir = new Phaser.Math.Vector2(this.player.x - enemy.x, this.player.y - enemy.y).normalize()
          enemy.setVelocity(dir.x * enemy.speed, dir.y * enemy.speed)
        } else {
          enemy.setVelocity(0, 0)
        }
      }

      if (dist > 5) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y)
        enemy.setRotation(angle)
      }
    })

    // ---------- V2 LANTERN GLOW FLICKER ----------
    if (this.lanternGlows) {
      const pulse = 0.6 + 0.4 * Math.sin(this.time.now * 0.003)
      this.lanternGlows.getChildren().forEach(glow => {
        glow.setAlpha(pulse)
      })
    }

    // ---------- WIN CHECK ----------
    if (this.player && !this.gameWon) {
      const distToExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitCrypt.x, this.exitCrypt.y)
      if (distToExit < 40) {
        this.showWin()
      }
    }
  }

  spawnEnemy() {
    const attempts = 20
    for (let i = 0; i < attempts; i++) {
      const x = Phaser.Math.Between(2, this.mazeCols - 3) * this.tileSize
      const y = Phaser.Math.Between(2, this.mazeRows - 3) * this.tileSize
      const dist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y)
      if (dist > 150) {
        const type = Math.random() > 0.5 ? 'ghost' : 'goblin'
        const texture = type === 'ghost' ? 'ghost' : 'goblin'
        const enemy = this.physics.add.sprite(x, y, texture)
        enemy.setOrigin(0.5, 0.5)
        enemy.setDisplaySize(32, 32)
        enemy.type = type
        enemy.speed = type === 'ghost' ? 60 : 90
        enemy.health = type === 'ghost' ? 30 : 40
        this.physics.add.collider(enemy, this.walls)
        this.enemies.add(enemy)
        return
      }
    }
  }
}
