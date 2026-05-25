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
        React.createElement('h1', null, 'A Sharad Company'),
        React.createElement(
          'p',
          null,
          'Prospecting a conglomerate taping into Medicine, Tech, Research & Related Services'
        ),
        React.createElement(
          'div',
          { className: 'hero-actions' },
          React.createElement(
            'a',
            { className: 'btn btn-primary', href: '/SandSim' },
            'SandSim/Diya'
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
          React.createElement('span', { className: 'panel-value' }, 'On Hold'),
          React.createElement(
            'p',
            { className: 'panel-copy' },
            'Looking for Partners to work with us'
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
        'Our Goal is to create a Parent Company taping into BioTech Research, Medicine, Tech & other related B2C Services.'
      )
    ),
    React.createElement(
      'section',
      { className: 'section features-section' },
      React.createElement(
        'article',
        { className: 'feature-card' },
        React.createElement('h3', null, 'Health Services'),
        React.createElement('p', null, 'Have a chain of Quality Hospitals')
      ),
      React.createElement(
        'article',
        { className: 'feature-card' },
        React.createElement('h3', null, 'Tech'),
        React.createElement('p', null, 'Provide AI Powered Health Solutions')
      ),
      React.createElement(
        'article',
        { className: 'feature-card' },
        React.createElement('h3', null, 'Research'),
        React.createElement('p', null, 'Have a Research Wing focused on BioTech and Medicine')
      )
    ),
    React.createElement(
      'section',
      { id: 'contact', className: 'section contact-section' },
      React.createElement('h2', null, 'Get in touch'),
      React.createElement(
        'p',
        null,
        'Ready to shape the future? Reach out to join Axzit'
      ),
      React.createElement(
        'a',
        { className: 'btn btn-primary', href: '' },
        'axzitofficial@gmail.com'
      )
    )
  );

export default App;
