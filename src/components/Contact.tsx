export default function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="contact__row">
        <div className="contact__label">General Inquiries</div>
        <a href="mailto:hello@rfidsolutions.com" className="contact__link">hello@rfidsolutions.com</a>
      </div>
      <div className="contact__row">
        <div className="contact__label">Sales &amp; Partnerships</div>
        <a href="tel:+18005551234" className="contact__link">+1 (800) 555-1234</a>
      </div>
      <div className="contact__row">
        <div className="contact__label">Headquarters</div>
        <span className="contact__link" style={{ cursor: 'default' }}>San Francisco, California</span>
      </div>
    </section>
  );
}
