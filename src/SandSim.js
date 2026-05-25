import React from 'https://esm.sh/react@18.3.1';

export default function SandSim() {
  const { useEffect, useRef, useState } = React;
  const containerRef = useRef(null);
  const p5Ref = useRef(null);
  const gridRef = useRef(null);

  const pausedRef = useRef(true);
  const eraseRef = useRef(false);
  const scaleXRef = useRef(0.08);
  const scaleYRef = useRef(0.08);
  const cutoffRef = useRef(0.5);
  const userInteractedRef = useRef(false);
  const lastClumpTimeRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const [scaleX, setScaleX] = useState(0.08);
  const [scaleY, setScaleY] = useState(0.08);
  const [cutoff, setCutoff] = useState(0.5);

  const res = 5;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    eraseRef.current = eraseMode;
  }, [eraseMode]);
  useEffect(() => {
    scaleXRef.current = scaleX;
  }, [scaleX]);
  useEffect(() => {
    scaleYRef.current = scaleY;
  }, [scaleY]);
  useEffect(() => {
    cutoffRef.current = cutoff;
  }, [cutoff]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const P5mod = await import('https://esm.sh/p5@1.6.0');
      const P5 = P5mod && P5mod.default ? P5mod.default : P5mod;

      function createSize() {
        const margin = 32;
        const availableHeight = window.innerHeight - 360; // reserve space for header + controls
        const maxSize = Math.min(600, availableHeight);
        const side = Math.max(150, Math.min(maxSize, Math.floor(window.innerWidth - margin)));
        return { w: side, h: side };
      }

      const sketch = (p) => {
        class Grid {
          constructor(_res) {
            this.res = _res;
            this.w = Math.floor(p.width / this.res);
            this.h = Math.floor(p.height / this.res);
            this.cells = Array.from({ length: this.w }, () => Array(this.h).fill(false));
          }

          clear() {
            this.cells = Array.from({ length: this.w }, () => Array(this.h).fill(false));
          }

          randomize(scaleX = 0.08, scaleY = 0.08, cutoff = 0.5) {
            for (let i = 0; i < this.w; i++) {
              for (let j = 0; j < this.h; j++) {
                const noiseVal = p.noise(i * scaleX, j * scaleY);
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
            for (let j = 0; j < this.h - 1; j++) {
              for (let i = 0; i < this.w; i++) {
                if (this.cells[i][j]) {
                  if (!this.cells[i][j + 1]) {
                    newCells[i][j + 1] = true;
                  } else {
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
                      newCells[i][j] = true;
                    }
                  }
                }
              }
            }
            this.cells = newCells;
          }

          draw() {
            const colCounts = Array(this.w).fill(0);
            p.strokeWeight(this.res);

            for (let j = 0; j < this.h; j++) {
              for (let i = 0; i < this.w; i++) {
                if (this.cells[i][j]) {
                  const pressure = colCounts[i];
                  const pNorm = this.h > 1 ? pressure / (this.h - 1) : 0;
                  const layers = 12;
                  const layer = Math.min(layers - 1, Math.floor(pNorm * layers));
                  const hueStep = 300 / layers;
                  const jitter = ((i * 97 + j * 131) % 9) - 4;
                  const baseHue = 50;
                  const h = Math.round(baseHue + layer * hueStep + jitter);
                  const s = 84;
                  const l = 64;
                  p.stroke(`hsl(${h}, ${s}%, ${l}%)`);
                  p.point(i * this.res, j * this.res);
                  colCounts[i]++;
                }
              }
            }
          }
        }

        p.setup = () => {
          const size = createSize();
          p.createCanvas(size.w, size.h);
          p.pixelDensity(1);
          gridRef.current = new Grid(res);
          gridRef.current.randomize(scaleXRef.current, scaleYRef.current, cutoffRef.current);
        };

        p.draw = () => {
          p.background(18);

          if (p.mouseIsPressed) {
            userInteractedRef.current = true;
            if (eraseRef.current) gridRef.current.removeParticle(p.mouseX, p.mouseY);
            else gridRef.current.createParticle(p.mouseX, p.mouseY);
          }

          // Auto-spawn sand clumps at intervals until user interacts
          if (!userInteractedRef.current && !pausedRef.current) {
            const now = p.frameCount;
            const interval = 30; // spawn every 30 frames (~0.5 sec at 60fps)
            if (now - lastClumpTimeRef.current >= interval) {
              lastClumpTimeRef.current = now;
              const grid = gridRef.current;
              
              // Count particles in bottom-most row
              let clumpSize = 0;
              for (let col = 0; col < grid.w; col++) {
                if (grid.cells[col][grid.h - 1]) clumpSize++;
              }
              
              if (clumpSize > 0) {
                // Multiply clump size to make clumps larger
                clumpSize = Math.floor(clumpSize * 2.5);
                const centerX = Math.floor(Math.random() * grid.w);
                const centerY = 2;
                // Spawn clump around center
                let spawned = 0;
                for (let k = 0; k < clumpSize && spawned < clumpSize; k++) {
                  const dx = Math.floor((Math.random() - 0.5) * 6);
                  const dy = Math.floor((Math.random() - 0.5) * 2);
                  const x = centerX + dx;
                  const y = centerY + dy;
                  if (x >= 0 && x < grid.w) {
                    grid.createParticle(x * res + res / 2, y * res + res / 2);
                    spawned++;
                  }
                }
              }
              
              // Check if grid is full, if so clear it
              let totalParticles = 0;
              for (let i = 0; i < grid.w; i++) {
                for (let j = 0; j < grid.h; j++) {
                  if (grid.cells[i][j]) totalParticles++;
                }
              }
              if (totalParticles > grid.w * grid.h * 0.95) {
                grid.clear();
                lastClumpTimeRef.current = now;
              }
            }
          }

          if (!pausedRef.current) gridRef.current.update();
          gridRef.current.draw();
        };

        p.windowResized = () => {
          const size = createSize();
          p.resizeCanvas(size.w, size.h);
          gridRef.current = new Grid(res);
          gridRef.current.randomize(scaleXRef.current, scaleYRef.current, cutoffRef.current);
        };

        p.touchStarted = () => {
          userInteractedRef.current = true;
          let tx = typeof p.touchX !== 'undefined' ? p.touchX : p.mouseX;
          let ty = typeof p.touchY !== 'undefined' ? p.touchY : p.mouseY;
          if (eraseRef.current) gridRef.current.removeParticle(tx, ty);
          else gridRef.current.createParticle(tx, ty);
          return false;
        };

        p.touchMoved = () => {
          userInteractedRef.current = true;
          let tx = typeof p.touchX !== 'undefined' ? p.touchX : p.mouseX;
          let ty = typeof p.touchY !== 'undefined' ? p.touchY : p.mouseY;
          if (eraseRef.current) gridRef.current.removeParticle(tx, ty);
          else gridRef.current.createParticle(tx, ty);
          return false;
        };
      };

      if (!mounted) return;
      try {
        if (containerRef.current) p5Ref.current = new P5(sketch, containerRef.current);
      } catch (err) {
        // fail silently but log for debugging
        // eslint-disable-next-line no-console
        console.error('p5 init error', err);
      }
    })();

    const onResize = () => {
      if (p5Ref.current && p5Ref.current._renderer) {
        const size = Math.max(200, Math.min(900, Math.floor(window.innerWidth - 48)));
        p5Ref.current.resizeCanvas(size, size);
      }
    };

    window.addEventListener('resize', onResize);
    return () => {
      mounted = false;
      window.removeEventListener('resize', onResize);
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
    if (gridRef.current) gridRef.current.randomize(scaleXRef.current, scaleYRef.current, cutoffRef.current);
  };

  const togglePause = () => {
    userInteractedRef.current = true;
    setPaused((s) => !s);
  };
  const toggleErase = () => {
    userInteractedRef.current = true;
    setEraseMode((e) => !e);
  };

  return React.createElement(
    'main',
    { className: 'app-shell sandsim-shell', style: { height: '100vh', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 24px', overflow: 'hidden' } },
    React.createElement(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' } },
      React.createElement('h2', { style: { margin: 0 } }, 'SandSim'),
      React.createElement(
        'button',
        { className: 'btn btn-secondary', onClick: () => (window.location.hash = '#') },
        'Back'
      )
    ),
    React.createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0 } },
      React.createElement('div', { ref: containerRef, style: { borderRadius: 12, overflow: 'hidden', background: 'rgba(10,12,18,0.6)', padding: 8, display: 'flex', justifyContent: 'center', flex: 1, minHeight: 0 } }),
      React.createElement(
        'div',
        { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' } },
        React.createElement(
          'label',
          { style: { fontSize: '12px', color: '#71d3ff', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '600' } },
          'Noise Scale X',
          React.createElement('input', {
            type: 'range',
            min: '0.01',
            max: '0.2',
            step: '0.01',
            value: scaleX,
            onInput: (e) => { setScaleX(parseFloat(e.target.value)); },
            onChange: (e) => { scaleXRef.current = parseFloat(e.target.value); },
            style: { cursor: 'pointer', accentColor: '#58f6d7' },
          })
        ),
        React.createElement(
          'label',
          { style: { fontSize: '11px', color: '#71d3ff', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: '600' } },
          'Noise Scale Y',
          React.createElement('input', {
            type: 'range',
            min: '0.01',
            max: '0.2',
            step: '0.01',
            value: scaleY,
            onInput: (e) => { setScaleY(parseFloat(e.target.value)); },
            onChange: (e) => { scaleYRef.current = parseFloat(e.target.value); },
            style: { cursor: 'pointer', accentColor: '#58f6d7' },
          })
        ),
        React.createElement(
          'label',
          { style: { fontSize: '11px', color: '#71d3ff', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: '600' } },
          'Spawn Cutoff',
          React.createElement('input', {
            type: 'range',
            min: '0',
            max: '1',
            step: '0.01',
            value: cutoff,
            onInput: (e) => { setCutoff(parseFloat(e.target.value)); },
            onChange: (e) => { cutoffRef.current = parseFloat(e.target.value); },
            style: { cursor: 'pointer', accentColor: '#58f6d7' },
          })
        )
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', minHeight: 'auto' } },
        React.createElement(
          'button',
          { className: 'btn btn-secondary', onClick: togglePause, style: { minHeight: '40px', padding: '0 18px', fontSize: '13px' } },
          paused ? 'Resume' : 'Pause'
        ),
        React.createElement(
          'button',
          { className: 'btn btn-secondary', onClick: handleClear, style: { minHeight: '40px', padding: '0 18px', fontSize: '13px' } },
          'Clear'
        ),
        React.createElement(
          'button',
          { className: 'btn btn-secondary', onClick: toggleErase, style: { minHeight: '40px', padding: '0 18px', fontSize: '13px' } },
          eraseMode ? 'Erase: On' : 'Erase: Off'
        ),
        React.createElement(
          'button',
          { className: 'btn btn-primary', onClick: handleRandomize, style: { minHeight: '40px', padding: '0 18px', fontSize: '13px' } },
          'Randomize'
        )
      )
    )
  );
}

