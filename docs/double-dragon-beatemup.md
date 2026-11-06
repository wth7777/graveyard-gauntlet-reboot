# Double Dragon-Style Beat-'Em-Up Mechanics

## Core Gameplay Systems

### 2D Side-Scrolling Movement (Double Dragon Style)

**Dual-axis movement**: Independent horizontal (X) and vertical (Y) movement
- Up/Down arrows move character in Y-axis within camera bounds
- Left/Right primary traversal
- Diagonal speed normalization: Diagonals match cardinal speed (multiply by 0.7071)

**Camera system**:
- Smooth camera following with damping factor (0.08-0.1)
- Z-index sorting via `sprite.setDepth(y)` for pseudo-depth
- Zoom level 2.0 for close-up Double Dragon-style view

### Combat System

**Punch/Kick Mechanics**:
- Circle-based attack zones centered on forward direction
- Attack range: 40px, width: 20px
- Damage: 30 HP per hit
- Knockback: Enemy pushed away with normalized velocity
- Invincibility frames: 1.5 seconds after player hit
- Attack cooldown: 0.4 seconds

**Player State Machine**:
- States: idle, walk, punch, kick, jump, hurt
- 2-frame walking animation at 10fps
- Directional textures: front, back, left, right
- Attack interrupt on movement

### Enemy AI Patterns

**Ghost (floating)**:
- Detection radius: 200px
- Chase speed: 60
- Health: 30 HP
- Patrol: Random waypoints outside detection

**Goblin (ground)**:
- Detection radius: 150px
- Chase speed: 90
- Health: 40 HP
- Stops at detection threshold

**Lady Ghost (special)**:
- Spawns from screen edges
- 15-25 second spawn cooldown
- Chat bubble dialogue with taunts

### Hit Box System

```javascript
// Create attack zone
const attackZone = this.add.circle(attackX, attackY, attackWidth, 0xff0000, 0.3)
this.physics.add.existing(attackZone)
this.time.delayedCall(200, () => attackZone.destroy())

// Overlap handler
this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyOverlap, null, this)
```

## Visual Design Principles (Pixel Art)

### Character Sprite Design
- 6-direction sprite sheets: front, back, left, right
- 2-frame walking animation cycle
- Directional naming convention: `player-walk-{dir}-{frame}`
- 48px base size for player character

### Environmental Composition
- Layered parallax: distant → mid → foreground
- Depth sorting: `sprite.setDepth(0-250)` for z-index
- Additive blend mode for lights/glow
- Fog overlays with alpha blending

### Color Palette for Graveyard Theme
- Dark background: `#1a1a1a` (deep night)
- Accent gold: `#ffd700` (lanterns, UI)
- Blood red: `#ff0000` (damage, attacks)
- Skin tone: `#e8c39e` (player character)

## Platform Considerations

### Mobile Touch Controls
- Touch state tracking object with direction/action flags
- HTML button integration with passive: false for prevention
- Visual feedback on touch states

### Performance Optimization
- Texture reuse for environmental props
- Particle pooling for effects
- Camera following with interpolation instead of snapping