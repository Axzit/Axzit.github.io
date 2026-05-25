function App() {
  return (
    <main className="app-shell">
      <header className="page-hero" aria-label="Axzit hero section">
        <div className="hero-copy">
          <p className="eyebrow">Axzit</p>
          <h1>Futuristic digital presence</h1>
          <p>
            A sleek, modern portfolio experience for the next generation of creators,
            builders, and visionary brands.
          </p>
          <div className="hero-actions">
            <a href="#about" className="btn btn-primary">
              Explore Axzit
            </a>
            <a href="#contact" className="btn btn-secondary">
              Contact
            </a>
          </div>
        </div>
        <div className="hero-panel" aria-hidden="true">
          <div className="panel-card">
            <span className="panel-title">Status</span>
            <span className="panel-value">Live</span>
            <p className="panel-copy">Axzit is ready for launch with responsive React styling.</p>
          </div>
        </div>
      </header>

      <section id="about" className="section about-section">
        <h2>About Axzit</h2>
        <p>
          Axzit blends cutting-edge visuals with accessible design to create a clean,
          responsive web platform. This site is built with React and Vite for fast
          loading and modern workflows.
        </p>
      </section>

      <section className="section features-section">
        <article className="feature-card">
          <h3>Responsive layout</h3>
          <p>Designed to work smoothly on desktop, tablet, and mobile devices.</p>
        </article>
        <article className="feature-card">
          <h3>Accessible by default</h3>
          <p>Semantic markup, readable contrast, and keyboard-friendly navigation.</p>
        </article>
        <article className="feature-card">
          <h3>Customizable branding</h3>
          <p>Easy to extend with your own portfolio, services, or creative story.</p>
        </article>
      </section>

      <section id="contact" className="section contact-section">
        <h2>Get in touch</h2>
        <p>
          Ready to shape the future? Reach out to start the next Axzit project.
        </p>
        <a className="btn btn-primary" href="mailto:hello@example.com">
          hello@axzit.io
        </a>
      </section>
    </main>
  );
}

export default App;
