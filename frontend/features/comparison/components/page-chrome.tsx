import type { MouseEvent } from "react";

export function SiteHeader({ onRestart }: { onRestart: () => void }) {
  function handleBrandClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) return;

    event.preventDefault();
    onRestart();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  return (
    <header className="site-header">
      <a
        className="brand"
        href="/"
        aria-label="Compare Insurance — start a new comparison"
        onClick={handleBrandClick}
      >
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
        <h1 id="page-title">Compare 2027 health insurance premiums</h1>
        <p className="intro-description">
          Start with what you need: compare your current price, find a new plan or explore every option.
        </p>
      </div>
      <aside className="premium-update" aria-label="2027 premium update">
        <div><strong>+5.0%</strong><span>average premium increase in 2027</span></div>
        <div><strong>CHF 412</strong><span>average monthly premium</span></div>
        <a href="https://www.bag.admin.ch/en/premiums-and-costs-answers-to-frequently-asked-questions" target="_blank" rel="noreferrer">BAG update ↗</a>
      </aside>
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
