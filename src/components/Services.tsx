export default function Services() {
  return (
    <section className="services" id="services">
      <div className="services__header">
        <span className="badge badge--accent" style={{ marginBottom: '2rem', display: 'inline-block' }}>
          Komponen Sistem
        </span>
        <h2 className="mid-heading" style={{ marginBottom: '1.5rem' }}>
          Arsitektur Implementasi<br />RFID di Gudang
        </h2>
        <p
          className="paragraph--sm"
          style={{ margin: '0 auto', textAlign: 'center', color: 'var(--color-dark-mid)' }}
        >
          Setiap komponen bekerja bersama membentuk ekosistem yang
          mengotomasi visibilitas barang dari masuk hingga keluar gudang.
        </p>
      </div>

      <div className="services__grid">
        {/* 1. RFID Gate & Fixed Reader */}
        <div className="service-card">
          <div className="service-card__icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="3" height="18" rx="1" strokeWidth="1.5" />
              <rect x="19" y="3" width="3" height="18" rx="1" strokeWidth="1.5" />
              <path d="M5 8 Q12 6 19 8" strokeWidth="1.5" fill="none" />
              <path d="M5 16 Q12 18 19 16" strokeWidth="1.5" fill="none" />
              <circle cx="12" cy="12" r="2" strokeWidth="1.5" />
            </svg>
          </div>
          <h3 className="service-card__title">RFID Gate<br />&amp; Fixed Reader</h3>
          <p className="service-card__desc">
            Dipasang di pintu inbound dan outbound. Membaca semua tag palet
            secara otomatis saat melewati gawang — tanpa scan manual.
          </p>
        </div>

        {/* 2. Handheld RFID Scanner */}
        <div className="service-card">
          <div className="service-card__icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <rect x="7" y="2" width="10" height="16" rx="2" strokeWidth="1.5" fill="none" />
              <rect x="9" y="4" width="6" height="4" rx="0.5" strokeWidth="1.2" />
              <line x1="12" y1="22" x2="12" y2="18" strokeWidth="2" />
              <path d="M9 21h6" strokeWidth="1.5" />
            </svg>
          </div>
          <h3 className="service-card__title">Handheld RFID<br />Scanner</h3>
          <p className="service-card__desc">
            Digunakan petugas picking dan putaway. Bergetar makin cepat
            saat mendekati barang yang dicari — navigasi ke rak tanpa buka kertas.
          </p>
        </div>

        {/* 3. RFID Tag & Label */}
        <div className="service-card">
          <div className="service-card__icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" fill="none" strokeWidth="1.5" />
              <circle cx="7" cy="7" r="1.5" />
              <line x1="11" y1="7" x2="11" y2="7" strokeWidth="2" />
              <line x1="7" y1="11" x2="7" y2="11" strokeWidth="2" />
              <line x1="11" y1="11" x2="13" y2="11" strokeWidth="1.5" />
            </svg>
          </div>
          <h3 className="service-card__title">RFID Tag<br />&amp; Label Lokasi</h3>
          <p className="service-card__desc">
            Tag UHF ditempel di setiap palet. Tag lokasi dipasang di rak.
            Pasangan keduanya mengunci posisi barang secara otomatis saat putaway.
          </p>
        </div>

        {/* 4. WMS & Inventory Real-time */}
        <div className="service-card">
          <div className="service-card__icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="20" height="18" rx="2" strokeWidth="1.5" fill="none" />
              <line x1="2" y1="9" x2="22" y2="9" strokeWidth="1.5" />
              <line x1="8" y1="9" x2="8" y2="21" strokeWidth="1.5" />
              <path d="M11 13h7M11 16h5" strokeWidth="1.2" />
            </svg>
          </div>
          <h3 className="service-card__title">WMS &amp;<br />Inventory Real-time</h3>
          <p className="service-card__desc">
            Stok diperbarui otomatis setiap kali tag terbaca. Stock opname
            berjalan kontinyu — tidak perlu berhenti operasi untuk hitung fisik.
          </p>
        </div>

        {/* 5. ASN & Dokumen Digital */}
        <div className="service-card">
          <div className="service-card__icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" strokeWidth="1.5" />
              <path d="M14 2v6h6" fill="none" strokeWidth="1.5" />
              <line x1="8" y1="13" x2="16" y2="13" strokeWidth="1.5" />
              <line x1="8" y1="17" x2="13" y2="17" strokeWidth="1.5" />
              <path d="M15 17l2 2 3-3" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <h3 className="service-card__title">ASN &amp; Dokumen<br />Otomatis</h3>
          <p className="service-card__desc">
            Saat palet melewati gate outbound: stok terpotong, Surat Jalan tercetak,
            dan Advance Shipping Notice terkirim digital ke distributor seketika.
          </p>
        </div>
      </div>
    </section>
  );
}
