"use client";

import { AskQuestion } from "./components/ask-question";
import { OfficialHelp } from "./components/official-help";
import { Intro, SiteFooter, SiteHeader } from "./components/page-chrome";
import { QuickProfileForm } from "./components/quick-profile-form";
import { ResultsPreview } from "./components/results-preview";
import { useComparisonFlow } from "./use-comparison-flow";

export function CompareInsuranceExperience() {
  const flow = useComparisonFlow();

  return (
    <main id="top">
      <SiteHeader />
      <Intro />
      <QuickProfileForm flow={flow} />
      <ResultsPreview flow={flow} />
      <section className="support-panel" aria-label="Health insurance help">
        <OfficialHelp />
        <AskQuestion flow={flow} />
      </section>
      <SiteFooter />
    </main>
  );
}

