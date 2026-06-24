export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero__bg-glow"></div>
      <div className="hero__bg-glow hero__bg-glow--green"></div>

      <div className="hero__badge">
        <span className="badge badge--accent">Platform RFID Enterprise</span>
      </div>

      <h1 className="hero__title">
        <span className="line"><span className="line-inner">Digitalisasi</span></span>
        <span className="line"><span className="line-inner">Gudang <span className="accent">RFID</span></span></span>
        <span className="line"><span className="line-inner">End-to-End</span></span>
      </h1>

      <p className="hero__subtitle">
        Ikuti perjalanan satu palet — dari barang masuk, penyimpanan,
        picking, hingga diterima distributor. Setiap langkah terbaca
        otomatis oleh RFID, real-time dan tanpa kertas.
      </p>

      <div className="hero__cta">
        <button className="btn-primary" id="hero-cta">Mulai Konsultasi</button>
        <button className="btn-ghost" id="hero-explore">
          <span className="btn-ghost__inner">Lihat Alur Perjalanan</span>
        </button>
      </div>

      <div className="hero__scroll-hint">
        <div className="scroll-arrow">
          <span></span>
          <span></span>
        </div>
        <span>Scroll untuk menjelajah</span>
      </div>
    </section>
  );
}
