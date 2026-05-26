import React from 'https://esm.sh/react@18.3.1';
import SandSimControls from './SandSimControls.js';

export default function SandSim() {
  const { useEffect, useRef, useState } = React;
  const containerRef = useRef(null);
  const p5Ref = useRef(null);
  const gridRef = useRef(null);

  const pausedRef = useRef(true);
  const eraseRef = useRef(false);
  const userInteractedRef = useRef(false);

  const [paused, setPaused] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);

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

      canvas.addEventListener('touchstart', handleTouch, { passive: false });
      canvas.addEventListener('touchmove', handleTouch, { passive: false });

      return () => {
        canvas.removeEventListener('touchstart', handleTouch);
        canvas.removeEventListener('touchmove', handleTouch);
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
        }

        clear() {
          this.cells = Array.from({ length: this.w }, () => Array(this.h).fill(false));
        }

        randomize(scaleX = 0.08, scaleY = 0.08, cutoff = 0.5) {
          for (let i = 0; i < this.w; i++) {
            for (let j = 0; j < this.h; j++) {
              const noiseVal = this.p.noise(i * scaleX, j * scaleY);
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

        update() {
          const newCells = Array.from({ length: this.w }, () => Array(this.h).fill(false));
          for (let i = 0; i < this.w; i++) {
            newCells[i][this.h - 1] = true;
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

              if (!belowOccupied || belowIsFalling) {
                newCells[i][j + 1] = true;
                continue;
              }

              const leftAvailable = i > 0 && !this.cells[i - 1][j + 1];
              const rightAvailable = i < this.w - 1 && !this.cells[i + 1][j + 1];

              if (j !== lowestMovable[i]) {
                newCells[i][j] = true;
                continue;
              }

              if (leftAvailable && rightAvailable) {
                if (Math.random() < 0.5) newCells[i - 1][j + 1] = true;
                else newCells[i + 1][j + 1] = true;
              } else if (leftAvailable) {
                newCells[i - 1][j + 1] = true;
              } else if (rightAvailable) {
                newCells[i + 1][j + 1] = true;
              } else {
                newCells[i][j] = true;
              }
            }
          }

          this.cells = newCells;
        }

        draw() {
          const colCounts = Array(this.w).fill(0);
          this.p.strokeWeight(this.res);

          for (let j = 0; j < this.h; j++) {
            for (let i = 0; i < this.w; i++) {
              if (!this.cells[i][j]) continue;
              const pressure = colCounts[i];
              const pNorm = this.h > 1 ? pressure / (this.h - 1) : 0;
              const layer = Math.min(11, Math.floor(pNorm * 12));
              const hue = Math.round(50 + layer * 25 + (((i * 97 + j * 131) % 9) - 4));
              this.p.stroke(`hsl(${hue}, 84%, 64%)`);
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
          gridRef.current.randomize();
        };

        p.draw = () => {
          p.background(18);

          if (p.mouseIsPressed) {
            userInteractedRef.current = true;
            if (eraseRef.current) gridRef.current.removeParticle(p.mouseX, p.mouseY);
            else gridRef.current.createParticle(p.mouseX, p.mouseY);
          }

          if (!userInteractedRef.current && !pausedRef.current && p.frameCount % 30 === 0) {
            const grid = gridRef.current;
            const centerX = Math.floor(Math.random() * grid.w);
            for (let k = 0; k < 4; k++) {
              grid.createParticle((centerX + k - 2) * res + res / 2, res * 2);
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
            gridRef.current.randomize();
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

  const handleClear = () => {
    userInteractedRef.current = true;
    if (gridRef.current) gridRef.current.clear();
  };

  const handleRandomize = () => {
    userInteractedRef.current = true;
    if (gridRef.current) gridRef.current.randomize();
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
    React.createElement('div', { className: 'sandsim-canvas-wrap', ref: containerRef }),
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

