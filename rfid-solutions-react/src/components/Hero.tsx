export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero__bg-glow"></div>
      <div className="hero__bg-glow hero__bg-glow--green"></div>

      <div className="hero__badge">
        <span className="badge badge--accent">Enterprise RFID Platform</span>
      </div>

      <h1 className="hero__title">
        <span className="line"><span className="line-inner">Build Your</span></span>
        <span className="line"><span className="line-inner"><span className="accent">RFID</span></span></span>
        <span className="line"><span className="line-inner">Infrastructure</span></span>
      </h1>

      <p className="hero__subtitle">
        From site assessment to full deployment — we deliver scalable,
        reliable and future-proof RFID tracking systems for enterprises
        that demand precision.
      </p>

      <div className="hero__cta">
        <button className="btn-primary" id="hero-cta">Start Your Project</button>
        <button className="btn-ghost" id="hero-explore">
          <span className="btn-ghost__inner">Explore Our Process</span>
        </button>
      </div>

      <div className="hero__scroll-hint">
        <div className="scroll-arrow">
          <span></span>
          <span></span>
        </div>
        <span>Scroll to explore</span>
      </div>
    </section>
  );
}
