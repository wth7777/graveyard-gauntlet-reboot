# Double Dragon-Style Beat-'Em-Up Mechanics

## Class-Level Skill: 2D Side-Scrolling Beat-Em-Up Game Design

### Always-On Rules (Standing Preferences)

1. **Dual-axis movement with diagonal normalization** — Up/Down moves in Y-axis; Left/Right primary traversal. Diagonals multiply by 0.7071 so diagonal speed = cardinal speed. Essential for feeling "right" in a Double Dragon-style game.

2. **Smooth camera follow with damping** — Camera tracks player via `Phaser.Math.Linear(scrollX, targetX, 0.08)` or `startFollow()` with proper `followOffset`. Do not set scroll position after `startFollow()` or it will be overridden in `preRender()`.

3. **Circle-based attack zones with duration** — Create attack zone: `this.add.circle(attackX, attackY, attackWidth, 0xff0000, 0.3)`, `this.physics.add.existing(attackZone)`, `this.time.delayedCall(200, () => attackZone.destroy())`. Check overlap with enemies via `physics.add.overlap()` or distance check `Phaser.Math.Distance.Between()`.

4. **Player state machine: idle/walk/punch/kick/jump/hurt** — 6 core states. Walking: 2-frame cycle at 10fps. Directional textures named `player-walk-{dir}-{frame}`. Hurt state auto-recover after invulnerability frames (1.5s) + animation complete.

5. **Enemy AI: detection radius + patrol/chase** — Ghost: 200px radius, chase speed 60, patrol random waypoints. Goblin: 150px radius, chase speed 90, idle when beyond detection. Lady Ghost: spawns from screen edges, 15-25s cooldown, chat bubble dialogue.

6. **Hit box system with knockback** — On player enemy overlap: `enemy.health -= 30`; if health ≤ 0, `destroyEnemy()`; else apply knockback: `enemy.setVelocity(dir.x * 100, dir.y * 100)`; 200ms then `setVelocity(0, 0)`. Player loses 20 HP, enters invulnerable state for 1500ms.

7. **3-button combat: punch, kick, jump** — Punch/kick have different ranges and frame data. Jump can be used in air for attack. Block/Duck: Down + Attack blocks (50% damage), Down + Jump ducks under high attacks.

8. **Combo window: consecutive hits within 0.5s** — Track `lastHitTime`. If `currentTime - lastHitTime < 500`, increment combo counter. Combo multiplier applies to damage. Reset combo if >0.5s since last hit.

9. **Power system: drain on actions, recover by standing** — `playerPower` drains at `powerDrainRate` (8/sec while moving), additional `powerAttackDrain` (15) on attack, `powerHitDrain` (25) on taking damage. Power ≤ 0 reduces `playerSpeed` to 80. Power fully recovers if not moving and not attacking for 5s.

10. **Depth sorting via Y-position** — Enemies and sprites use `sprite.setDepth(Math.round(y))` for pseudo-3D layering. Higher Y = rendered on top. Essential for beat-em-up where enemies on different planes must not visually overlap incorrectly.

11. **Mobile touch controls: state tracking + HTML button integration** — `this.touch = { up: false, down: false, left: false, right: false, attack: false, interact: false }`. HTML touch buttons with `{ passive: false }` preventDefault. Buttons: D-pad (up/down/left/right), attack, interact, jump, special.

12. **Screen scrolling / scene transitions** — Double Dragon uses instant screen transitions between areas, often with cinematic zooms. Smooth camera follow is for open levels; for compartmentalized scenes, use scene swaps with player position persistence.

### Pitfalls (Generalizable Rules + Why)

| Pitfall | Why |
|---------|-----|
| Two competing hurt-recovery mechanisms | Player.js had both `hurtTimer` in update loop AND `scene.time.delayedCall(400)`. Result: conflicting state, hurt never transitions back to idle. Fix: keep only `hurtTimer` in update loop; auto-recover when `hurtTimer <= 0 && !anims.isPlaying()`. |
| `startFollow()` overriding initial scrollY | Phaser's `startFollow()` in `preRender()` immediately recalculates `scrollY = sprite.y - displayHeight/2 / zoom`, overwriting any manual position set in `create()`. Fix: remove `startFollow()`, use manual `Phaser.Math.Linear()` follow in `update()`, OR use `followOffset` parameter. |
| Player sprite not rendering from spritesheet | Player used `this.add.rectangle()` instead of `this.load.image()` sprite with animation config. Fix: load sprite from cousin_spritesheet.png with proper animation frames config. |
| Camera showing too much, character too small | Default camera zoom 1.0 showing full world. Set `this.cameras.main.setZoom(2.0)` for close-up Double Dragon-style view. Then expand bounds and use followOffset to keep player visible. |
| Only two files showing as changed in git diff | Main branch had stale content from initial commit. After resetting main to match gh-pages content, all changes properly tracked. |
| Enemy depth sorting not working | Enemies used rect shapes instead of sprites; no Y-based depth assignment. Fix: `this.sprite = scene.add.sprite()` with `this.sprite.setDepth(Math.round(this.y))`. |
| Player sprite not rendering from spritesheet | Player used `this.add.rectangle()` instead of `this.load.image()` sprite. Fix: Change to sprite-based rendering from cousin_spritesheet.png with proper animation config. |
| Hurt state never transitioning back to idle | Player.state stayed 'hurt' indefinitely, blocking all movement. Fix: Add `hurtTimer` decrement in update(); auto-recover when timer expires and no animation playing. |
| Permanent loading screen on live site | `index.html #loading-overlay` element never hidden. Fix: Add `window.__hideLoading()` with opacity transition + `setTimeout(10s)` fallback; add `window.__showError()` for Phaser boot errors. |
| GitHub Pages 404 on JS bundle | `gh-pages index.html` referenced `./src/main.js` (404) instead of built bundle. Fix: Replace gh-pages index.html with Vite-built version referencing correct bundle path. |
| Vite cache serving stale build | `node_modules/.vite` cache prevented rebuilt bundle from being served. Fix: Clear `node_modules/.vite` and `dist` before rebuild. |
| Conflicting camera zoom | Original project used zoom 2.5; reboot changed to 2.0 for closer view. Ensure camera bounds and followOffset are recalculated for new zoom value. |
| `setZoom()` after `setBounds()` recalculates visible world | Phaser internally recomputes world dimensions on zoom change. Always `setZoom()` first, then `setBounds()`, then position camera. |

### Procedure (Steps in Order, with Conventions)

**Step 1: Set up player sprite from spritesheet**
```javascript
// In BootScene.create() or MainScene.create()
this.load.image('cousin_spritesheet', '/graveyard-gauntlet-reboot/assets/images/character/cousin_spritesheet.png')

// In MainScene.create(), after player creation:
this.player = this.physics.add.sprite(spawnX, spawnY, 'cousin_spritesheet')
this.player.setDisplaySize(24, 24)
this.player.body.setSize(20, 20)
```

**Step 2: Create animation frames from 16-frame spritesheet**
The cousin_spritesheet.png is 768×2048 RGBA, 2-column × 8-row grid:
- Frames: 384×256 per cell
- Grid: column 0 = front/back views, column 1 = side views (or interleaved)
- Frame order per the .json metadata: idle(0-1), walk(2-5), punch(6-7), kick(8-9), jump(8-9), hurt(10-13), recovery(14-15)

Create animations:
```javascript
// Idle animations per direction
this.anims.create({
  key: 'playerIdleFront',
  frames: [{ key: 'cousin_spritesheet', frame: 0 }],
  repeat: -1
})
// Walk animations (2-frame cycle at 10fps)
this.anims.create({
  key: 'playerWalkFront',
  frames: [
    { key: 'cousin_spritesheet', frame: 2 },
    { key: 'cousin_spritesheet', frame: 3 },
    { key: 'cousin_spritesheet', frame: 4 },
    { key: 'cousin_spritesheet', frame: 5 }
  ],
  frameRate: 10,
  repeat: -1
})
// Similar for back, left, right directions...
```

**Step 3: Player movement with directional input**
```javascript
// In update(), track last direction for texture selection
this.player.lastDir = { x: 0, y: -1 }  // initial: facing up

// Movement with diagonal normalization
if (this.cursors.left.isDown || this.wasd.A.isDown) {
  this.player.setVelocity(-1 * this.playerSpeed, 0)
  this.player.lastDir = { x: -1, y: 0 }
}
if (this.cursors.right.isDown || this.wasd.D.isDown) {
  this.player.setVelocity(1 * this.playerSpeed, 0)
  this.player.lastDir = { x: 1, y: 0 }
}
if (this.cursors.up.isDown || this.wasd.W.isDown) {
  this.player.setVelocity(0, -1 * this.playerSpeed)
  this.player.lastDir = { x: 0, y: -1 }
}
if (this.cursors.down.isDown || this.wasd.S.isDown) {
  this.player.setVelocity(0, 1 * this.playerSpeed)
  this.player.lastDir = { x: 0, y: 1 }
}

// Diagonal normalization
const vx = this.player.velocity.x
const vy = this.player.velocity.y
const len = Math.sqrt(vx * vx + vy * vy)
if (len > 0) {
  this.player.setVelocity(vx / len * this.playerSpeed, vy / len * this.playerSpeed)
}
```

**Step 4: Attack system with circle hitbox**
```javascript
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
  
  // Create circle hitbox
  const attackZone = this.add.circle(attackX, attackY, attackWidth, 0xff0000, 0.3)
  this.physics.add.existing(attackZone)
  this.time.delayedCall(200, () => attackZone.destroy())
  
  // Check overlap with enemies
  this.physics.add.overlap(attackZone, this.enemies, (zone, enemy) => {
    this.hitEnemy(enemy)
  })
  
  this.playSound('attack')
  this.cameraShake = 0.15
  this.cameraShakeIntensity = 6
}

// Handle hitting an enemy
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
```

**Step 5: Player state machine in update()**
```javascript
update(time, dt) {
  if (this.gameOver || this.gameWon) return
  
  // Power drain
  const isMoving = // check input ...
  let drainRate = this.powerDrainRate * dt
  if (this.player.attacking) {
    drainRate += this.powerAttackDrain * dt
    this.player.attackTimer -= dt
    if (this.player.attackTimer <= 0) {
      this.player.attacking = false
    }
    this.player.setVelocity(0, 0)
  }
  this.playerPower = Math.max(0, this.playerPower - drainRate)
  if (this.playerPower <= 0) {
    this.playerSpeed = 80
  } else {
    this.playerSpeed = 160
  }
  
  // Movement
  if (!this.player.attacking) {
    let vx = 0, vy = 0
    // ... input handling ...
    const len = Math.sqrt(vx * vx + vy * vy)
    if (len > 0) {
      vx /= len; vy /= len  // normalize
      this.player.setVelocity(vx * this.playerSpeed, vy * this.playerSpeed)
      // Update walking animation
      this.player.walkTimer += dt
      if (this.player.walkTimer > 0.15) {
        this.player.walkTimer = 0
        this.player.walkFrame = (this.player.walkFrame + 1) % 2
        this.player.setTexture(`player-walk-${dir.y=== -1 ? 'back' : dir.y=== 1 ? 'front' : dir.x=== -1 ? 'left' : 'right'}-${this.player.walkFrame + 1}`)
      }
    } else {
      this.player.setTexture(`player-idle-${dir.y=== -1 ? 'back' : dir.y=== 1 ? 'front' : dir.x=== -1 ? 'left' : 'right'}`)
    }
  }
  
  // Hurt state recovery
  if (this.player.hurtTimer > 0) {
    this.player.hurtTimer -= dt
    if (this.player.hurtTimer <= 0 && !this.player.anims.isPlaying()) {
      this.player.setTexture(`player-idle-${this.player.lastDir.y=== -1 ? 'back' : this.player.lastDir.y=== 1 ? 'front' : this.player.lastDir.x=== -1 ? 'left' : 'right'}`)
      this.player.hurtTimer = 0
    }
  }
  
  // Camera follow (manual, no startFollow)
  if (this.player) {
    const targetX = this.player.x - this.cameras.main.width / 2 / this.cameras.main.zoom
    const targetY = this.player.y - this.cameras.main.height / 2 / this.cameras.main.zoom
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetX, 0.08)
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, targetY, 0.08)
  }
}
```

### Verification Checklist (After Implementing Mechanics)

- [ ] Player sprite animates: Idle → Walk → Punch → Kick → Jump → Hurt → Idle
- [ ] Movement in 4 directions with diagonal normalization (shift key for sprint optional)
- [ ] Punch attack zone: 40px range, 20px wide circle, damages enemies on overlap
- [ ] Kick attack: different range/damage than punch (configurable via playerPower or separate cooldown)
- [ ] Enemy on hit: health -30, knockback with velocity, 200ms then stop
- [ ] Enemy death: remove from scene, player power +20, score +50
- [ ] Hurt state: player invulnerable 1.5s, alpha 0.5, then back to idle
- [ ] Power system: drains on actions, recovers when standing still, speed reduction at 0%
- [ ] Combo window: hits within 0.5s increment combo; >0.5s resets combo
- [ ] Touch controls: D-pad moves, buttons attack/interact/jump/special
- [ ] Camera follows smoothly, player visible at zoom 2.0 with feet at viewport bottom
- [ ] Depth sorting: higher Y sprites rendered on top of lower Y

### Supporting Files (references/, templates/, scripts)

- `references/beat-em-up-combat-table.md` — Frame data, damage values, combo timings
- `templates/player-state-machine.js` — Minimal state machine skeleton for beat-em-up player
- `scripts/verify-combat.js` — Runs test scenarios: punch kills ghost, kick kills goblin, hurt recovers, power drains/recover

### Recent Lessons (from this session / related context)

- **Pitfall: Two competing hurt-recovery mechanisms** — The original MainScene.js had both `hurtTimer` decrement in `update()` AND `scene.time.delayedCall(400)` for recovery. These fought each other, causing hurt state to either never expire or reset unexpectedly. The fix was to remove `delayedCall` and keep only the `hurtTimer` in the update loop, with auto-recovery when `hurtTimer <= 0 && !anims.isPlaying()`.

- **Pitfall: `startFollow()` overriding camera scroll** — In the camera fix session, `startFollow()` immediately overrode the manually set `scrollY`, making the player invisible at zoom 2.0. The resolution was removing `startFollow()` and using manual `Phaser.Math.Linear()` follow in `update()` with `followOffset` compensation.

- **Pitfall: Player invisible at zoom 2.0 without bounds expansion** — Even with followOffset, if `setBounds()` is only 720px tall and player y=690, the camera can't scroll high enough. Must expand to 1100px tall (or greater) so the camera can position the player visibly.

- **Fix: Manual camera follow replaces startFollow** — Patching LevelScene.js: remove `this.cameras.main.startFollow(this.player.sprite)`, add manual `Phaser.Math.Linear()` follow in `update()`, set initial `scrollY = 396` in `create()`, use `setBounds(0, 0, 3200, 1100)`, and ensure `setZoom(2.0)` is called first.

- **Art pipeline: 16-frame spritesheet from cousin photos** — The cousin_spritesheet.png is 768×2048 RGBA, 2-column × 8-row grid with 384×256 per frame. Frames ordered: idle(0-1), walk(2-5), punch(6-7), kick(8-9), jump(8-9), hurt(10-13), recovery(14-15). Genuine alpha transparency (76.7% transparent pixels). Used as `this.load.image('cousin_spritesheet', ...)` with Phaser animation frames config.