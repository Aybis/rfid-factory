export default function CtaSection() {
  return (
    <section className="cta-section" id="cta">
      <div className="cta-section__glow"></div>
      <h2 className="cta-section__heading fade-in">
        Ready to Build<br />Your RFID System?
      </h2>
      <p className="cta-section__desc fade-in fade-in-delay-1">
        Let&apos;s start with a free consultation. Our team will assess
        your needs and design a solution that scales with your business.
      </p>
      <div className="cta-section__buttons fade-in fade-in-delay-2">
        <button className="btn-primary">Schedule Consultation</button>
        <button className="btn-ghost">
          <span className="btn-ghost__inner">Download Brochure</span>
        </button>
      </div>
    </section>
  );
}
