# Week 5 Example 3 — Maze with Mario and Goombas

## What This Example Demonstrates

> **Note for students:** This section is included in example files only to help you study. Do not include it in your Side Quest submissions.

This example combines sprite sheet animation, collectible objects, and a tile-based maze into a complete mini-game with wall collision, item collection, and a locked exit. The character is Mario, the collectibles are Goombas, the walls are drawn as bricks, and the corridors open onto a starry-night background.

- **2D array as a map** — the maze is stored as a grid of numbers; each number represents a tile type (floor, wall, collectible, exit); the array drives both the visual layout and the game logic
- **Canvas sized to the maze plus a footer** — the canvas is `MAZE_W` wide and `MAZE_H + FOOTER_H` tall, so the maze fits exactly and a strip below it holds the on-screen instructions
- **Image background showing through the maze** — a starfield image is drawn behind the grid and floor tiles are left unpainted, so the stars show through the corridors while only walls and the exit are drawn
- **Procedural brick walls** — `drawBrickTile()` paints each wall tile as a running-bond brick pattern and uses `drawingContext.clip()` to keep the staggered bricks from spilling onto neighbouring floor tiles
- **On-screen instructions footer** — `drawInstructions()` draws the controls and objective along the footer strip so the player always knows how to play
- **Building objects from map data** — `setup()` scans the maze array to find collectible tiles and the start position; Goombas are created as objects at runtime rather than hardcoded
- **`rectMode(CORNER)`** — switches `rect()` back to top-left positioning for drawing tiles; used here because tile coordinates come from the array index, not a centre point
- **Single-row sprite sheet with horizontal flip** — Mario's frames all face right, so `drawCharacter()` reads one row of the sheet and mirrors the sprite with `scale(-1, 1)` when walking left
- **Draw offset for an off-centre sprite** — Mario's art is bottom-aligned within each sheet cell, so `SPRITE.drawOffsetY` nudges him up a few pixels to sit centred on his collision box
- **Corner-based wall collision** — checks all four corners of the player's collision box against the maze tile at each corner; pushes the player out from the direction with the smallest overlap
- **Collision box tuned to the sprite** — `hw` and `hh` are sized to wrap Mario's body (including his lower half) so he can't sink into walls, while staying small enough to clear the corridors
- **`dist()`** — returns the distance between two points; used for both Goomba collection and exit detection with a threshold based on `TILE_SIZE`
- **Locked exit** — the exit tile changes colour and only activates when `coinsCollected === coins.length`; a single boolean condition controls both the visual and the logic
- **Self-sizing HUD panel** — `drawHUD()` measures its text with `textWidth()` and sizes the bordered panel to fit, so the frame always wraps the text
- **Image-backed win screen** — `drawWinScreen()` fills the canvas with the Super Mario background art, dims it slightly for contrast, then draws the "LEVEL CLEAR!" message on top
- **`updateCoins()` and `drawCoins()` separation** — update logic and drawing are kept in separate functions

## Setup and Interaction Instructions

To run the sketch locally, open `index.html` in Google Chrome using Live Server.

**Controls:** WASD to move.

Collect all 3 Goombas, then reach the bright green exit tile to win.

**Opening the Chrome Console**

- **Windows:** Press `F12` or `Ctrl + Shift + J`, then click the **Console** tab
- **Mac:** Press `Cmd + Option + J`

The console will show any errors in your sketch.

## Assets

| File | Source |
|------|--------|
| `assets/images/mario sprites.png` | Cyloopzaya, Super Mario 3 inspired 32x32 sprite sheet — DeviantArt |
| `assets/images/goomba sprites.png` | Goomba Sprite Sheet — Pixilart |
| `assets/images/super mario background.jpg` | Super Mario Background — WallpaperCave |
| `assets/images/super mario star.png` | Sky Backgrounds from Paper Mario — Supper Mario Broth |

## References

Cyloopzaya. n.d. *Super Mario 3 inspired 32x32 sprite sheet*. DeviantArt. Retrieved June 10, 2026, from https://www.deviantart.com/cyloopzaya/art/Super-Mario-3-inspired-32x32-sprite-sheet-895115073

Pixilart. n.d. *Goomba Sprite Sheet*. Pixilart. Retrieved June 10, 2026, from https://www.pixilart.com/art/goomba-sprite-sheet-sr22a1da99462d8

WallpaperCave. n.d. *Super Mario Background*. WallpaperCave. Retrieved June 10, 2026, from https://wallpapercave.com/super-mario-background

Supper Mario Broth. n.d. *Sky Backgrounds from Paper Mario*. Supper Mario Broth. Retrieved June 10, 2026, from https://www.suppermariobroth.com/post/21798796414/sky-backgrounds-from-paper-mario-source

> Mario, Goomba, and the Super Mario artwork are trademarks of Nintendo. These assets are used here for educational, non-commercial coursework only.
