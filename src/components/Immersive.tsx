export default function Immersive() {
  return (
    <section className="immersive" id="immersive">
      <div className="immersive__sticky">
        {/* PIN OVERLAY LAYER — pins are created dynamically by the pins module */}
        <div className="immersive__pins" id="immersive-pins"></div>

        {/* EXPANDED DETAIL CARD */}
        <div className="immersive__card" id="immersive-card">
          <button className="immersive__card-close" id="card-close" aria-label="Close detail card">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="immersive__card-header">
            <span className="immersive__card-icon">✦</span>
            <h3 className="immersive__card-title" id="card-title"></h3>
          </div>
          <p className="immersive__card-desc" id="card-desc"></p>
          <div className="immersive__card-img" id="card-img"></div>
        </div>

        {/* STEP TEXT (bottom-right) */}
        <div className="immersive__step" id="immersive-step">
          <div className="immersive__step-label">
            <span className="immersive__step-icon">✦</span>
            <span className="immersive__step-num" id="step-label">STEP 01</span>
          </div>
          <p className="immersive__step-text" id="step-text">
            Truk tiba di loading dock. Setiap palet melewati RFID Gate dan otomatis terbaca, lalu dicocokkan dengan Purchase Order.
          </p>
        </div>

        {/* SCROLL HINT (bottom-left) */}
        <div className="immersive__scroll-hint" id="immersive-scroll-hint">
          <div className="immersive__scroll-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="7" y="2" width="10" height="20" rx="5" />
              <line x1="12" y1="6" x2="12" y2="10" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span>Scroll to explore</span>
        </div>

        {/* CAMERA CONTROLS HINT (top-left) */}
        <div className="immersive__cam-hint">
          <div className="immersive__cam-hint-row">
            <span className="immersive__cam-hint-icon">
              {/* Mouse drag icon */}
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 2C7.24 2 5 4.24 5 7v6c0 2.76 2.24 5 5 5s5-2.24 5-5V7c0-2.76-2.24-5-5-5z"/>
                <line x1="10" y1="5" x2="10" y2="8" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <span>Drag to rotate</span>
          </div>
          <div className="immersive__cam-hint-row">
            <span className="immersive__cam-hint-icon">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 2C7.24 2 5 4.24 5 7v6c0 2.76 2.24 5 5 5s5-2.24 5-5V7c0-2.76-2.24-5-5-5z"/>
                <line x1="10" y1="5" x2="10" y2="8" strokeWidth="2" strokeLinecap="round"/>
                <text x="13" y="9" fontSize="7" fill="currentColor" stroke="none">R</text>
              </svg>
            </span>
            <span>Right drag to pan</span>
          </div>
          <div className="immersive__cam-hint-row">
            <span className="immersive__cam-hint-icon">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="10" y1="2" x2="10" y2="18"/>
                <polyline points="6,6 10,2 14,6"/>
                <polyline points="6,14 10,18 14,14"/>
              </svg>
            </span>
            <span>Ctrl+Scroll to zoom</span>
          </div>
          <div className="immersive__cam-hint-row">
            <span className="immersive__cam-hint-icon">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="10" cy="10" r="7"/>
                <line x1="10" y1="6" x2="10" y2="14"/>
                <line x1="6" y1="10" x2="14" y2="10"/>
              </svg>
            </span>
            <span>Double-click to reset</span>
          </div>
        </div>
      </div>
    </section>
  );
}
