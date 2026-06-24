export default function Services() {
  return (
    <section className="services" id="services">
      <div className="services__header">
        <span className="badge badge--accent" style={{ marginBottom: '2rem', display: 'inline-block' }}>
          Industries We Serve
        </span>
        <h2 className="mid-heading" style={{ marginBottom: '1.5rem' }}>
          RFID Solutions for<br />Every Sector
        </h2>
        <p
          className="paragraph--sm"
          style={{ margin: '0 auto', textAlign: 'center', color: 'var(--color-dark-mid)' }}
        >
          From warehouses to hospitals, our platform adapts to
          the unique challenges of your industry.
        </p>
      </div>

      <div className="services__grid">
        {/* 1. Inventory & Asset Tracking */}
        <div className="service-card">
          <div className="service-card__icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="20" height="18" rx="2" strokeWidth="1.5" />
              <line x1="2" y1="9" x2="22" y2="9" strokeWidth="1.5" />
              <line x1="8" y1="9" x2="8" y2="21" strokeWidth="1.5" />
              <rect x="10" y="12" width="4" height="3" rx="0.5" strokeWidth="1.2" />
            </svg>
          </div>
          <h3 className="service-card__title">Inventory &amp;<br />Asset Tracking</h3>
          <p className="service-card__desc">
            Real-time visibility across warehouses, retail, and logistics
            with 99.9% accuracy.
          </p>
        </div>

        {/* 2. Access Control */}
        <div className="service-card">
          <div className="service-card__icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="1.5" />
              <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="1.5" fill="none" />
              <circle cx="12" cy="16" r="1.5" strokeWidth="1.5" />
              <line x1="12" y1="17.5" x2="12" y2="19" strokeWidth="1.5" />
            </svg>
          </div>
          <h3 className="service-card__title">Access Control<br />&amp; Security</h3>
          <p className="service-card__desc">
            Secure building entry, employee badging, and zone-based
            access management.
          </p>
        </div>

        {/* 3. Supply Chain */}
        <div className="service-card">
          <div className="service-card__icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2a3 3 0 006 0h6a3 3 0 006 0h2v-5l-3-4z" fill="none" strokeWidth="1.5" />
              <circle cx="7" cy="17" r="2" strokeWidth="1.5" fill="none" />
              <circle cx="17" cy="17" r="2" strokeWidth="1.5" fill="none" />
              <line x1="17" y1="8" x2="17" y2="12" strokeWidth="1.2" />
              <line x1="15" y1="10" x2="19" y2="10" strokeWidth="1.2" />
            </svg>
          </div>
          <h3 className="service-card__title">Supply Chain<br />Management</h3>
          <p className="service-card__desc">
            End-to-end shipment tracking, chain of custody, and
            receiving automation.
          </p>
        </div>

        {/* 4. Industrial IoT */}
        <div className="service-card">
          <div className="service-card__icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4z" fill="none" strokeWidth="1.5" />
              <path d="M9 10l2 2 4-4" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <h3 className="service-card__title">Industrial IoT<br />&amp; Manufacturing</h3>
          <p className="service-card__desc">
            Production line tracking, quality control, and
            automated WIP management.
          </p>
        </div>

        {/* 5. Healthcare */}
        <div className="service-card">
          <div className="service-card__icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="none" strokeWidth="1.5" />
              <line x1="12" y1="8" x2="12" y2="16" strokeWidth="2" />
              <line x1="8" y1="12" x2="16" y2="12" strokeWidth="2" />
            </svg>
          </div>
          <h3 className="service-card__title">Healthcare<br />Solutions</h3>
          <p className="service-card__desc">
            Patient tracking, equipment management, and
            pharmaceutical chain integrity.
          </p>
        </div>
      </div>
    </section>
  );
}
