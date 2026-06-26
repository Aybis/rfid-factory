export default function Specs() {
  return (
    <section className="specs" id="specs">
      <div className="specs__content">
        <div className="specs__left">
          <span className="badge badge--cta" style={{ marginBottom: '2rem', display: 'inline-block' }}>
            Spesifikasi Teknis
          </span>
          <h2 className="mid-heading" style={{ marginBottom: '2rem' }}>
            Parameter Hardware<br />yang Digunakan
          </h2>
          <p className="paragraph--sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Spesifikasi reader dan tag UHF yang menjadi dasar implementasi
            ini — cocok untuk lingkungan gudang dengan rak padat dan mobilitas tinggi.
          </p>
        </div>

        <div className="specs__table">
          <h3 className="specs__table-title">UHF RFID Reader</h3>
          <div className="specs__row">
            <span className="specs__row-label">Frekuensi</span>
            <span className="specs__row-value">860–960 MHz (UHF)</span>
          </div>
          <div className="specs__row">
            <span className="specs__row-label">Jangkauan Baca</span>
            <span className="specs__row-value">Hingga 15 meter</span>
          </div>
          <div className="specs__row">
            <span className="specs__row-label">Kecepatan Baca Tag</span>
            <span className="specs__row-value">1.000+ tag/detik</span>
          </div>
          <div className="specs__row">
            <span className="specs__row-label">Akurasi Baca</span>
            <span className="specs__row-value">99.9%</span>
          </div>
          <div className="specs__row">
            <span className="specs__row-label">Protokol</span>
            <span className="specs__row-value">EPC Gen2 / ISO 18000-6C</span>
          </div>
          <div className="specs__row">
            <span className="specs__row-label">Integrasi API</span>
            <span className="specs__row-value">REST / MQTT &lt;10ms latency</span>
          </div>
        </div>
      </div>
    </section>
  );
}
