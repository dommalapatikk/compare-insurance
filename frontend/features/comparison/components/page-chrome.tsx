export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Compare Insurance home">
        <span className="brand-mark" aria-hidden="true" />
        <span>Compare Insurance</span>
      </a>
      <span className="source-status">Independent comparison · 2027 premiums</span>
    </header>
  );
}

export function Intro() {
  return (
    <section className="intro" aria-labelledby="page-title">
      <p className="eyebrow">Swiss basic health insurance</p>
      <h1 id="page-title">Compare health insurance premiums</h1>
      <p>
        Find the lowest premiums available for your location, deductible and
        insurance model.
      </p>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>Premium data: Federal Office of Public Health (FOPH/BAG), 2027.</p>
      <p>Prices are shown before subsidies. Confirm your final premium with the insurer.</p>
    </footer>
  );
}
