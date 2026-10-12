export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Compare Insurance home">
        <span className="brand-mark" aria-hidden="true"><span /></span>
        <span>Compare Insurance</span>
      </a>
      <div className="header-meta">
        <span className="data-dot" aria-hidden="true" />
        Data files validated · price search not yet available
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="hero" aria-labelledby="page-title">
      <div>
        <p className="eyebrow">Swiss compulsory health insurance</p>
        <h1 id="page-title">A clearer route to a lower premium.</h1>
        <p className="hero-lede">
          Answer six guided questions. The LangChain guide explains each choice,
          while validated controls keep pricing inputs precise.
        </p>
      </div>
      <dl className="dataset-strip" aria-label="Dataset summary">
        <div><dt>Records</dt><dd>219,916</dd></div>
        <div><dt>Premium year</dt><dd>2027</dd></div>
        <div><dt>Publisher</dt><dd>BAG</dd></div>
      </dl>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>Compare Insurance · Neutral comparison concept for Swiss compulsory basic insurance</p>
      <p>Prices will be sourced from validated BAG data. Always confirm terms with the insurer.</p>
    </footer>
  );
}

