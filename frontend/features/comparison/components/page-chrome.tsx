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
      <div className="intro-copy">
        <p className="eyebrow">2027 Swiss basic health insurance</p>
        <h1 id="page-title">Your premium deserves a second look.</h1>
        <p>
          Tell us where you live and what matters to you. Your guide will take
          you through the choices, then compare the official published premiums.
        </p>
        <a className="intro-action" href="#guided-comparison">Check my 2027 premiums <span aria-hidden="true">→</span></a>
      </div>
      <aside className="premium-context" aria-label="Official 2027 premium information">
        <div><strong>5.0%</strong><span>average premium increase for 2027</span></div>
        <div><strong>CHF 412</strong><span>average monthly premium across Switzerland</span></div>
        <p>
          Changing insurer or model for 1 January 2027? Your request must reach
          your insurer by <b>30 November 2026</b>.
        </p>
        <a href="https://www.bag.admin.ch/de/newnsb/BfuGvedj0OOX" target="_blank" rel="noreferrer">Source: FOPH/BAG, 29 September 2026 ↗</a>
      </aside>
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
