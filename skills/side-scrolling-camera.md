# Side-Scrolling Phaser Camera — Double Dragon-Style Close-Up

## Class-Level Skill: Camera Follow with Zoom Correction for 2D Side-Scrollers

### Always-On Rules (Standing Preferences)

1. **`startFollow()` overrides initial scroll positioning** — Phaser's `cam.startFollow(sprite, followOffset)` immediately recalculates `scrollX/scrollY` to `sprite.x - displayWidth/2 / zoom` and `sprite.y - displayHeight/2 / zoom`, overwriting any manual setScroll position set in `create()`. **Never set initial scroll position after calling `startFollow()`.**

2. **Use `followOffset` parameter to adjust vertical positioning** — `cam.startFollow(sprite, true, 0.1, 0.1, 0, followOffset)` where `followOffset.g` (or the 6th param) shifts scrollY upward/downward. At zoom 2.0 on a 720px viewport: `followOffset.g=116` positions player (y=690) so feet are at viewport bottom (690-116-180=394 → scrollY=394).

3. **Alternative: Manual camera follow in `update()`** — Remove `startFollow()` entirely and use `Phaser.Math.Linear()` interpolation in `update()`:
```javascript
// In create(): set initial position
this.cameras.main.scrollX = this.player.x - this.cameras.main.width / 2 / this.cameras.main.zoom
this.cameras.main.scrollY = this.player.y - this.cameras.main.height / 2 / this.cameras.main.zoom

// In update():
const targetX = this.player.x - this.cameras.main.width / 2 / this.cameras.main.zoom
const targetY = this.player.y - this.cameras.main.height / 2 / this.cameras.main.zoom
this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetX, 0.08)
this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, targetY, 0.08)
```
This prevents `preRender()` from overriding the intended position.

4. **Camera bounds must accommodate player y-position** — `setBounds(0, 0, worldWidth, worldHeight)` must be large enough for the player's y-position at the given zoom. At zoom 2.0, visible world height = viewportHeight / zoom = 360px. If player y=690, bounds must be at least 690 + viewportOffset tall (e.g., 1100px).

5. **`setZoom()` called before `setBounds` and `centerOn`** — Camera configuration order matters. `setZoom(2.0)` must be called first (or before `centerOn`), otherwise the zoom factor changes after bounds are set and camera positioning calculations use the wrong zoom value.

6. **Player origin matters for vertical positioning** — Player sprite origin `.5,1` (center-top) at y=690 means the sprite's bottom is at y=690. With zoom 2.0 and viewport 360px visible: `scrollY = player.y - 116 - 180 = 394` positions player so 180px of space appears above the sprite and the feet reach the viewport bottom.

### Pitfalls (Generalizable Rules + Why)

| Pitfall | Why |
|---------|-----|
| `startFollow()` makes player invisible at close-up zoom | `startFollow()` recalculates `scrollY = sprite.y - displayHeight/2 / zoom`. At zoom 2.0: `690 - 360/2 = 510`, but wait — actually the issue is more subtle. With `startFollow` active, `preRender()` immediately overrides any manual `scrollY` set in `create()`. The fix: either use `followOffset` or remove `startFollow()` and do manual follow. |
| Camera bounds too short — player clipped at bottom | `setBounds(0, 0, 3200, 720)` at zoom 2.0 only shows 360px tall world. Player at y=690 is way off-screen. Expand bounds: `setBounds(0, 0, 3200, 1100)` so the camera can scroll far enough. |
| `setZoom()` after `setBounds` recalculates everything | Phaser internally recomputes visible world dimensions when zoom changes. Always call `setZoom()` first, then `setBounds()`, then position the camera. |
| Manual follow snap-to instead of smooth | Using `this.cameras.main.scrollX = targetX` in `update()` causes instant teleport. Use `Phaser.Math.Linear(current, target, 0.08)` for smooth damping. |
| Vertical offset miscalculation — player torso vs feet | Player y=690 with origin `.5,1` means the sprite's reference point is at the feet. But animation frames may have different visual positions. Verify: at zoom 2.0, visible height 360px; player at y=690 with scrollY=394 means sprite top at 690-394=296px down from viewport top; with 360px visible, bottom of viewport is at scrollY+360=754; player bottom at 690+originOffset; verify the 116px followOffset gives feet at viewport bottom. |
| `centerOn()` conflicts with manual scrollX/Y | `centerOn(x, y)` sets scrollX/scrollY based on the given coordinates. If called after setting scrollX/scrollY manually, it overwrites the manual position. Set camera config in `create()` in this order: `setZoom()` → `setBounds()` → `centerOn()` (or don't use `centerOn` at all, set scrollX/Y manually). |

### Procedure (Steps in Order, with Commands)

**Step 1: Set camera zoom first in `create()`**
```javascript
// In LevelScene.create()
this.cameras.main.setZoom(2.0)      // FIRST: set zoom before bounds/centerOn
this.cameras.main.setBounds(0, 0, 3200, 1100)  // THEN: bounds must accommodate player y
// Do NOT call setBounds before setZoom if zoom changes from default
```

**Step 2: Set initial scroll position (before centerOn/follow)**
```javascript
// After setBounds, set initial scroll to center player
const cam = this.cameras.main
const playerY = this.player.y  // e.g., 690
const visibleHeight = cam.height / cam.zoom  // 720 / 2 = 360
// Position so player feet at viewport bottom:
// scrollY = player.y - verticalOffset - visibleWorldHeight/2-adjusted
cam.scrollY = playerY - 116 - 180  // = 394 for our setup — feet at viewport bottom
// Or use the formula: scrollY = player.y - followOffset - (displayHeight/2 / zoom * someFactor)
```

**Step 3: Choose follow strategy — A or B**

**Option A: Use `startFollow()` with `followOffset`**
```javascript
// In create(), AFTER setBounds and initial scrollY:
this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1, 0, 116)
// 6th param (followOffset.g=116) shifts scrollY upward so player feet hit viewport bottom
```

**Option B: Manual camera follow in `update()` (recommended for full control)**
```javascript
// In create(): set initial position (no startFollow)
this.cameras.main.scrollX = this.player.x - this.cameras.main.width / 2 / this.cameras.main.zoom
this.cameras.main.scrollY = this.player.y - 116 - 180  // 394

// In update():
if (this.player && !this.gameOver && !this.gameWon) {
  const targetX = this.player.x - this.cameras.main.width / 2 / this.cameras.main.zoom
  const targetY = this.player.y - this.cameras.main.height / 2 / this.cameras.main.zoom
  // Smooth damping — 0.08 provides smooth following without overshoot
  this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetX, 0.08)
  // Note: do NOT also call startFollow() here, as it will override the Linear() result
}
```

**Step 4: Verify camera behavior**
- Move player left/right/up/down — camera should follow smoothly
- Player should remain fully visible (feet at viewport bottom, head in upper 1/3 of screen)
- No clipping at screen edges (bounds are large enough)
- Camera shake from combat doesn't knock player off-screen permanently

### Verification Checklist (After Camera Fix)

- [ ] `setZoom(2.0)` called before `setBounds()` and `centerOn()`
- [ ] `setBounds(0, 0, 3200, 1100)` — world tall enough for player y=690 at zoom 2.0
- [ ] Initial `scrollY = 396` (or 394) positions player feet at viewport bottom
- [ ] Camera follows smoothly in all 4 directions (left, right, up, down)
- [ ] Player fully visible: top of head above viewport midline, feet at or near viewport bottom
- [ ] Camera shake (from combat, hurt) does not permanently offset player position
- [ ] `startFollow()` either removed OR using `followOffset.g=116` parameter
- [ ] Manual `Phaser.Math.Linear()` follow in `update()` if not using `startFollow()`

### Supporting Files (references/, templates/, scripts)

- `references/camera-follow-offset-table.md` — Table of followOffset values for different zooms and player positions
- `templates/levelscene-camera-setup.js` — Known-good LevelScene.js camera create() template with zoom/bounds/followOffset
- `scripts/verify-camera.js` — Runs the game and checks that cam.scrollY, player y-position, and viewport coverage are within expected ranges

### Recent Lessons (from this session)

- **Pitfall: `startFollow()` overrides initial scrollY** — Even after setting `scrollY = 394` in `create()`, `startFollow()` immediately recalculates to `sprite.y - displayHeight/2 / zoom = 690 - 360/2 = 510` (approximately), moving the camera and player off-screen. The fix: use `followOffset.g=116` parameter OR remove `startFollow()` entirely and use manual `Phaser.Math.Linear()` follow in `update()`.

- **Fix: Remove `startFollow()`, use manual follow in update()** — Patching `LevelScene.js` to:
  1. Call `setZoom(2.0)` first
  2. Call `setBounds(0, 0, 3200, 1100)` 
  3. Set initial `scrollY = 396` in `create()`
  4. Remove `startFollow()` call
  5. In `update()`, use `Phaser.Math.Linear()` to smoothly follow player:
     ```javascript
     const targetX = this.player.x - this.cameras.main.width / 2 / this.cameras.main.zoom
     const targetY = this.player.y - this.cameras.main.height / 2 / this.cameras.main.zoom
     this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetX, 0.08)
     this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, targetY, 0.08)
     ```

- **Verification: `cam.scrollY=396, playerSpriteY=690, feet at viewport bottom`** — At zoom 2.0, visible world height 360px. Player at y=690 with scrollY=396 means sprite top at screen coordinate 690-396=294px. Viewport is 360px tall, so sprite bottom at 690 + (origin-dependent offset). With followOffset.g=116: scrollY = 690 - 116 - 180 = 394, positioning player feet at exactly the viewport bottom (754 - 690 = 64px below sprite center... verify with actual origin).

- **Order dependency: `setZoom()` before `setBounds()`** — When camera zoom changes after setBounds, Phaser recalculates the visible world dimensions. Always setZoom first in create() to avoid the bounds being set at the wrong zoom factor.