export default function Specs() {
  return (
    <section className="specs" id="specs">
      <div className="specs__content">
        <div className="specs__left">
          <span className="badge badge--cta" style={{ marginBottom: '2rem', display: 'inline-block' }}>
            Technical Specifications
          </span>
          <h2 className="mid-heading" style={{ marginBottom: '2rem' }}>
            Built for Enterprise<br />Performance
          </h2>
          <p className="paragraph--sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Our RFID platform is engineered to handle the most
            demanding enterprise environments with reliability,
            speed, and precision.
          </p>
        </div>

        <div className="specs__table">
          <h3 className="specs__table-title">Platform Capabilities</h3>
          <div className="specs__row">
            <span className="specs__row-label">Frequency Range</span>
            <span className="specs__row-value">860–960 MHz (UHF)</span>
          </div>
          <div className="specs__row">
            <span className="specs__row-label">Maximum Read Range</span>
            <span className="specs__row-value">Up to 15 meters</span>
          </div>
          <div className="specs__row">
            <span className="specs__row-label">Tag Read Speed</span>
            <span className="specs__row-value">1,000+ tags/second</span>
          </div>
          <div className="specs__row">
            <span className="specs__row-label">Read Accuracy</span>
            <span className="specs__row-value">99.9%</span>
          </div>
          <div className="specs__row">
            <span className="specs__row-label">System Uptime SLA</span>
            <span className="specs__row-value">99.99%</span>
          </div>
          <div className="specs__row">
            <span className="specs__row-label">API Response Time</span>
            <span className="specs__row-value">&lt; 10ms</span>
          </div>
        </div>
      </div>
    </section>
  );
}
