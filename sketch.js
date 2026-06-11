// ============================================================
// Week 5 Example 3 — Maze with Animated Character and Coins
// ============================================================
// This sketch combines everything from Examples 1 and 2:
//   - Animated walking character (4 directions)
//   - Animated spinning coins
//   - A hardcoded maze drawn with shapes
//   - Wall collision to keep the player inside the maze
//   - Collect all coins to unlock the exit
// ============================================================

// ------------------------------------------------------------
// SPRITE CONFIGURATION — Mario Character
// The Mario sheet is a 1280x1280 image laid out as a 5x5 grid,
// so each frame cell is 256x256 pixels. All of Mario's poses
// face right, so we use the top row as a walk cycle and simply
// flip the sprite horizontally when walking left (handled in
// drawCharacter). Up/down reuse the same right-facing frames.
// ------------------------------------------------------------
const SPRITE = {
  frameWidth:  256,
  frameHeight: 256,
  numFrames:   4,   // first four poses of the top row
  row:         0,   // top row of the sheet = walk cycle
  animSpeed:   8,
  scale:       0.15, // 256 * 0.15 ≈ 38px, comfortably inside a tile
  // Mario's art is bottom-aligned in each cell (padding is all at the
  // top), so nudge the drawing up a few px to centre his body on the
  // collision box — this keeps his feet from sinking into walls.
  drawOffsetY: -3,
};

// ------------------------------------------------------------
// GOOMBA CONFIGURATION (collectible item)
// The Goomba sheet is 483x238. The top row holds three Goomba
// frames (~161x119 each); we animate across those three so the
// Goomba "shuffles" while waiting to be collected.
// ------------------------------------------------------------
const GOOMBA = {
  frameWidth:  161, // 483 / 3 frames
  frameHeight: 119, // 238 / 2 rows  (top row only)
  numFrames:   3,
  animSpeed:   10,
  scale:       0.35, // ~56x42px, fits inside a 50px tile
};

// ------------------------------------------------------------
// MAZE
// A 2D array where each number represents one tile type.
// The maze is 16 tiles wide and 10 tiles tall.
// TILE_SIZE controls how large each tile is drawn in pixels.
//
// Tile values:
//   0 = floor (walkable)
//   1 = wall
//   2 = start position
//   3 = coin location
//   4 = exit (locked until all coins collected)
// ------------------------------------------------------------
const TILE_SIZE = 50;

const MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 0, 0, 1, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 3, 1, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 3, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 4, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Pixel dimensions of the maze grid, plus a footer strip below the
// maze that holds the on-screen instructions.
const MAZE_W   = TILE_SIZE * MAZE[0].length;
const MAZE_H   = TILE_SIZE * MAZE.length;
const FOOTER_H = 40;

// Brick palette for the wall tiles
const BRICK = {
  mortar: [38,  20, 12], // dark grout between bricks
  face:   [184, 92, 54], // classic Mario brick orange-brown
};

// ------------------------------------------------------------
// PLAYER
// x and y track the centre position on the canvas.
// hw and hh are the half-dimensions of the collision box —
// smaller than the sprite for a tighter feel.
// ------------------------------------------------------------
let player = {
  x: 0,
  y: 0,
  speed: 2,

  // Animation state
  currentFrame: 0,
  frameTimer:   0,
  direction:    "down",
  isMoving:     false,

  // Collision box half-dimensions
  // Sized to wrap Mario's body (including his lower half) so he can't
  // overlap walls, while staying small enough to clear the corridors.
  hw: 16, // half width
  hh: 17, // half height
};

// ------------------------------------------------------------
// COINS
// Built from the maze data in setup() — any tile marked 3
// becomes a coin object with its own position and frame counter.
// ------------------------------------------------------------
let coins = [];
let coinsCollected = 0;

// ------------------------------------------------------------
// GAME STATE
// ------------------------------------------------------------
let gameWon = false;

// Images
let characterSheet;
let goombaSheet;
let winBackground;
let starBackground;

// ============================================================
// preload()
// Runs once before setup(). Loads both sprite sheets so they
// are ready before the sketch tries to use them.
// ============================================================
function preload() {
  characterSheet = loadImage("assets/images/mario sprites.png");
  goombaSheet    = loadImage("assets/images/goomba sprites.png");
  winBackground  = loadImage("assets/images/super mario background.jpg");
  starBackground = loadImage("assets/images/super mario star.png");
}

// ============================================================
// setup()
// Runs once at the very start of the sketch.
// Canvas size is calculated from the maze dimensions so it
// always fits exactly. Loops through the maze to find the
// start tile and all coin tiles.
// ============================================================
function setup() {
  // Size the canvas to fit the maze, plus a footer strip for instructions
  createCanvas(MAZE_W, MAZE_H + FOOTER_H);
  imageMode(CENTER);

  // Scan the maze array to find the start position and coin locations
  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      let tile = MAZE[row][col];

      if (tile === 2) {
        // Place the player in the centre of the start tile
        player.x = col * TILE_SIZE + TILE_SIZE / 2;
        player.y = row * TILE_SIZE + TILE_SIZE / 2;
      }

      if (tile === 3) {
        // Create a coin object for each coin tile
        // Random start frame so coins don't all spin in sync
        coins.push({
          x:          col * TILE_SIZE + TILE_SIZE / 2,
          y:          row * TILE_SIZE + TILE_SIZE / 2,
          frame:      floor(random(GOOMBA.numFrames)),
          frameTimer: 0,
          collected:  false,
        });
      }
    }
  }
}

// ============================================================
// draw()
// Runs repeatedly in a loop after setup() finishes.
// Order matters — maze is drawn first so everything else
// appears on top of it.
// ============================================================
function draw() {
  background(0);

  // Starry-night sky behind the maze. Floor tiles are left unpainted
  // so the stars show through the corridors.
  image(starBackground, MAZE_W / 2, MAZE_H / 2, MAZE_W, MAZE_H);

  drawMaze();
  updateCoins();
  drawCoins();
  handleInput();
  resolveWallCollisions();
  checkCoinCollection();
  checkExit();
  animateSprite();
  drawCharacter();
  drawHUD();
  drawInstructions();

  // Win screen is drawn last so it appears on top of everything
  if (gameWon) {
    drawWinScreen();
  }
}

// ------------------------------------------------------------
// drawMaze()
// Loops through every tile in the maze array.
//   - Wall tiles (1) are drawn as brick blocks.
//   - The exit tile (4) is a coloured marker (green when open).
//   - Floor / start / collectible tiles are left unpainted so the
//     starry background shows through.
// rectMode(CORNER) means x, y is the top-left of each tile.
// ------------------------------------------------------------
function drawMaze() {
  rectMode(CORNER);
  noStroke();

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      let tile = MAZE[row][col];
      let x = col * TILE_SIZE;
      let y = row * TILE_SIZE;

      if (tile === 1) {
        // Wall — drawn as bricks
        drawBrickTile(x, y, TILE_SIZE);
      } else if (tile === 4) {
        // Exit tile changes colour when all collectibles are gathered
        if (coinsCollected === coins.length) {
          fill(40, 220, 130); // bright green — exit is open
        } else {
          fill(50, 80, 70, 200); // dim green — exit is locked
        }
        rect(x, y, TILE_SIZE, TILE_SIZE);
      }
      // tiles 0, 2, 3 are floor — leave them transparent (stars show)
    }
  }
}

// ------------------------------------------------------------
// drawBrickTile()
// Paints a single wall tile as a brick block: a mortar-coloured
// base, then rows of brick faces laid in a running-bond pattern
// (each row offset by half a brick). The drawing is clipped to the
// tile so offset bricks never spill onto neighbouring floor tiles.
// ------------------------------------------------------------
function drawBrickTile(x, y, s) {
  noStroke();

  // Mortar / grout base
  fill(BRICK.mortar[0], BRICK.mortar[1], BRICK.mortar[2]);
  rect(x, y, s, s);

  // Clip everything that follows to this tile's bounds
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(x, y, s, s);
  drawingContext.clip();

  fill(BRICK.face[0], BRICK.face[1], BRICK.face[2]);
  const bw  = s / 2; // brick is half a tile wide
  const bh  = s / 3; // three brick rows per tile
  const gap = 3;     // mortar thickness

  for (let r = 0; r < 3; r++) {
    let by  = y + r * bh;
    let off = (r % 2 === 0) ? 0 : -bw / 2; // stagger alternate rows
    for (let bx = x + off; bx < x + s; bx += bw) {
      rect(bx + gap / 2, by + gap / 2, bw - gap, bh - gap, 1);
    }
  }

  drawingContext.restore();
}

// ------------------------------------------------------------
// updateCoins()
// Loops through every coin and advances its animation frame.
// Skips coins that have already been collected.
// Each coin has its own frameTimer so they animate independently.
// ------------------------------------------------------------
function updateCoins() {
  for (let i = 0; i < coins.length; i++) {
    if (coins[i].collected) continue; // skip collected coins

    coins[i].frameTimer++;
    if (coins[i].frameTimer >= GOOMBA.animSpeed) {
      coins[i].frameTimer = 0;
      coins[i].frame = (coins[i].frame + 1) % GOOMBA.numFrames;
    }
  }
}

// ------------------------------------------------------------
// drawCoins()
// Loops through every coin and draws it at its current frame.
// Skips coins that have already been collected.
// ------------------------------------------------------------
function drawCoins() {
  for (let i = 0; i < coins.length; i++) {
    if (coins[i].collected) continue; // skip collected coins

    let coin = coins[i];

    // Source x position on the sprite sheet
    // We animate across the top row of Goombas so sy is always 0
    let sx = coin.frame * GOOMBA.frameWidth;
    let dw = GOOMBA.frameWidth  * GOOMBA.scale;
    let dh = GOOMBA.frameHeight * GOOMBA.scale;

    image(goombaSheet, coin.x, coin.y, dw, dh, sx, 0, GOOMBA.frameWidth, GOOMBA.frameHeight);
  }
}

// ------------------------------------------------------------
// handleInput()
// Moves the player and sets the correct facing direction.
// Each direction is checked independently so diagonal
// movement works naturally — holding W and D moves up-right.
// Returns early if the game is already won.
// ------------------------------------------------------------
function handleInput() {
  if (gameWon) return;

  player.isMoving = false;

  if (keyIsDown(87)) { // W — up
    player.y -= player.speed;
    player.direction = "up";
    player.isMoving = true;
  }
  if (keyIsDown(83)) { // S — down
    player.y += player.speed;
    player.direction = "down";
    player.isMoving = true;
  }
  if (keyIsDown(65)) { // A — left
    player.x -= player.speed;
    player.direction = "left";
    player.isMoving = true;
  }
  if (keyIsDown(68)) { // D — right
    player.x += player.speed;
    player.direction = "right";
    player.isMoving = true;
  }
}

// ------------------------------------------------------------
// resolveWallCollisions()
// Checks all four corners of the player's collision box
// against the maze tile at each corner's position.
// If a corner is inside a wall tile, the player is pushed
// out from the smallest overlapping direction.
//
// This approach handles diagonal wall contacts correctly
// and prevents the player from getting stuck on corners.
// ------------------------------------------------------------
function resolveWallCollisions() {
  // The four corners of the player's collision box
  let corners = [
    { x: player.x - player.hw, y: player.y - player.hh }, // top left
    { x: player.x + player.hw, y: player.y - player.hh }, // top right
    { x: player.x - player.hw, y: player.y + player.hh }, // bottom left
    { x: player.x + player.hw, y: player.y + player.hh }, // bottom right
  ];

  for (let i = 0; i < corners.length; i++) {
    let c = corners[i];

    // Convert pixel position to tile coordinates
    let col = floor(c.x / TILE_SIZE);
    let row = floor(c.y / TILE_SIZE);

    // Skip if outside the maze array bounds
    if (row < 0 || row >= MAZE.length || col < 0 || col >= MAZE[0].length) continue;

    if (MAZE[row][col] === 1) {
      // Calculate how far the player is overlapping each side of the wall tile
      let tileLeft   = col * TILE_SIZE;
      let tileRight  = tileLeft + TILE_SIZE;
      let tileTop    = row * TILE_SIZE;
      let tileBottom = tileTop + TILE_SIZE;

      let overlapLeft   = (player.x + player.hw) - tileLeft;
      let overlapRight  = tileRight  - (player.x - player.hw);
      let overlapTop    = (player.y + player.hh) - tileTop;
      let overlapBottom = tileBottom - (player.y - player.hh);

      // Push the player out from the side with the smallest overlap
      let minOverlap = min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if      (minOverlap === overlapLeft)   player.x -= overlapLeft;
      else if (minOverlap === overlapRight)  player.x += overlapRight;
      else if (minOverlap === overlapTop)    player.y -= overlapTop;
      else if (minOverlap === overlapBottom) player.y += overlapBottom;
    }
  }
}

// ------------------------------------------------------------
// checkCoinCollection()
// Uses dist() to check if the player is close enough to
// collect each coin. A threshold of 60% of TILE_SIZE feels
// natural — not too generous, not too strict.
// ------------------------------------------------------------
function checkCoinCollection() {
  for (let i = 0; i < coins.length; i++) {
    if (coins[i].collected) continue;

    // dist() returns the distance between two points
    let d = dist(player.x, player.y, coins[i].x, coins[i].y);
    if (d < TILE_SIZE * 0.6) {
      coins[i].collected = true;
      coinsCollected++;
    }
  }
}

// ------------------------------------------------------------
// checkExit()
// Only active once all coins are collected.
// Scans the maze for the exit tile (4) and checks whether
// the player is close enough to trigger a win.
// ------------------------------------------------------------
function checkExit() {
  if (coinsCollected < coins.length) return; // exit is still locked

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      if (MAZE[row][col] === 4) {
        let exitX = col * TILE_SIZE + TILE_SIZE / 2;
        let exitY = row * TILE_SIZE + TILE_SIZE / 2;
        if (dist(player.x, player.y, exitX, exitY) < TILE_SIZE * 0.6) {
          gameWon = true;
        }
      }
    }
  }
}

// ------------------------------------------------------------
// animateSprite()
// Advances the animation frame at a controlled speed.
// frameTimer counts up every draw() call.
// When it reaches animSpeed, the frame advances.
// Only animates when the player is moving — stays on frame 0
// when idle so the character stands still.
// ------------------------------------------------------------
function animateSprite() {
  if (player.isMoving) {
    player.frameTimer++;

    // When the timer reaches animSpeed, advance to the next frame
    // % numFrames wraps back to 0 after the last frame
    if (player.frameTimer >= SPRITE.animSpeed) {
      player.frameTimer = 0;
      player.currentFrame = (player.currentFrame + 1) % SPRITE.numFrames;
    }
  } else {
    // Reset to standing frame when not moving
    player.currentFrame = 0;
    player.frameTimer   = 0;
  }
}

// ------------------------------------------------------------
// drawCharacter()
// Draws one frame from the Mario sheet using image() with
// source rectangle parameters.
//
// image(img, dx, dy, dw, dh, sx, sy, sw, sh)
//   dx, dy — where to draw on the canvas (destination centre)
//   dw, dh — how large to draw it (destination size)
//   sx, sy — where to start reading from the sprite sheet
//   sw, sh — how many pixels to read from the sheet
//
// Mario's frames all face right, so we read from a single row
// (SPRITE.row) and flip the sprite horizontally when the player
// is walking left. sx slides along the row by frame number.
// ------------------------------------------------------------
function drawCharacter() {
  // Source position on the sprite sheet
  let sx = player.currentFrame * SPRITE.frameWidth;
  let sy = SPRITE.row          * SPRITE.frameHeight;

  // Draw size (original frame size multiplied by scale)
  let dw = SPRITE.frameWidth  * SPRITE.scale;
  let dh = SPRITE.frameHeight * SPRITE.scale;

  if (player.direction === "left") {
    // Flip horizontally so Mario faces the way he is moving.
    // Translate to the player, mirror the x-axis, then draw at
    // the origin (imageMode(CENTER) keeps it centred). The vertical
    // offset is unaffected by the horizontal flip.
    push();
    translate(player.x, player.y);
    scale(-1, 1);
    image(characterSheet, 0, SPRITE.drawOffsetY, dw, dh, sx, sy, SPRITE.frameWidth, SPRITE.frameHeight);
    pop();
  } else {
    image(characterSheet, player.x, player.y + SPRITE.drawOffsetY, dw, dh, sx, sy, SPRITE.frameWidth, SPRITE.frameHeight);
  }
}

// ------------------------------------------------------------
// drawHUD()
// HUD = Heads Up Display.
// A Mario-styled panel at the top-left showing the Goomba count
// and exit status.
// ------------------------------------------------------------
function drawHUD() {
  let allCollected = coinsCollected === coins.length;

  textFont("monospace");
  textStyle(BOLD);
  textAlign(LEFT, CENTER);

  // The two possible lines of text
  let line1 = "GOOMBAS  " + coinsCollected + " / " + coins.length;
  let line2 = "Exit open! Reach the bright tile.";

  // Measure the lines so the panel can be sized to fit them.
  // Each line is measured at the size it will actually be drawn.
  textSize(16);
  let w1 = textWidth(line1);
  textSize(13);
  let w2 = allCollected ? textWidth(line2) : 0;

  let padX    = 12;
  let panelX  = 8;
  let panelY  = 8;
  let panelW  = max(w1, w2) + padX * 2;
  let panelH  = allCollected ? 56 : 34;

  // Panel background — semi-transparent dark green with a red border
  rectMode(CORNER);
  noStroke();
  fill(8, 24, 14, 210);
  rect(panelX, panelY, panelW, panelH, 6);
  noFill();
  stroke(220, 40, 40);   // Mario red border
  strokeWeight(2);
  rect(panelX, panelY, panelW, panelH, 6);

  // Goomba counter
  noStroke();
  fill(255, 220, 60);    // coin-gold text
  textSize(16);
  text(line1, panelX + padX, panelY + 18);

  // Show exit hint once all Goombas are collected
  if (allCollected) {
    fill(120, 255, 150);
    textSize(13);
    text(line2, panelX + padX, panelY + 42);
  }
  textStyle(NORMAL);
}

// ------------------------------------------------------------
// drawInstructions()
// Draws the controls / objective along the footer strip beneath
// the maze so the player always knows how to play.
// ------------------------------------------------------------
function drawInstructions() {
  rectMode(CORNER);

  // Footer bar background with a red top edge to match the HUD
  noStroke();
  fill(18, 12, 36, 235);
  rect(0, MAZE_H, MAZE_W, FOOTER_H);
  stroke(220, 40, 40);
  strokeWeight(2);
  line(0, MAZE_H + 1, MAZE_W, MAZE_H + 1);

  // Instruction text
  noStroke();
  fill(255);
  textFont("monospace");
  textStyle(BOLD);
  textSize(13);
  textAlign(CENTER, CENTER);
  text(
    "WASD to move   •   Collect all 3 Goombas   •   Reach the exit tile to win",
    MAZE_W / 2,
    MAZE_H + FOOTER_H / 2
  );
  textStyle(NORMAL);
}

// ------------------------------------------------------------
// drawWinScreen()
// Draws a semi-transparent overlay and win message on top
// of everything else. Called last in draw() so it appears
// in front of the maze, character, and HUD.
// ------------------------------------------------------------
function drawWinScreen() {
  // Super Mario background art fills the whole canvas.
  // imageMode is CENTER (set in setup), so draw it at the centre.
  image(winBackground, width / 2, height / 2, width, height);

  // Slight dark overlay so the text stays readable over the art
  rectMode(CORNER);
  noStroke();
  fill(0, 0, 0, 110);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  textFont("monospace");
  textStyle(BOLD);

  // Title with a drop shadow for a classic arcade feel
  textSize(54);
  fill(0, 0, 0, 180);
  text("LEVEL CLEAR!", width / 2 + 3, height / 2 - 27);
  fill(255, 80, 60); // Mario red
  text("LEVEL CLEAR!", width / 2, height / 2 - 30);

  // Subtitle
  textSize(18);
  fill(255, 220, 60); // coin-gold
  text("All " + coins.length + " Goombas collected", width / 2, height / 2 + 20);

  textSize(13);
  fill(180, 230, 190);
  text("Refresh the page to play again", width / 2, height / 2 + 50);

  textStyle(NORMAL);
}
