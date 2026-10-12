"use client";

import { ComparisonGuide } from "./components/comparison-guide";
import { ComparisonSummary } from "./components/comparison-summary";
import { Hero, SiteFooter, SiteHeader } from "./components/page-chrome";
import { ResultsPreview } from "./components/results-preview";
import { useComparisonFlow } from "./use-comparison-flow";

export function CompareInsuranceExperience() {
  const flow = useComparisonFlow();

  return (
    <main id="top">
      <SiteHeader />
      <Hero />
      <section className="workspace" aria-label="Guided insurance comparison">
        <ComparisonGuide flow={flow} />
        <ComparisonSummary flow={flow} />
      </section>
      <ResultsPreview flow={flow} />
      <SiteFooter />
    </main>
  );
}

