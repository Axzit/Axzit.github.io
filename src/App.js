import React from 'https://esm.sh/react@18.3.1';

const App = () =>
  React.createElement(
    'main',
    { className: 'app-shell' },
    React.createElement(
      'header',
      { className: 'page-hero', 'aria-label': 'Axzit hero section' },
      React.createElement(
        'div',
        { className: 'hero-copy' },
        React.createElement('p', { className: 'eyebrow' }, 'Axzit'),
        React.createElement('h1', null, 'Futuristic digital presence'),
        React.createElement(
          'p',
          null,
          'A sleek, modern portfolio experience for the next generation of creators, builders, and visionary brands.'
        ),
        React.createElement(
          'div',
          { className: 'hero-actions' },
          React.createElement(
            'a',
            { className: 'btn btn-primary', href: '#about' },
            'Explore Axzit'
          ),
          React.createElement(
            'a',
            { className: 'btn btn-secondary', href: '#contact' },
            'Contact'
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'hero-panel', 'aria-hidden': 'true' },
        React.createElement(
          'div',
          { className: 'panel-card' },
          React.createElement('span', { className: 'panel-title' }, 'Status'),
          React.createElement('span', { className: 'panel-value' }, 'Live'),
          React.createElement(
            'p',
            { className: 'panel-copy' },
            'Axzit is ready for launch with responsive React styling.'
          )
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
        'Axzit blends cutting-edge visuals with accessible design to create a clean, responsive web platform. This site is built with React and Vite for fast loading and modern workflows.'
      )
    ),
    React.createElement(
      'section',
      { className: 'section features-section' },
      React.createElement(
        'article',
        { className: 'feature-card' },
        React.createElement('h3', null, 'Responsive layout'),
        React.createElement('p', null, 'Designed to work smoothly on desktop, tablet, and mobile devices.')
      ),
      React.createElement(
        'article',
        { className: 'feature-card' },
        React.createElement('h3', null, 'Accessible by default'),
        React.createElement('p', null, 'Semantic markup, readable contrast, and keyboard-friendly navigation.')
      ),
      React.createElement(
        'article',
        { className: 'feature-card' },
        React.createElement('h3', null, 'Customizable branding'),
        React.createElement('p', null, 'Easy to extend with your own portfolio, services, or creative story.')
      )
    ),
    React.createElement(
      'section',
      { id: 'contact', className: 'section contact-section' },
      React.createElement('h2', null, 'Get in touch'),
      React.createElement(
        'p',
        null,
        'Ready to shape the future? Reach out to start the next Axzit project.'
      ),
      React.createElement(
        'a',
        { className: 'btn btn-primary', href: 'mailto:hello@example.com' },
        'hello@axzit.io'
      )
    )
  );

export default App;
