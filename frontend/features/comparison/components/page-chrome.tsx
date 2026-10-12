export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Compare Insurance home">
        <span className="brand-mark" aria-hidden="true" />
        <span>Compare Insurance</span>
      </a>
      <span className="source-status"><i /> BAG 2027 · validated data</span>
    </header>
  );
}

export function Intro() {
  return (
    <section className="intro" aria-labelledby="page-title">
      <p className="eyebrow">Swiss compulsory basic insurance</p>
      <h1 id="page-title">Find your lowest premium.</h1>
      <p>
        Compare approved premiums across franchises and insurance models. No sign-up,
        no gender, no invented prices.
      </p>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>Premiums: Swiss Federal Office of Public Health (BAG), 2027.</p>
      <p>Informational comparison only. Confirm availability and model rules with the insurer.</p>
    </footer>
  );
}
