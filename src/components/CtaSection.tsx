export default function CtaSection() {
  return (
    <section className="cta-section" id="cta">
      <div className="cta-section__glow"></div>
      <h2 className="cta-section__heading fade-in">
        Tertarik Mengimplementasikan<br />RFID di Gudangmu?
      </h2>
      <p className="cta-section__desc fade-in fade-in-delay-1">
        Implementasi ini dibangun sebagai referensi nyata alur digitalisasi gudang
        berbasis RFID. Mulai dari arsitektur hardware hingga integrasi WMS — semua
        bisa disesuaikan dengan kebutuhan operasionalmu.
      </p>
      <div className="cta-section__buttons fade-in fade-in-delay-2">
        <button className="btn-primary">Diskusikan Implementasi</button>
        <button className="btn-ghost">
          <span className="btn-ghost__inner">Lihat Spesifikasi Teknis</span>
        </button>
      </div>
    </section>
  );
}
