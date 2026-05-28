import React from 'https://esm.sh/react@18.3.1';
import SandSimControls from './SandSimControls.js';

export default function SandSim({ gridState } = {}) {
  const { useEffect, useRef, useState } = React;
  const containerRef = useRef(null);
  const p5Ref = useRef(null);
  const gridRef = useRef(null);

  const pausedRef = useRef(true);
  const eraseRef = useRef(false);
  const userInteractedRef = useRef(false);

  const [paused, setPaused] = useState(!!gridState);
  const [eraseMode, setEraseMode] = useState(false);
  const [gridCols, setGridCols] = useState(0);
  const [gridRows, setGridRows] = useState(0);
  const [threshold, setThreshold] = useState(128);
  const [invertImage, setInvertImage] = useState(false);
  const [edgeDetect, setEdgeDetect] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [uploadedImageSrc, setUploadedImageSrc] = useState('');
  const [imageProcessingError, setImageProcessingError] = useState('');
  const seedRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  const res = 4;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    eraseRef.current = eraseMode;
  }, [eraseMode]);

  useEffect(() => {
    let mounted = true;

    const createSize = () => {
      const isMobile = window.innerWidth < 768;
      const margin = isMobile ? 12 : 32;
      const controlAreaHeight = isMobile ? 180 : 120;
      const availableHeight = window.innerHeight - controlAreaHeight;
      const maxSize = isMobile ? Math.min(400, availableHeight) : Math.min(600, availableHeight);
      const side = Math.max(150, Math.min(maxSize, Math.floor(window.innerWidth - margin)));
      return { w: side, h: side };
    };

    const attachTouchHandlers = (canvas) => {
      const handleTouch = (event) => {
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches && event.touches[0];
        if (!touch || !gridRef.current) return;

        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

        event.preventDefault();
        userInteractedRef.current = true;

        if (eraseRef.current) {
          gridRef.current.removeParticle(x, y);
        } else {
          gridRef.current.createParticle(x, y);
        }
      };

      const handleContextMenu = (event) => event.preventDefault();

      canvas.addEventListener('touchstart', handleTouch, { passive: false });
      canvas.addEventListener('touchmove', handleTouch, { passive: false });
      canvas.addEventListener('contextmenu', handleContextMenu);

      return () => {
        canvas.removeEventListener('touchstart', handleTouch);
        canvas.removeEventListener('touchmove', handleTouch);
        canvas.removeEventListener('contextmenu', handleContextMenu);
      };
    };

    const initP5 = async () => {
      const P5mod = await import('https://esm.sh/p5@1.6.0');
      const P5 = P5mod && P5mod.default ? P5mod.default : P5mod;

      class Grid {
        constructor(_res, pInstance) {
          this.res = _res;
          this.p = pInstance;
          this.w = Math.floor(this.p.width / this.res);
          this.h = Math.floor(this.p.height / this.res);
          this.cells = Array.from({ length: this.w }, () => Array(this.h).fill(false));
          this.cellColors = null;
        }

        clear() {
          this.cells = Array.from({ length: this.w }, () => Array(this.h).fill(false));
          this.cellColors = null;
        }

        randomize(seed = null, scaleX = 0.08, scaleY = 0.08, cutoff = 0.5) {
          this.cellColors = null;
          const seedValue = seed ?? Math.floor(Math.random() * 1000000);
          this.p.noiseSeed(seedValue);
          for (let i = 0; i < this.w; i++) {
            for (let j = 0; j < this.h; j++) {
              const noiseVal = this.p.noise(i * scaleX, j * scaleY);
              this.cells[i][j] = noiseVal < cutoff;
            }
          }
          return seedValue;
        }

        loadState(state, colors = null) {
          if (!Array.isArray(state) || state.length === 0) return;
          this.cellColors = null;
          if (Array.isArray(colors) && colors.length) {
            this.cellColors = Array.from({ length: this.w }, () => Array(this.h).fill(null));
          }
          for (let j = 0; j < Math.min(state.length, this.h); j++) {
            if (!Array.isArray(state[j])) continue;
            for (let i = 0; i < Math.min(state[j].length, this.w); i++) {
              const value = state[j][i];
              this.cells[i][j] = value === 1 || value === '1' || value === true;
              if (this.cellColors && Array.isArray(colors[j]) && colors[j][i]) {
                this.cellColors[i][j] = colors[j][i];
              }
            }
          }
        }

        getState() {
          return Array.from({ length: this.h }, (_, j) =>
            Array.from({ length: this.w }, (_, i) => (this.cells[i][j] ? 1 : 0))
          );
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

        update() {
          const newCells = Array.from({ length: this.w }, () => Array(this.h).fill(false));
          const newColors = this.cellColors
            ? Array.from({ length: this.w }, () => Array(this.h).fill(null))
            : null;

          const setParticle = (x, y, color) => {
            newCells[x][y] = true;
            if (newColors) newColors[x][y] = color;
          };

          for (let i = 0; i < this.w; i++) {
            setParticle(i, this.h - 1, this.cellColors ? this.cellColors[i][this.h - 1] : null);
          }

          const falling = Array.from({ length: this.w }, () => Array(this.h).fill(false));
          const groundConnected = Array.from({ length: this.w }, () => Array(this.h).fill(false));
          const lowestMovable = Array(this.w).fill(-1);

          const hasSupportBelow = (i, j) => j + 1 === this.h - 1 || this.cells[i][j + 1];

          for (let j = this.h - 1; j >= 0; j--) {
            for (let i = 0; i < this.w; i++) {
              if (!this.cells[i][j]) continue;
              if (j === this.h - 1) {
                falling[i][j] = false;
              } else {
                const support = hasSupportBelow(i, j);
                falling[i][j] = !support || falling[i][j + 1];
              }
            }
          }

          for (let j = this.h - 2; j >= 0; j--) {
            for (let i = 0; i < this.w; i++) {
              if (!this.cells[i][j]) continue;
              const support = hasSupportBelow(i, j);
              groundConnected[i][j] = support && (j === this.h - 2 || groundConnected[i][j + 1]);
            }
          }

          for (let i = 0; i < this.w; i++) {
            for (let j = this.h - 2; j >= 0; j--) {
              if (!this.cells[i][j]) continue;
              const belowOccupied = hasSupportBelow(i, j);
              const belowIsFalling = belowOccupied && falling[i][j + 1];
              if (!belowOccupied || belowIsFalling) continue;
              const leftAvailable = i > 0 && !this.cells[i - 1][j + 1];
              const rightAvailable = i < this.w - 1 && !this.cells[i + 1][j + 1];
              if (leftAvailable || rightAvailable) {
                lowestMovable[i] = j;
                break;
              }
            }
          }

          for (let j = 0; j < this.h - 1; j++) {
            for (let i = 0; i < this.w; i++) {
              if (!this.cells[i][j]) continue;
              const belowOccupied = hasSupportBelow(i, j);
              const belowIsFalling = belowOccupied && falling[i][j + 1];
              const color = this.cellColors ? this.cellColors[i][j] : null;

              if (!belowOccupied || belowIsFalling) {
                setParticle(i, j + 1, color);
                continue;
              }

              const leftAvailable = i > 0 && !this.cells[i - 1][j + 1];
              const rightAvailable = i < this.w - 1 && !this.cells[i + 1][j + 1];

              if (j !== lowestMovable[i]) {
                setParticle(i, j, color);
                continue;
              }

              if (leftAvailable && rightAvailable) {
                if (Math.random() < 0.5) {
                  setParticle(i - 1, j + 1, color);
                } else {
                  setParticle(i + 1, j + 1, color);
                }
              } else if (leftAvailable) {
                setParticle(i - 1, j + 1, color);
              } else if (rightAvailable) {
                setParticle(i + 1, j + 1, color);
              } else {
                setParticle(i, j, color);
              }
            }
          }

          this.cells = newCells;
          if (newColors) this.cellColors = newColors;
        }

        draw() {
          const colCounts = Array(this.w).fill(0);
          this.p.strokeWeight(this.res);

          for (let j = 0; j < this.h; j++) {
            for (let i = 0; i < this.w; i++) {
              if (!this.cells[i][j]) continue;
              const pressure = colCounts[i];
              const pNorm = this.h > 1 ? pressure / (this.h - 1) : 0;
              if (this.cellColors && this.cellColors[i] && this.cellColors[i][j]) {
                this.p.stroke(this.cellColors[i][j]);
              } else {
                const layer = Math.min(11, Math.floor(pNorm * 12));
                const hue = Math.round(50 + layer * 25 + (((i * 97 + j * 131) % 9) - 4));
                this.p.stroke(`hsl(${hue}, 84%, 64%)`);
              }
              this.p.point(i * this.res, j * this.res);
              colCounts[i]++;
            }
          }
        }
      }

      const sketch = (p) => {
        let removeTouchHandlers = null;

        p.setup = () => {
          const size = createSize();
          p.createCanvas(size.w, size.h);
          p.pixelDensity(1);
          const canvas = p.canvas?.elt;
          if (canvas) removeTouchHandlers = attachTouchHandlers(canvas);
          gridRef.current = new Grid(res, p);
          setGridCols(gridRef.current.w);
          setGridRows(gridRef.current.h);
          if (gridState) {
            gridRef.current.loadState(gridState);
          } else {
            const initialSeed = gridRef.current.randomize();
            seedRef.current = initialSeed;
          }
        };

        p.draw = () => {
          p.background(18);

          if (p.mouseIsPressed) {
            userInteractedRef.current = true;
            if (p.mouseButton === p.RIGHT) {
              gridRef.current.removeParticle(p.mouseX, p.mouseY);
            } else if (eraseRef.current) {
              gridRef.current.removeParticle(p.mouseX, p.mouseY);
            } else {
              gridRef.current.createParticle(p.mouseX, p.mouseY);
            }
          }

          if (!userInteractedRef.current && !pausedRef.current && p.frameCount % 30 === 0) {
            const grid = gridRef.current;
            const centerX = Math.floor(Math.random() * grid.w);
            for (let k = 0; k < 10; k++) {
              for (let h = 0; h < 3; h++) {
                grid.createParticle((centerX + k - 5) * res + res / 2, res * 2 + h * res);
              }
            }
          }

          if (!pausedRef.current) gridRef.current.update();
          gridRef.current.draw();
        };

        p.windowResized = () => {
          const size = createSize();
          p.resizeCanvas(size.w, size.h);
          if (gridRef.current) {
            gridRef.current = new Grid(res, p);
            const resizeSeed = seedRef.current;
            const actualSeed = gridRef.current.randomize(resizeSeed);
            seedRef.current = actualSeed;
          }
        };

        p.remove = () => {
          if (typeof removeTouchHandlers === 'function') removeTouchHandlers();
        };
      };

      if (!mounted) return;
      try {
        if (containerRef.current) p5Ref.current = new P5(sketch, containerRef.current);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('p5 init error', err);
      }
    };

    initP5();

    const onResize = () => {
      if (p5Ref.current && typeof p5Ref.current.resizeCanvas === 'function') {
        const size = createSize();
        p5Ref.current.resizeCanvas(size.w, size.h);
      }
    };

    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(onResize, 250);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      mounted = false;
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', onResize);
      if (p5Ref.current) {
        try {
          if (typeof p5Ref.current.remove === 'function') p5Ref.current.remove();
        } catch (e) {}
        p5Ref.current = null;
      }
    };
  }, []);


  const buildImageState = (img, cols, rows, options) => {
    const { threshold: thresholdValue, invertImage: invert, translateX: tx, translateY: ty } = options;
    const size = Math.min(img.width, img.height);
    const centerX = Math.floor(img.width / 2 + tx);
    const centerY = Math.floor(img.height / 2 + ty);
    const sx = Math.max(0, Math.min(img.width - size, centerX - Math.floor(size / 2)));
    const sy = Math.max(0, Math.min(img.height - size, centerY - Math.floor(size / 2)));
    const canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, cols, rows);
    ctx.drawImage(img, sx, sy, size, size, 0, 0, cols, rows);
    const data = ctx.getImageData(0, 0, cols, rows).data;
    const luminance = Array.from({ length: rows }, (_, j) =>
      Array.from({ length: cols }, (_, i) => {
        const idx = (j * cols + i) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        return a < 128 ? 0 : 0.299 * r + 0.587 * g + 0.114 * b;
      })
    );

    const state = Array.from({ length: rows }, (_, j) =>
      Array.from({ length: cols }, (_, i) => {
        const idx = (j * cols + i) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        if (edgeDetect) {
          const left = i > 0 ? luminance[j][i - 1] : luminance[j][i];
          const right = i < cols - 1 ? luminance[j][i + 1] : luminance[j][i];
          const top = j > 0 ? luminance[j - 1][i] : luminance[j][i];
          const bottom = j < rows - 1 ? luminance[j + 1][i] : luminance[j][i];
          const gx = right - left;
          const gy = bottom - top;
          const gradient = Math.sqrt(gx * gx + gy * gy);
          const edge = gradient >= thresholdValue;
          return edge ? 1 : 0;
        }
        const filled = a < 128 || luminance[j][i] < thresholdValue;
        return invert ? (filled ? 0 : 1) : (filled ? 1 : 0);
      })
    );

    const colors = Array.from({ length: rows }, (_, j) =>
      Array.from({ length: cols }, (_, i) => {
        const idx = (j * cols + i) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
      })
    );
    return { state, colors };
  };

  const processImageSource = (src, options = {}) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const cols = gridCols || gridRef.current?.w || 32;
        const rows = gridRows || gridRef.current?.h || 32;
        try {
          resolve(buildImageState(img, cols, rows, options));
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Could not load image file'));
      img.src = src;
    });

  const applyImageSource = async (src, options = {}) => {
    if (!src) return;
    setImageProcessingError('');
    const { state, colors } = await processImageSource(src, {
      threshold,
      invertImage,
      edgeDetect,
      translateX,
      translateY,
      ...options
    });
    if (gridRef.current) {
      gridRef.current.clear();
      gridRef.current.loadState(state, colors);
    }
    setGridCols(state[0]?.length || gridCols);
    setGridRows(state.length || gridRows);
    setPaused(true);
  };

  const handleImageUpload = async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const src = reader.result;
      setUploadedImageSrc(src);
      try {
        await applyImageSource(src);
      } catch (err) {
        setImageProcessingError(err?.message || 'Failed to import image');
      }
    };
    reader.onerror = () => {
      setImageProcessingError('Error reading image file');
    };
    reader.readAsDataURL(file);
    if (event.target) event.target.value = '';
  };

  const randomizeGrid = (seed = null) => {
    if (!gridRef.current) return;
    const actualSeed = gridRef.current.randomize(seed);
    seedRef.current = actualSeed;
    setPaused(true);
  };

  useEffect(() => {
    if (!uploadedImageSrc) return;
    refreshImagePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgeDetect, invertImage]);

  const refreshImagePreview = async (nextSettings = {}) => {
    if (!uploadedImageSrc) return;
    try {
      await applyImageSource(uploadedImageSrc, nextSettings);
    } catch (err) {
      setImageProcessingError(err?.message || 'Failed to update image preview');
    }
  };

  const handleClear = () => {
    userInteractedRef.current = true;
    if (gridRef.current) gridRef.current.clear();
  };

  const handleRandomize = () => {
    userInteractedRef.current = true;
    randomizeGrid();
  };

  const togglePause = () => {
    userInteractedRef.current = true;
    setPaused((current) => !current);
  };

  const toggleErase = () => {
    userInteractedRef.current = true;
    setEraseMode((current) => !current);
  };

  return React.createElement(
    'main',
    { className: 'app-shell sandsim-shell' },
    React.createElement(
      'div',
      { className: 'sandsim-header' },
      React.createElement('h2', { className: 'sandsim-title' }, 'SandSim'),
      React.createElement('button', { className: 'btn btn-secondary', onClick: () => (window.location.hash = '#') }, 'Back')
    ),
    React.createElement(
      'div',
      { className: 'sandsim-container' },
      React.createElement('div', { className: 'sandsim-canvas-wrap', ref: containerRef }),
      React.createElement(
        'div',
        { className: 'sandsim-state-editor' },
        React.createElement('div', { className: 'image-import-panel' },
          React.createElement('label', { className: 'image-import-label', htmlFor: 'image-file-input' }, 'Use Image'),
          React.createElement('input', {
            id: 'image-file-input',
            ref: fileInputRef,
            className: 'image-file-input',
            type: 'file',
            accept: 'image/*',
            onChange: handleImageUpload
          })
        ),
        React.createElement('label', { className: 'seed-input-label', htmlFor: 'threshold-input' }, `Threshold: ${threshold}`),
        React.createElement('input', {
          id: 'threshold-input',
          className: 'slider-input',
          type: 'range',
          min: 0,
          max: 255,
          value: threshold,
          onChange: (e) => {
            const value = parseInt(e.target.value, 10);
            setThreshold(value);
            refreshImagePreview({ threshold: value });
          }
        }),
        React.createElement('div', { className: 'toggle-row' },
          React.createElement('button', {
            type: 'button',
            className: `toggle-button ${edgeDetect ? 'active' : ''}`,
            onClick: () => {
              const value = !edgeDetect;
              setEdgeDetect(value);
              refreshImagePreview({ edgeDetect: value });
            }
          }, 'Edge Detect')
        ),
        React.createElement('label', { className: 'seed-input-label', htmlFor: 'translate-y-input' }, `Translate Y: ${translateY}`),
        React.createElement('input', {
          id: 'translate-y-input',
          className: 'slider-input',
          type: 'range',
          min: -Math.max(16, Math.floor(gridRows / 2)),
          max: Math.max(16, Math.floor(gridRows / 2)),
          value: translateY,
          onChange: (e) => {
            const value = parseInt(e.target.value, 10);
            setTranslateY(value);
            refreshImagePreview({ translateY: value });
          }
        }),
        imageProcessingError && React.createElement('div', { className: 'image-error-text' }, imageProcessingError)
      )
    ),
    React.createElement(SandSimControls, {
      paused,
      eraseMode,
      onTogglePause: togglePause,
      onClear: handleClear,
      onToggleErase: toggleErase,
      onRandomize: handleRandomize,
      onBack: () => (window.location.hash = '#')
    })
  );
}

