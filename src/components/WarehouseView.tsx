export default function WarehouseView() {
  return (
    <section className="wv" id="warehouse-view">
      <div className="wv__sticky">

        {/* ── CENTER DIVIDER ── */}
        <div className="wv__divider">
          <div className="wv__divider-line"></div>
          <div className="wv__divider-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3L3 8l5 5M16 3l5 5-5 5" />
            </svg>
          </div>
        </div>

        {/* ── LEFT PANEL — Inbound ── */}
        <div className="wv__panel wv__panel--left">
          <div className="wv__tag">INBOUND</div>
          <h2 className="wv__title">Barang Masuk</h2>
          <p className="wv__desc">
            Truk tiba di loading dock. RFID Gate membaca seluruh palet
            sekaligus dan mencocokkannya dengan Purchase Order secara real-time.
          </p>
          <ul className="wv__features">
            <li className="wv__feature">
              <span className="wv__feature-dot wv__feature-dot--cyan"></span>
              RFID Inbound Gate
            </li>
            <li className="wv__feature">
              <span className="wv__feature-dot wv__feature-dot--cyan"></span>
              Auto PO Matching
            </li>
            <li className="wv__feature">
              <span className="wv__feature-dot wv__feature-dot--cyan"></span>
              Real-time Receiving
            </li>
          </ul>
        </div>

        {/* ── RIGHT PANEL — Outbound ── */}
        <div className="wv__panel wv__panel--right">
          <div className="wv__tag wv__tag--green">OUTBOUND</div>
          <h2 className="wv__title">Barang Keluar</h2>
          <p className="wv__desc">
            Palet melewati RFID Gate Outbound menuju distributor. Surat Jalan
            tercetak otomatis dan ASN dikirim digital ke titik penerimaan.
          </p>
          <ul className="wv__features">
            <li className="wv__feature">
              <span className="wv__feature-dot wv__feature-dot--green"></span>
              RFID Outbound Gate
            </li>
            <li className="wv__feature">
              <span className="wv__feature-dot wv__feature-dot--green"></span>
              Surat Jalan Otomatis
            </li>
            <li className="wv__feature">
              <span className="wv__feature-dot wv__feature-dot--green"></span>
              ASN Digital
            </li>
          </ul>
        </div>

        {/* ── BOTTOM HINT ── */}
        <div className="wv__scroll-hint">
          <div className="wv__scroll-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="7" y="2" width="10" height="20" rx="5" />
              <line x1="12" y1="6" x2="12" y2="10" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span>Scroll untuk ikuti perjalanan palet</span>
        </div>

      </div>
    </section>
  );
}
