let grid;
let stepSize = 1;
let paused = true; // start paused
let res = 5;
let pauseButton, clearButton;
let eraseButton;
let eraseMode = false;
let sliderScaleX, sliderScaleY, sliderCutoff;

class Grid {
  constructor(_res) {
    this.res = _res;
    this.w = Math.floor(width / this.res);
    this.h = Math.floor(height / this.res);
    this.cells = Array.from({ length: this.w }, () => Array(this.h).fill(false));
  }

  clear() {
    this.cells = Array.from({ length: this.w }, () => Array(this.h).fill(false));
  }

  randomize(scaleX = 0.08, scaleY = 0.08, cutoff = 0.5) {
    // use Perlin noise for natural clumping and voids
    for (let i = 0; i < this.w; i++) {
      for (let j = 0; j < this.h; j++) {
        const noiseVal = noise(i * scaleX, j * scaleY);
        this.cells[i][j] = noiseVal < cutoff;
      }
    }
  }

  createParticle(x, y) {
    const i = Math.floor(x / this.res);
    const j = Math.floor(y / this.res);
    if (i >= 0 && i < this.w && j >= 0 && j < this.h) this.cells[i][j] = true;
  }

  removeParticle(x, y) {
    const i = Math.floor(x / this.res);
    const j = Math.floor(y / this.res);
    if (i >= 0 && i < this.w && j >= 0 && j < this.h) this.cells[i][j] = false;
  }

  update(step) {
    const newCells = Array.from({ length: this.w }, () => Array(this.h).fill(false));
    // ground
    for (let i = 0; i < this.w; i++) {
      newCells[i][this.h - 1] = true;
    }
    for (let j = 0; j < this.h - 1; j++) {
      for (let i = 0; i < this.w; i++) {
        if (this.cells[i][j]) {
          // if space below is free, fall straight down
          if (!this.cells[i][j + 1]) {
            newCells[i][j + 1] = true;
          } else {
            // try down-left / down-right if available
            const leftAvailable = i > 0 && !this.cells[i - 1][j + 1];
            const rightAvailable = i < this.w - 1 && !this.cells[i + 1][j + 1];

            if (leftAvailable && rightAvailable) {
              if (Math.random() < 0.5) newCells[i - 1][j + 1] = true;
              else newCells[i + 1][j + 1] = true;
            } else if (leftAvailable) {
              newCells[i - 1][j + 1] = true;
            } else if (rightAvailable) {
              newCells[i + 1][j + 1] = true;
            } else {
              // nowhere to go, stay
              newCells[i][j] = true;
            }
          }
        }
      }
    }

    this.cells = newCells;
  }

  draw() {
    // compute pressure per column as we sweep top->bottom
    const colCounts = Array(this.w).fill(0);
    strokeWeight(this.res);

    for (let j = 0; j < this.h; j++) {
      for (let i = 0; i < this.w; i++) {
        if (this.cells[i][j]) {
          const pressure = colCounts[i]; // number of particles above
          const pNorm = this.h > 1 ? pressure / (this.h - 1) : 0;
          // HSL: keep saturation and lightness fixed, vary hue in discrete layers (avoid red)
          const layers = 12; // number of colored layers
          const layer = Math.min(layers - 1, Math.floor(pNorm * layers));
          const hueStep = 300 / layers; // span 50-350 to avoid red (0-15)
          const jitter = ((i * 97 + j * 131) % 9) - 4; // small deterministic jitter
          const baseHue = 50; // start at yellow-green, avoid red
          const h = Math.round(baseHue + layer * hueStep + jitter); // no wrap, stays in 50-350 range
          const s = 84; // fixed saturation for aesthetic
          const l = 64; // brighter lightness for dark background
          stroke(`hsl(${h}, ${s}%, ${l}%)`);
          point(i * this.res, j * this.res);
          colCounts[i]++;
        }
      }
    }
  }
}

function setup() {
  createCanvas(720, 720);
  pixelDensity(1);
  grid = new Grid(res);
  // mobile-friendly controls
  pauseButton = createButton('Pause');
  pauseButton.mousePressed(() => {
    paused = !paused;
    pauseButton.html(paused ? 'Resume' : 'Pause');
  });
  pauseButton.style('font-size', '16px');
  pauseButton.style('padding', '8px 12px');
  pauseButton.position(10, 10);

  clearButton = createButton('Clear');
  clearButton.mousePressed(() => grid.clear());
  clearButton.style('font-size', '16px');
  clearButton.style('padding', '8px 12px');
  clearButton.position(100, 10);
  clearButton.style('color', '#fff');
  clearButton.style('background-color', '#444');
  // erase toggle for mobile/desktop
  eraseButton = createButton('Erase: Off');
  eraseButton.mousePressed(() => {
    eraseMode = !eraseMode;
    eraseButton.html(eraseMode ? 'Erase: On' : 'Erase: Off');
  });
  eraseButton.style('font-size', '16px');
  eraseButton.style('padding', '8px 12px');
  eraseButton.position(190, 10);
  eraseButton.style('color', '#fff');
  eraseButton.style('background-color', '#444');

  // randomize button
  const randomButton = createButton('Randomize');
  randomButton.mousePressed(() => {
    grid.randomize(sliderScaleX.value(), sliderScaleY.value(), sliderCutoff.value());
  });
  randomButton.style('font-size', '16px');
  randomButton.style('padding', '8px 12px');
  randomButton.position(280, 10);
  randomButton.style('color', '#fff');
  randomButton.style('background-color', '#444');

  // style pause button for dark background
  pauseButton.style('color', '#fff');
  pauseButton.style('background-color', '#444');
  pauseButton.html('Resume'); // reflect initial paused state

  // sliders for noise parameters
  createDiv('Noise Scale X:').position(10, 50).style('color', '#fff').style('font-size', '12px');
  sliderScaleX = createSlider(0.01, 0.2, 0.08, 0.01);
  sliderScaleX.position(150, 52).style('width', '150px');

  createDiv('Noise Scale Y:').position(10, 85).style('color', '#fff').style('font-size', '12px');
  sliderScaleY = createSlider(0.01, 0.2, 0.08, 0.01);
  sliderScaleY.position(150, 87).style('width', '150px');

  createDiv('Spawn Cutoff:').position(10, 120).style('color', '#fff').style('font-size', '12px');
  sliderCutoff = createSlider(0, 1, 0.5, 0.01);
  sliderCutoff.position(150, 122).style('width', '150px');

  // initialize with current slider values
  grid.randomize(sliderScaleX.value(), sliderScaleY.value(), sliderCutoff.value());
}

function draw() {
  // dark background for contrast
  background(18);
  const dT = deltaTime / 1000;
  const step = paused ? 0 : stepSize * dT;

  if (mouseIsPressed) {
    if (eraseMode) grid.removeParticle(mouseX, mouseY);
    else grid.createParticle(mouseX, mouseY);
  }

  if (!paused) {
    grid.update(step);
  }
  // always render so pause still displays contents
  grid.draw();
}

function keyPressed() {
  if (key === ' ') {
    paused = !paused;
    if (pauseButton) pauseButton.html(paused ? 'Resume' : 'Pause');
  }
}

function touchStarted() {
  // touchX/touchY may not be defined in some contexts; fall back to touches[] or mouseX
  let tx = (typeof touchX !== 'undefined') ? touchX : (touches && touches.length ? touches[0].x : mouseX);
  let ty = (typeof touchY !== 'undefined') ? touchY : (touches && touches.length ? touches[0].y : mouseY);
  if (eraseMode) grid.removeParticle(tx, ty);
  else grid.createParticle(tx, ty);
  return false;
}

function touchMoved() {
  let tx = (typeof touchX !== 'undefined') ? touchX : (touches && touches.length ? touches[0].x : mouseX);
  let ty = (typeof touchY !== 'undefined') ? touchY : (touches && touches.length ? touches[0].y : mouseY);
  if (eraseMode) grid.removeParticle(tx, ty);
  else grid.createParticle(tx, ty);
  return false;
}
