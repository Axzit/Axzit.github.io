import React from 'https://esm.sh/react@18.3.1';

export default function SandSimControls({ paused, eraseMode, onTogglePause, onClear, onToggleErase, onRandomize, onBack }) {
  return React.createElement(
    'div',
    { className: 'sandsim-actions' },
    React.createElement('button', {
      className: `btn ${paused ? 'btn-resume' : 'btn-pause'}`,
      onClick: onTogglePause
    }, paused ? 'Resume' : 'Pause'),
    React.createElement('button', { className: 'btn btn-secondary', onClick: onClear }, 'Clear'),
    React.createElement('button', {
      className: `btn ${eraseMode ? 'btn-erase-on' : 'btn-erase-off'}`,
      onClick: onToggleErase
    }, eraseMode ? 'Erase: On' : 'Erase: Off'),
    React.createElement('button', { className: 'btn btn-primary', onClick: onRandomize }, 'Randomize')
  );
}
