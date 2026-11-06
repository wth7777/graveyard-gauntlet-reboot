/**
 * BootScene — Loads all assets and shows loading progress.
 * 
 * Procedural character art is based on the cousin's photos:
 * - White/gray full beard and mustache
 * - Black-rimmed glasses
 * - Black baseball cap with yellow/gold logo
 * - Heavy arm tattoos ("MEMENTO MORI" on left arm, sleeve on both arms)
 * - Black sleeveless athletic shirt with white trim + Sullen Art Collective skull logo
 * - Silver chain with skull pendant, multiple rings
 * - Stocky build, blue jeans
 * - Image 3 shows him in a graveyard holding an axe
 * 
 * Real sprite images can be dropped into assets/images/ and loaded here
 * to replace the procedural graphics.
 */

import Phaser from 'phaser'
import UIScene from './UIScene.js'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Loading UI
    this.add.text(width / 2, height / 2 - 50, 'GRAVEYARD GAUNTLET', {
      fontSize: '32px',
      fontFamily: 'Courier New, monospace',
      color: '#4ade80'
    }).setOrigin(0.5)

    const progressBar = this.add.graphics()
    this.add.text(width / 2, height / 2 + 20, 'Loading assets...', {
      fontSize: '16px',
      fontFamily: 'Courier New, monospace',
      color: '#e0e0e0'
    }).setOrigin(0.5)

    this.load.on('progress', (value) => {
      progressBar.clear()
      progressBar.fillStyle(0x4ade80, 1)
      progressBar.fillRect(width / 2 - 150, height / 2 + 40, 300 * value, 20)
    })

    this.load.on('complete', () => {
      progressBar.destroy()
    })

    // Set base URL for asset loading to match GitHub Pages base path
    this.load.baseURL = '/graveyard-gauntlet-reboot/'

    // ---------- STAGE 1: PREMIUM TERRAIN TILES (V1) ----------
    // Load handcrafted pixel-art terrain (32x32). Procedural textures
    // in createTileTextures() remain as fallbacks if images fail to load.
    this.load.image('tile-grass-base',   'assets/images/tiles/grass-base.png')
    this.load.image('tile-grass-var-a',  'assets/images/tiles/grass-var-a.png')
    this.load.image('tile-grass-var-b',  'assets/images/tiles/grass-var-b.png')
    this.load.image('tile-grass-var-c',  'assets/images/tiles/grass-var-c.png')
    this.load.image('tile-dirt-path',    'assets/images/tiles/dirt-path.png')
    this.load.image('tile-cobblestone-path', 'assets/images/tiles/cobblestone-path.png')
    this.load.image('tile-stone-floor',  'assets/images/tiles/stone-floor.png')
    this.load.image('tile-wall-stone',   'assets/images/tiles/wall-stone.png')
    this.load.image('tile-hedge-dense',  'assets/images/tiles/hedge-dense.png')
    this.load.image('tile-tomb-crypt',   'assets/images/tiles/tomb-crypt.png')

    // ---------- STAGE 2: V2 PREMIUM TERRAIN TILES ----------
    // Handcrafted V2 terrain (32x32) with intentional pixel clusters.
    this.load.image('tile-grass-deep',   'assets/images/tiles/v2/grass_deep.png')
    this.load.image('tile-grass-lush',   'assets/images/tiles/v2/grass_lush.png')
    this.load.image('tile-grass-shadow', 'assets/images/tiles/v2/grass_shadow.png')
    this.load.image('tile-grass-mossy',  'assets/images/tiles/v2/grass_mossy.png')
    this.load.image('tile-dirt-path-h',  'assets/images/tiles/v2/dirt_path_h.png')
    this.load.image('tile-dirt-path-v',  'assets/images/tiles/v2/dirt_path_v.png')
    this.load.image('tile-dirt-corner-tl', 'assets/images/tiles/v2/dirt_corner_tl.png')
    this.load.image('tile-dirt-corner-tr', 'assets/images/tiles/v2/dirt_corner_tr.png')
    this.load.image('tile-dirt-corner-bl', 'assets/images/tiles/v2/dirt_corner_bl.png')
    this.load.image('tile-dirt-corner-br', 'assets/images/tiles/v2/dirt_corner_br.png')
    this.load.image('tile-cobblestone',  'assets/images/tiles/v2/cobblestone.png')
    this.load.image('tile-stone-floor-v2', 'assets/images/tiles/v2/stone_floor.png')

    // ---------- STAGE 2: V2 ENVIRONMENTAL PROPS ----------
    this.load.image('prop-tombstone-classic', 'assets/images/props/v2/tombstone_classic.png')
    this.load.image('prop-tombstone-cross',   'assets/images/props/v2/tombstone_cross.png')
    this.load.image('prop-tombstone-obelisk', 'assets/images/props/v2/tombstone_obelisk.png')
    this.load.image('prop-tombstone-broken',  'assets/images/props/v2/tombstone_broken.png')
    this.load.image('prop-fence-section',     'assets/images/props/v2/fence_section.png')
    this.load.image('prop-fence-gate',        'assets/images/props/v2/fence_gate.png')

    // ---------- STAGE 2: V2 STRUCTURES ----------
    this.load.image('struct-mausoleum', 'assets/images/structures/v2/mausoleum.png')

    // ---------- STAGE 2: V2 FOLIAGE ----------
    this.load.image('foliage-tree-large', 'assets/images/foliage/v2/tree_large.png')

    // ---------- STAGE 2: V2 LIGHTING & ATMOSPHERE ----------
    this.load.image('light-lantern-post',       'assets/images/lighting/v2/lantern_post.png')
    this.load.image('light-lantern-post-glow',  'assets/images/lighting/v2/lantern_post_glow.png')
    this.load.image('light-lantern-hanging',    'assets/images/lighting/v2/lantern_hanging.png')
    this.load.image('light-lantern-hanging-glow','assets/images/lighting/v2/lantern_hanging_glow.png')
    this.load.image('light-fog-small',          'assets/images/lighting/v2/fog_small.png')
    this.load.image('light-fog-medium',         'assets/images/lighting/v2/fog_medium.png')
    this.load.image('light-fog-large',          'assets/images/lighting/v2/fog_large.png')
    this.load.image('light-firefly',            'assets/images/lighting/v2/firefly.png')
    this.load.image('light-moth',               'assets/images/lighting/v2/moth.png')

    // ---------- PROCEDURAL CHARACTER GRAPHICS ----------
    // Based on cousin's photos. Replace with real images in assets/images/.

    this.createPlayerSprite()
    this.createPlayerPortraits()
    this.createGhostSprite()
    this.createGoblinSprite()
    this.createLadyGhostSprite()
    this.createTattooShopSprite()
    this.createCryptSprite()
    this.createTileTextures()
    this.createParticleTextures()
    this.createUITextures()
  }

  create() {
    window._diagBootStart = true
    console.log('[BOOT] BootScene.create() - all textures generated, starting MainScene')
    window.__diag?.setStage('diag-stage-boot', 'ok', 'BOOT: Textures ready')
    this.add.text(10, 10, 'BOOT: Textures ready -> MainScene', {
      fontSize: '14px',
      fontFamily: 'Courier New, monospace',
      color: '#4ade80',
      backgroundColor: '#000000',
      padding: { x: 4, y: 4 }
    }).setDepth(1000)
    this._started = false
    // Start MainScene immediately — BootScene.update() is never called by Phaser,
    // so the transition must happen here in create() rather than in update().
    this.scene.manager.switch('BootScene', 'MainScene')
    // Add UIScene without auto-start, then launch() it (wake + init, does NOT call create()
    // and does NOT pause MainScene). Finally call create() manually to build HUD elements.
    // Both scenes must be set to RUNNING explicitly because Phaser's scene manager
    // leaves newly-added scenes in PAUSED state when started from within another scene's
    // create() method.
    this.scene.launch('UIScene', {
      playerHealth: 100,
      playerPower: 100,
      playerMaxHealth: 100,
      playerMaxPower: 100,
      score: 0
    })
    const uiScene = this.scene.manager.getScene('UIScene')
    uiScene.create(uiScene.sys.settings.data)
    // Force both scenes to RUNNING so the game loop processes both
    uiScene.sys.settings.status = 4 // CONST.RUNNING
    const mainScene = this.scene.manager.getScene('MainScene')
    mainScene.sys.settings.status = 4 // CONST.RUNNING
  }

  update() {
    if (!this._started) {
      this._started = true
      this.scene.manager.switch('BootScene', 'MainScene')
    }
  }

  // ============================================================
  // PLAYER CHARACTER — Based on cousin's photos
  // ============================================================

  createPlayerSprite() {
    const size = 48;
    const skin = 0xe8c39e;
    const beard = 0xf0f0f0;
    const black = 0x1a1a1a;
    const white = 0xffffff;
    const gold = 0xffd700;
    const jeans = 0x4a6fa5;
    const tat = 0x2a2a2a;

    // Helper: draw head (front view)
    const drawHeadFront = (c) => {
      c.fillStyle(skin);
      c.fillCircle(size / 2, size * 0.26, size / 2.4); // head
      c.fillStyle(black);
      c.fillCircle(size / 2, size * 0.18, size / 2.2); // cap dome
      c.fillRect(size * 0.12, size * 0.26, size * 0.76, size * 0.08); // cap brim
      c.fillStyle(gold);
      c.fillCircle(size / 2, size * 0.20, size * 0.08); // cap logo
      // Face: eyes
      c.fillStyle(black);
      c.fillRect(size * 0.38, size * 0.23, size * 0.03, size * 0.03);
      c.fillRect(size * 0.59, size * 0.23, size * 0.03, size * 0.03);
      c.fillRect(size * 0.48, size * 0.26, size * 0.04, size * 0.02); // nose
      // Beard
      c.fillStyle(beard);
      c.fillCircle(size / 2, size * 0.60, size / 2.8);
      c.fillStyle(skin);
      c.fillRect(size * 0.28, size * 0.48, size * 0.44, size * 0.16); // chin bridge
      c.fillStyle(beard);
      c.fillEllipse(size / 2, size * 0.46, size * 0.14, size * 0.05); // mustache
    };

    // Helper: draw head (back view)
    const drawHeadBack = (c) => {
      c.fillStyle(skin);
      c.fillCircle(size / 2, size * 0.26, size / 2.4); // head
      c.fillStyle(black);
      c.fillCircle(size / 2, size * 0.18, size / 2.2); // cap dome (from behind)
      c.fillRect(size * 0.12, size * 0.24, size * 0.76, size * 0.06); // cap brim
      c.fillStyle(gold);
      c.fillCircle(size / 2, size * 0.19, size * 0.08); // cap logo
    };

    // Helper: draw head (side view)
    const drawHeadSide = (c, facingRight) => {
      const cx = facingRight ? size * 0.62 : size * 0.38;
      c.fillStyle(skin);
      c.fillCircle(cx, size * 0.30, size / 2.6); // head
      c.fillStyle(black);
      c.fillCircle(cx, size * 0.20, size / 2.4); // cap dome
      c.fillRect(cx - size * 0.12, size * 0.26, size * 0.10, size * 0.08); // cap brim
      c.fillStyle(gold);
      c.fillCircle(cx, size * 0.23, size * 0.08); // cap logo
      // Face: eye
      c.fillStyle(black);
      c.fillRect(cx - (facingRight ? 0.02 : -0.05) * size, size * 0.27, size * 0.025, size * 0.025);
      // Beard stub
      c.fillStyle(beard);
      c.fillCircle(cx, size * 0.38, size / 3.0);
    };

    // Helper: draw torso (front/back)
    const drawTorso = (c) => {
      c.fillStyle(black);
      c.fillRect(size * 0.22, size * 0.52, size * 0.56, size * 0.34); // torso
      c.fillStyle(white);
      c.fillRect(size * 0.18, size * 0.50, size * 0.06, size * 0.38); // left strap
      c.fillRect(size * 0.76, size * 0.50, size * 0.06, size * 0.38); // right strap
      c.fillRect(size * 0.18, size * 0.50, size * 0.64, size * 0.05); // neck trim
      // Logo
      c.lineStyle(2, white);
      c.strokeCircle(size / 2, size * 0.64, size * 0.10);
      c.fillStyle(white);
      c.fillCircle(size / 2, size * 0.64, size * 0.04);
      c.fillRect(size * 0.44, size * 0.66, size * 0.12, size * 0.02); // crossbar
    };

    // Helper: draw torso (side)
    const drawTorsoSide = (c, facingRight) => {
      const cx = facingRight ? size * 0.62 : size * 0.38;
      c.fillStyle(black);
      c.fillRect(cx - size * 0.06, size * 0.50, size * 0.12, size * 0.22); // torso
      c.fillStyle(white);
      c.fillRect(cx - size * 0.04, size * 0.50, size * 0.03, size * 0.20); // strap
      // Logo
      c.lineStyle(1, white);
      c.strokeCircle(cx, size * 0.62, size * 0.06);
      c.fillStyle(white);
      c.fillCircle(cx, size * 0.62, size * 0.02);
    };

    // Helper: draw arms (front)
    const drawArmsFront = (c) => {
      c.fillStyle(skin);
      c.fillRect(size * 0.04, size * 0.55, size * 0.16, size * 0.28); // left arm
      c.fillRect(size * 0.80, size * 0.55, size * 0.16, size * 0.28); // right arm
      // Tattoos
      c.fillStyle(tat);
      c.fillRect(size * 0.07, size * 0.60, size * 0.10, size * 0.10);
      c.fillRect(size * 0.07, size * 0.72, size * 0.10, size * 0.07);
      c.fillRect(size * 0.83, size * 0.60, size * 0.10, size * 0.10);
      c.fillRect(size * 0.83, size * 0.72, size * 0.10, size * 0.07);
      // Hands
      c.fillStyle(skin);
      c.fillCircle(size * 0.12, size * 0.86, size / 16);
      c.fillCircle(size * 0.88, size * 0.86, size / 16);
      c.fillStyle(0xc0c0c0);
      c.fillRect(size * 0.10, size * 0.84, size * 0.03, size * 0.02);
      c.fillRect(size * 0.87, size * 0.84, size * 0.03, size * 0.02);
    };

    // Helper: draw legs (front)
    const drawLegs = (c, legFrame) => {
      c.fillStyle(jeans);
      const leftX = legFrame === 1 ? size * 0.32 : size * 0.30;
      const rightX = legFrame === 2 ? size * 0.52 : size * 0.50;
      c.fillRect(leftX, size * 0.86, size * 0.12, size * 0.12);
      c.fillRect(rightX, size * 0.86, size * 0.12, size * 0.12);
    };

    // Helper: draw legs (side)
    const drawLegsSide = (c, legFrame) => {
      c.fillStyle(jeans);
      const x = legFrame === 1 ? size * 0.45 : size * 0.48;
      c.fillRect(x, size * 0.84, size * 0.10, size * 0.14);
      c.fillRect(x + size * 0.04, size * 0.84, size * 0.10, size * 0.14);
    };

    // ---------- FRONT VIEW ----------
    const cf = this.make.graphics({ x: 0, y: 0, add: false });
    drawHeadFront(cf);
    drawTorso(cf);
    drawArmsFront(cf);
    drawLegs(cf, 0);
    cf.generateTexture('player-idle-front', size, size);

    const cf1 = this.make.graphics({ x: 0, y: 0, add: false });
    drawHeadFront(cf1);
    drawTorso(cf1);
    drawArmsFront(cf1);
    drawLegs(cf1, 1);
    cf1.generateTexture('player-walk-front-1', size, size);

    const cf2 = this.make.graphics({ x: 0, y: 0, add: false });
    drawHeadFront(cf2);
    drawTorso(cf2);
    drawArmsFront(cf2);
    drawLegs(cf2, 2);
    cf2.generateTexture('player-walk-front-2', size, size);

    // ---------- BACK VIEW ----------
    const cb = this.make.graphics({ x: 0, y: 0, add: false });
    drawHeadBack(cb);
    drawTorso(cb);
    drawArmsFront(cb); // same arms from back
    drawLegs(cb, 0);
    cb.generateTexture('player-idle-back', size, size);

    const cb1 = this.make.graphics({ x: 0, y: 0, add: false });
    drawHeadBack(cb1);
    drawTorso(cb1);
    drawArmsFront(cb1);
    drawLegs(cb1, 1);
    cb1.generateTexture('player-walk-back-1', size, size);

    const cb2 = this.make.graphics({ x: 0, y: 0, add: false });
    drawHeadBack(cb2);
    drawTorso(cb2);
    drawArmsFront(cb2);
    drawLegs(cb2, 2);
    cb2.generateTexture('player-walk-back-2', size, size);

    // ---------- LEFT VIEW ----------
    const cl = this.make.graphics({ x: 0, y: 0, add: false });
    drawHeadSide(cl, false);
    drawTorsoSide(cl, false);
    cl.fillStyle(skin);
    cl.fillRect(size * 0.62, size * 0.55, size * 0.12, size * 0.20); // left arm (visible)
    cl.fillStyle(jeans);
    cl.fillRect(size * 0.44, size * 0.84, size * 0.10, size * 0.14);
    cl.fillRect(size * 0.48, size * 0.84, size * 0.10, size * 0.14);
    cl.generateTexture('player-idle-left', size, size);

    const cl1 = this.make.graphics({ x: 0, y: 0, add: false });
    drawHeadSide(cl1, false);
    drawTorsoSide(cl1, false);
    cl1.fillStyle(skin);
    cl1.fillRect(size * 0.62, size * 0.55, size * 0.12, size * 0.20);
    cl1.fillStyle(jeans);
    cl1.fillRect(size * 0.42, size * 0.84, size * 0.10, size * 0.14);
    cl1.fillRect(size * 0.48, size * 0.84, size * 0.10, size * 0.14);
    cl1.generateTexture('player-walk-left-1', size, size);

    const cl2 = this.make.graphics({ x: 0, y: 0, add: false });
    drawHeadSide(cl2, false);
    drawTorsoSide(cl2, false);
    cl2.fillStyle(skin);
    cl2.fillRect(size * 0.62, size * 0.55, size * 0.12, size * 0.20);
    cl2.fillStyle(jeans);
    cl2.fillRect(size * 0.46, size * 0.84, size * 0.10, size * 0.14);
    cl2.fillRect(size * 0.50, size * 0.84, size * 0.10, size * 0.14);
    cl2.generateTexture('player-walk-left-2', size, size);

    // ---------- RIGHT VIEW ----------
    const cr = this.make.graphics({ x: 0, y: 0, add: false });
    drawHeadSide(cr, true);
    drawTorsoSide(cr, true);
    cr.fillStyle(skin);
    cr.fillRect(size * 0.26, size * 0.55, size * 0.12, size * 0.20); // right arm (visible)
    cr.fillStyle(jeans);
    cr.fillRect(size * 0.42, size * 0.84, size * 0.10, size * 0.14);
    cr.fillRect(size * 0.48, size * 0.84, size * 0.10, size * 0.14);
    cr.generateTexture('player-idle-right', size, size);

    const cr1 = this.make.graphics({ x: 0, y: 0, add: false });
    drawHeadSide(cr1, true);
    drawTorsoSide(cr1, true);
    cr1.fillStyle(skin);
    cr1.fillRect(size * 0.26, size * 0.55, size * 0.12, size * 0.20);
    cr1.fillStyle(jeans);
    cr1.fillRect(size * 0.42, size * 0.84, size * 0.10, size * 0.14);
    cr1.fillRect(size * 0.48, size * 0.84, size * 0.10, size * 0.14);
    cr1.generateTexture('player-walk-right-1', size, size);

    const cr2 = this.make.graphics({ x: 0, y: 0, add: false });
    drawHeadSide(cr2, true);
    drawTorsoSide(cr2, true);
    cr2.fillStyle(skin);
    cr2.fillRect(size * 0.26, size * 0.55, size * 0.12, size * 0.20);
    cr2.fillStyle(jeans);
    cr2.fillRect(size * 0.44, size * 0.84, size * 0.10, size * 0.14);
    cr2.fillRect(size * 0.50, size * 0.84, size * 0.10, size * 0.14);
    cr2.generateTexture('player-walk-right-2', size, size);

    // ---------- ANIMATIONS ----------
    const dirs = ['front', 'back', 'left', 'right'];
    dirs.forEach(dir => {
      const cap = dir.charAt(0).toUpperCase() + dir.slice(1);
      this.anims.create({
        key: `playerIdle${cap}`,
        frames: [{ key: `player-idle-${dir}`, frame: 0 }],
        repeat: -1
      });
      this.anims.create({
        key: `playerWalk${cap}`,
        frames: [
          { key: `player-walk-${dir}-1`, frame: 0 },
          { key: `player-idle-${dir}`, frame: 0 },
          { key: `player-walk-${dir}-2`, frame: 0 },
          { key: `player-idle-${dir}`, frame: 0 }
        ],
        frameRate: 10,
        repeat: -1
      });
    });
  }

  // ============================================================
  // PLAYER FACE PORTRAITS — For UI, pranks, shop moments
  // ============================================================

  createPlayerPortraits() {
    const size = 96
    const canvas = this.make.graphics({ x: 0, y: 0, add: false })

    // ---------- NORMAL PORTRAIT ----------
    canvas.fillStyle(0xe8c39e, 1)
    canvas.fillCircle(size / 2, size / 2, size / 2.3) // face
    canvas.fillStyle(0x1a1a1a, 1)
    canvas.fillCircle(size / 2, size * 0.32, size / 2.1) // hair under cap
    canvas.fillRect(size * 0.1, size * 0.15, size * 0.8, size * 0.2) // cap
    canvas.fillStyle(0xffd700, 1)
    canvas.fillCircle(size / 2, size * 0.22, size * 0.07) // cap logo
    // Glasses
    canvas.lineStyle(3, 0x1a1a1a, 1)
    canvas.lineBetween(size * 0.3, size * 0.38, size * 0.22, size * 0.4)
    canvas.lineBetween(size * 0.7, size * 0.38, size * 0.78, size * 0.4)
    canvas.fillRect(size * 0.18, size * 0.36, size * 0.64, size * 0.07)
    // White beard
    canvas.fillStyle(0xf0f0f0, 1)
    canvas.fillCircle(size / 2, size * 0.68, size / 2.4)
    canvas.fillStyle(0xe8c39e, 1)
    canvas.fillRect(size * 0.3, size * 0.5, size * 0.4, size * 0.25) // chin bridge
    // Mustache
    canvas.fillStyle(0xf0f0f0, 1)
    canvas.fillEllipse(size / 2, size * 0.5, size * 0.2, size * 0.09)
    // Neck tattoo
    canvas.fillStyle(0x2a2a2a, 0.5)
    canvas.fillRect(size * 0.42, size * 0.42, size * 0.16, size * 0.08)
    canvas.generateTexture('player-portrait', size, size)

    // ---------- HURT PORTRAIT ----------
    const canvas2 = this.make.graphics({ x: 0, y: 0, add: false })
    canvas2.fillStyle(0xe8c39e, 1)
    canvas2.fillCircle(size / 2, size / 2, size / 2.3)
    canvas2.fillStyle(0x1a1a1a, 1)
    canvas2.fillCircle(size / 2, size * 0.32, size / 2.1)
    canvas2.fillRect(size * 0.1, size * 0.15, size * 0.8, size * 0.2)
    canvas2.fillStyle(0xffd700, 1)
    canvas2.fillCircle(size / 2, size * 0.22, size * 0.07)
    canvas2.lineStyle(3, 0x1a1a1a, 1)
    canvas2.lineBetween(size * 0.3, size * 0.38, size * 0.22, size * 0.4)
    canvas2.lineBetween(size * 0.7, size * 0.38, size * 0.78, size * 0.4)
    canvas2.fillRect(size * 0.18, size * 0.36, size * 0.64, size * 0.07)
    canvas2.fillStyle(0xff0000, 0.4) // blood/darkness overlay
    canvas2.fillCircle(size / 2, size * 0.68, size / 2.4)
    canvas2.fillStyle(0xf0f0f0, 1)
    canvas2.fillCircle(size / 2, size * 0.68, size / 2.6)
    canvas2.fillStyle(0xe8c39e, 1)
    canvas2.fillRect(size * 0.3, size * 0.5, size * 0.4, size * 0.25)
    canvas2.fillStyle(0xf0f0f0, 1)
    canvas2.fillEllipse(size / 2, size * 0.5, size * 0.2, size * 0.09)
    canvas2.fillStyle(0x2a2a2a, 0.5)
    canvas2.fillRect(size * 0.42, size * 0.42, size * 0.16, size * 0.08)
    canvas2.generateTexture('player-portrait-hurt', size, size)

    // ---------- VICTORY PORTRAIT ----------
    const canvas3 = this.make.graphics({ x: 0, y: 0, add: false })
    canvas3.fillStyle(0xe8c39e, 1)
    canvas3.fillCircle(size / 2, size / 2, size / 2.3)
    canvas3.fillStyle(0x1a1a1a, 1)
    canvas3.fillCircle(size / 2, size * 0.32, size / 2.1)
    canvas3.fillRect(size * 0.1, size * 0.15, size * 0.8, size * 0.2)
    canvas3.fillStyle(0xffd700, 1)
    canvas3.fillCircle(size / 2, size * 0.22, size * 0.07)
    canvas3.lineStyle(3, 0x1a1a1a, 1)
    canvas3.lineBetween(size * 0.3, size * 0.38, size * 0.22, size * 0.4)
    canvas3.lineBetween(size * 0.7, size * 0.38, size * 0.78, size * 0.4)
    canvas3.fillRect(size * 0.18, size * 0.36, size * 0.64, size * 0.07)
    canvas3.fillStyle(0xf0f0f0, 1)
    canvas3.fillCircle(size / 2, size * 0.68, size / 2.4)
    canvas3.fillStyle(0xe8c39e, 1)
    canvas3.fillRect(size * 0.3, size * 0.5, size * 0.4, size * 0.25)
    canvas3.fillStyle(0xf0f0f0, 1)
    canvas3.fillEllipse(size / 2, size * 0.5, size * 0.2, size * 0.09)
    canvas3.fillStyle(0x2a2a2a, 0.5)
    canvas3.fillRect(size * 0.42, size * 0.42, size * 0.16, size * 0.08)
    // Victory smile
    canvas3.fillStyle(0x4ade80, 1)
    canvas3.fillRect(size * 0.43, size * 0.56, size * 0.14, size * 0.06)
    canvas3.generateTexture('player-portrait-victory', size, size)

    // ---------- INKED PORTRAIT (tattoo shop) ----------
    const canvas4 = this.make.graphics({ x: 0, y: 0, add: false })
    canvas4.fillStyle(0xe8c39e, 1)
    canvas4.fillCircle(size / 2, size / 2, size / 2.3)
    canvas4.fillStyle(0x1a1a1a, 1)
    canvas4.fillCircle(size / 2, size * 0.32, size / 2.1)
    canvas4.fillRect(size * 0.1, size * 0.15, size * 0.8, size * 0.2)
    canvas4.fillStyle(0xffd700, 1)
    canvas4.fillCircle(size / 2, size * 0.22, size * 0.07)
    canvas4.lineStyle(3, 0x1a1a1a, 1)
    canvas4.lineBetween(size * 0.3, size * 0.38, size * 0.22, size * 0.4)
    canvas4.lineBetween(size * 0.7, size * 0.38, size * 0.78, size * 0.4)
    canvas4.fillRect(size * 0.18, size * 0.36, size * 0.64, size * 0.07)
    canvas4.fillStyle(0xf0f0f0, 1)
    canvas4.fillCircle(size / 2, size * 0.68, size / 2.4)
    canvas4.fillStyle(0xe8c39e, 1)
    canvas4.fillRect(size * 0.3, size * 0.5, size * 0.4, size * 0.25)
    canvas4.fillStyle(0xf0f0f0, 1)
    canvas4.fillEllipse(size / 2, size * 0.5, size * 0.2, size * 0.09)
    canvas4.fillStyle(0x2a2a2a, 0.5)
    canvas4.fillRect(size * 0.42, size * 0.42, size * 0.16, size * 0.08)
    // Fresh ink marks on face
    canvas4.fillStyle(0x000000, 0.4)
    canvas4.fillCircle(size * 0.32, size * 0.36, size * 0.035)
    canvas4.fillCircle(size * 0.68, size * 0.44, size * 0.035)
    canvas4.fillRect(size * 0.44, size * 0.5, size * 0.02, size * 0.04)
    canvas4.generateTexture('player-portrait-inked', size, size)
  }

  // ============================================================
  // ENEMIES
  // ============================================================

  createGhostSprite() {
    const size = 40
    const canvas = this.make.graphics({ x: 0, y: 0, add: false })
    canvas.fillStyle(0xffffff, 0.5)
    canvas.fillCircle(size / 2, size / 2, size / 2)
    canvas.fillStyle(0x00ffff, 0.9)
    canvas.fillCircle(size / 2 - size * 0.12, size * 0.38, size * 0.12)
    canvas.fillCircle(size / 2 + size * 0.12, size * 0.38, size * 0.12)
    canvas.fillStyle(0xff6b6b, 1)
    canvas.fillCircle(size / 2, size * 0.62, size * 0.07)
    canvas.generateTexture('ghost', size, size)
  }

  createGoblinSprite() {
    const size = 40
    const canvas = this.make.graphics({ x: 0, y: 0, add: false })
    canvas.fillStyle(0x4a7c59, 1)
    canvas.fillCircle(size / 2, size / 2, size / 2.2)
    canvas.fillStyle(0x2d5a27, 1)
    canvas.fillCircle(size / 2, size * 0.3, size / 2)
    canvas.fillStyle(0x8b4513, 1)
    canvas.fillRect(size * 0.3, size * 0.6, size * 0.4, size * 0.35)
    canvas.fillStyle(0x000000, 1)
    canvas.fillCircle(size * 0.35, size * 0.35, size * 0.06)
    canvas.fillCircle(size * 0.65, size * 0.35, size * 0.06)
    canvas.generateTexture('goblin', size, size)
  }

  createLadyGhostSprite() {
    const size = 56
    const canvas = this.make.graphics({ x: 0, y: 0, add: false })
    canvas.fillStyle(0xffd700, 0.45)
    canvas.fillCircle(size / 2, size / 2, size / 2)
    canvas.fillStyle(0xff6b00, 0.9)
    canvas.fillCircle(size / 2 - size * 0.1, size * 0.32, size * 0.13)
    canvas.fillCircle(size / 2 + size * 0.1, size * 0.32, size * 0.13)
    canvas.fillStyle(0xff0000, 1)
    canvas.fillEllipse(size / 2, size * 0.66, size * 0.12, size * 0.06)
    canvas.fillStyle(0xffd700, 0.35)
    canvas.fillEllipse(size / 2, size, size * 0.7, size * 0.45)
    canvas.generateTexture('lady-ghost', size, size)
  }

  // ============================================================
  // ENVIRONMENT
  // ============================================================

  createTattooShopSprite() {
    const size = 64
    const canvas = this.make.graphics({ x: 0, y: 0, add: false })
    canvas.fillStyle(0x2a2a2a, 1)
    canvas.fillRect(size * 0.2, size * 0.2, size * 0.6, size * 0.6)
    canvas.fillStyle(0x1a1a1a, 1)
    canvas.fillRect(size * 0.15, size * 0.1, size * 0.7, size * 0.15)
    canvas.fillStyle(0x4a4a4a, 1)
    canvas.fillRect(size * 0.45, size * 0.55, size * 0.1, size * 0.25)
    canvas.fillStyle(0x4ade80, 1)
    canvas.fillCircle(size * 0.5, size * 0.15, size * 0.08)
    canvas.generateTexture('tattoo-shop', size, size)
  }

  createCryptSprite() {
    const size = 64
    const canvas = this.make.graphics({ x: 0, y: 0, add: false })
    canvas.fillStyle(0x3a3a3a, 1)
    canvas.fillRect(size * 0.25, size * 0.2, size * 0.5, size * 0.6)
    canvas.fillStyle(0x1a1a1a, 1)
    canvas.fillRect(size * 0.42, size * 0.45, size * 0.16, size * 0.35)
    canvas.fillStyle(0xffd700, 0.3)
    canvas.fillCircle(size * 0.5, size * 0.3, size * 0.15)
    canvas.generateTexture('exit-crypt', size, size)
  }

  createTileTextures() {
    const floorSize = 32
    const floorCanvas = this.make.graphics({ x: 0, y: 0, add: false })
    floorCanvas.fillStyle(0x2d2d2d, 1)
    floorCanvas.fillRect(0, 0, floorSize, floorSize)
    floorCanvas.fillStyle(0x3a3a3a, 0.3)
    floorCanvas.fillRect(0, 0, floorSize, 2)
    floorCanvas.fillRect(0, floorSize - 2, floorSize, 2)
    floorCanvas.generateTexture('tile-floor', floorSize, floorSize)

    const wallSize = 32
    const wallCanvas = this.make.graphics({ x: 0, y: 0, add: false })
    wallCanvas.fillStyle(0x4a4a4a, 1)
    wallCanvas.fillRect(0, 0, wallSize, wallSize)
    wallCanvas.fillStyle(0x2a2a2a, 1)
    for (let i = 0; i < wallSize; i += 6) {
      wallCanvas.fillRect(i, 0, 3, wallSize)
    }
    wallCanvas.generateTexture('tile-wall', wallSize, wallSize)

    const hedgeSize = 32
    const hedgeCanvas = this.make.graphics({ x: 0, y: 0, add: false })
    hedgeCanvas.fillStyle(0x2d5a27, 1)
    hedgeCanvas.fillRect(0, 0, hedgeSize, hedgeSize)
    hedgeCanvas.fillStyle(0x1e3a1a, 0.5)
    hedgeCanvas.fillCircle(8, 8, 8)
    hedgeCanvas.fillCircle(24, 8, 8)
    hedgeCanvas.fillCircle(16, 20, 8)
    hedgeCanvas.generateTexture('tile-hedge', hedgeSize, hedgeSize)

    const tombSize = 32
    const tombCanvas = this.make.graphics({ x: 0, y: 0, add: false })
    tombCanvas.fillStyle(0x4a4a4a, 1)
    tombCanvas.fillRect(0, 0, tombSize, tombSize)
    tombCanvas.fillStyle(0x2a2a2a, 1)
    tombCanvas.fillRect(6, 6, 20, 14)
    tombCanvas.fillStyle(0x4ade80, 0.5)
    tombCanvas.fillRect(14, 6, 2, 4)
    tombCanvas.generateTexture('tile-tomb', tombSize, tombSize)
  }

  createParticleTextures() {
    const size = 8
    const canvas = this.make.graphics({ x: 0, y: 0, add: false })
    canvas.fillStyle(0xffd700, 1)
    canvas.fillRect(size / 2 - 1, 0, 2, size)
    canvas.fillRect(0, size / 2 - 1, size, 2)
    canvas.generateTexture('sparkle', size, size)

    const size2 = 6
    const canvas2 = this.make.graphics({ x: 0, y: 0, add: false })
    canvas2.fillStyle(0x8b0000, 1)
    canvas2.fillCircle(size2 / 2, size2 / 2, size2 / 2)
    canvas2.generateTexture('blood-splat', size2, size2)
  }

  createUITextures() {
    const size = 24
    const canvas = this.make.graphics({ x: 0, y: 0, add: false })
    canvas.fillStyle(0xff0000, 1)
    canvas.fillCircle(size * 0.35, size * 0.35, size * 0.2)
    canvas.fillCircle(size * 0.65, size * 0.35, size * 0.2)
    canvas.fillRect(size * 0.2, size * 0.35, size * 0.6, size * 0.5)
    canvas.generateTexture('ui-heart', size, size)

    const size2 = 24
    const canvas2 = this.make.graphics({ x: 0, y: 0, add: false })
    canvas2.fillStyle(0xffd700, 1)
    canvas2.fillRect(size2 * 0.45, 0, size2 * 0.1, size2 * 0.3)
    canvas2.fillRect(size2 * 0.3, size2 * 0.3, size2 * 0.4, size2 * 0.4)
    canvas2.fillRect(size2 * 0.45, size2 * 0.7, size2 * 0.1, size2 * 0.3)
    canvas2.generateTexture('ui-power', size2, size2)
  }
}
