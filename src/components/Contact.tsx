export default function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="contact__row">
        <div className="contact__label">Tentang Proyek Ini</div>
        <span className="contact__link" style={{ cursor: 'default' }}>
          Simulasi implementasi RFID di gudang — dibangun sebagai referensi teknis
        </span>
      </div>
      <div className="contact__row">
        <div className="contact__label">Diskusi &amp; Kolaborasi</div>
        <a href="mailto:muchtara2m@gmail.com" className="contact__link">muchtara2m@gmail.com</a>
      </div>
      <div className="contact__row">
        <div className="contact__label">Teknologi</div>
        <span className="contact__link" style={{ cursor: 'default' }}>Three.js · TypeScript · Vite · React</span>
      </div>
    </section>
  );
}
