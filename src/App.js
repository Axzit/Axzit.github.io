import React from 'https://esm.sh/react@18.3.1';
import SandSim from './SandSim.js';

const App = () => {
  const { useEffect, useState } = React;
  const [isSand, setIsSand] = useState(typeof window !== 'undefined' && window.location.hash === '#SandSim');

  useEffect(() => {
    const handleHash = () => setIsSand(window.location.hash === '#SandSim');
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (isSand) return React.createElement(SandSim);

  const features = [
    { title: 'Coding', description: 'Loving this Hobby since 2017' },
    { title: 'Problem Solving', description: 'Best Liesure Time' },
    { title: 'Research', description: 'Everything from Quantum to Classical Physics, Cellular Biology to Technology, Computer Science and Maths' }
  ];

  return React.createElement(
    'main',
    { className: 'app-shell' },
    React.createElement(
      'header',
      { className: 'page-hero', 'aria-label': 'Axzit hero section' },
      React.createElement(
        'div',
        { className: 'hero-copy' },
        React.createElement('p', { className: 'eyebrow' }, 'Axzit'),
        React.createElement('h1', null, 'A Sharad Hobby'),
        React.createElement(
          'p',
          null,
          'This is a Hobby Projects Site, Not very actively maintained, but I seldom share some of my projects here;'
        ),
        React.createElement(
          'div',
          { className: 'hero-actions' },
          React.createElement('a', { className: 'btn btn-primary', href: '#SandSim' }, 'SandSim'),
          React.createElement('a', { className: 'btn btn-secondary', href: '#contact' }, 'Contact')
        )
      ),
      React.createElement(
        'div',
        { className: 'hero-panel', 'aria-hidden': 'true' },
        React.createElement(
          'div',
          { className: 'panel-card' },
          React.createElement('span', { className: 'panel-title' }, 'Status'),
          React.createElement('span', { className: 'panel-value' }, 'On Hold'),
          React.createElement('p', { className: 'panel-copy' }, 'Looking for other Nerds to Join me')
        )
      )
    ),
    React.createElement(
      'section',
      { id: 'about', className: 'section about-section' },
      React.createElement('h2', null, 'About Axzit'),
      React.createElement(
        'p',
        null,
        'The Dream of Creating usefeulness for human society'
      )
    ),
    React.createElement(
      'section',
      { className: 'section features-section' },
      features.map((feature) =>
        React.createElement(
          'article',
          { className: 'feature-card', key: feature.title },
          React.createElement('h3', null, feature.title),
          React.createElement('p', null, feature.description)
        )
      )
    ),
    React.createElement(
      'section',
      { id: 'contact', className: 'section contact-section' },
      React.createElement('h2', null, 'Get in touch'),
      React.createElement('p', null, 'Nerd? Lets have a chat at'),
      React.createElement('a', { className: 'btn btn-primary', href: 'https://www.instagram.com/sharad.jpeg' }, 'Insta: Sharad.jpeg')
    )
  );
};

export default App;
