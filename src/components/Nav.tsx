export default function Nav() {
  return (
    <nav className="nav nav--light" id="nav">
      <div className="nav__logo" id="nav-logo">
        <div className="nav__logo-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2a2.5 2.5 0 012.5 2.5v15a2.5 2.5 0 01-5 0v-15A2.5 2.5 0 0112 2z" />
            <path d="M7.5 6.5a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-3 0V8a1.5 1.5 0 011.5-1.5z" />
            <path d="M16.5 6.5a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-3 0V8a1.5 1.5 0 011.5-1.5z" />
            <path d="M3.5 10a1 1 0 011 1v2a1 1 0 01-2 0v-2a1 1 0 011-1zM20.5 10a1 1 0 011 1v2a1 1 0 01-2 0v-2a1 1 0 011-1z" />
          </svg>
        </div>
        <span className="nav__logo-text">RFID Warehouse</span>
      </div>

      <div className="nav__right">
        <div className="nav__phase" id="nav-phase">
          <div className="nav__phase-dot" id="nav-phase-dot">1</div>
          <span className="nav__phase-label" id="nav-phase-label">Inbound</span>
        </div>

        <div className="nav__menu-btn" id="menu-btn">
          <div className="nav__menu-bg" id="menu-bg"></div>

          <div className="nav__menu-label" id="menu-label">Menu</div>

          <div className="nav__hamburger" id="hamburger" role="button" aria-label="Toggle menu" tabIndex={0}>
            <span></span>
            <span></span>
          </div>

          {/* Dropdown Menu */}
          <div className="nav__menu-content" id="menu-content">
            <div className="nav__menu-links">
              <div className="nav__menu-link active" data-target="hero">
                <a href="#hero">Beranda</a>
              </div>
              <div className="nav__menu-link" data-target="immersive">
                <a href="#immersive">Alur Implementasi</a>
              </div>
              <div className="nav__menu-link" data-target="services">
                <a href="#services">Komponen Sistem</a>
              </div>
              <div className="nav__menu-link" data-target="specs">
                <a href="#specs">Spesifikasi Teknis</a>
              </div>
            </div>
            <div className="nav__menu-cta">
              <button className="nav__menu-cta-btn" id="menu-cta-btn">
                <span>Lihat Dokumentasi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
