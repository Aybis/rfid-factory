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
        <span className="line"><span className="line-inner">Gudang <span className="accent">Modern</span></span></span>
        <span className="line"><span className="line-inner">End-to-End</span></span>
      </h1>

      <p className="hero__subtitle">
        Konversi seluruh operasi gudang manual menjadi alur otomatis berbasis RFID —
        dari penerimaan, penyimpanan, picking, hingga pengiriman ke distributor.
        Real-time, akurat, dan bebas kertas.
      </p>

      <div className="hero__stats">
        <div className="hero__stat">
          <span className="hero__stat-value">99.8<span className="hero__stat-unit">%</span></span>
          <span className="hero__stat-label">Akurasi Inventori</span>
        </div>
        <div className="hero__stat-divider"></div>
        <div className="hero__stat">
          <span className="hero__stat-value">3<span className="hero__stat-unit">×</span></span>
          <span className="hero__stat-label">Kecepatan Picking</span>
        </div>
        <div className="hero__stat-divider"></div>
        <div className="hero__stat">
          <span className="hero__stat-value">0<span className="hero__stat-unit"> kertas</span></span>
          <span className="hero__stat-label">Fully Paperless</span>
        </div>
      </div>

      <div className="hero__cta">
        <button className="btn-primary" id="hero-cta">Mulai Konsultasi</button>
        <button className="btn-ghost" id="hero-explore">
          <span className="btn-ghost__inner">Lihat Kedua Gudang</span>
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
