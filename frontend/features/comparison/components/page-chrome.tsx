export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Compare Insurance home">
        <span className="brand-mark" aria-hidden="true" />
        <span>Compare Insurance</span>
      </a>
      <span className="source-status">Basic insurance · 2027</span>
    </header>
  );
}

export function Intro() {
  return (
    <section className="intro" aria-labelledby="page-title">
      <div className="intro-copy">
        <p className="eyebrow">Swiss health insurance</p>
        <h1 id="page-title">Compare health insurance premiums</h1>
        <p className="intro-description">
          Enter your postcode and preferences to see the lowest published premiums matching your choices.
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
