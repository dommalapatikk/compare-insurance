export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Compare Insurance home">
        <span>Compare Insurance</span>
      </a>
      <span className="source-status">Independent comparison</span>
    </header>
  );
}

export function Intro() {
  return (
    <section className="intro" aria-labelledby="page-title">
      <div className="intro-copy">
        <p className="eyebrow">Swiss basic health insurance</p>
        <h1 id="page-title">Compare 2027 health-insurance premiums</h1>
        <p className="intro-description">
          Enter five details to see the lowest published premiums for your location.
        </p>
        <p className="premium-update">
          <strong>2027 update:</strong> the average monthly premium is CHF 412, up 5.0%.
          Change requests must arrive by 30 November 2026.{" "}
          <a href="https://www.bag.admin.ch/de/newnsb/BfuGvedj0OOX" target="_blank" rel="noreferrer">BAG source ↗</a>
        </p>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>Prices are shown before subsidies.</p>
      <p>Confirm availability and your final premium with the insurer before switching.</p>
    </footer>
  );
}
