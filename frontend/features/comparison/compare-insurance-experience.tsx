"use client";

import { GuidedAdvisor } from "./components/guided-advisor";
import { OfficialHelp } from "./components/official-help";
import { Intro, SiteFooter, SiteHeader } from "./components/page-chrome";
import { ResultsPreview } from "./components/results-preview";
import { useComparisonFlow } from "./use-comparison-flow";
import { useDeploymentRefresh } from "./use-deployment-refresh";

export function CompareInsuranceExperience() {
  useDeploymentRefresh();
  const flow = useComparisonFlow();
  const isFirstStep = flow.journeyStage === "location" && !flow.location;
  const hasResults = Boolean(flow.results?.offers.length);

  return (
    <main id="top">
      <SiteHeader />
      {isFirstStep && <Intro />}
      <GuidedAdvisor flow={flow} />
      <ResultsPreview flow={flow} />
      {hasResults && <section className="support-panel" aria-label="Health insurance help">
        <details className="support-disclosure">
          <summary>Questions about your choices</summary>
          <OfficialHelp />
        </details>
      </section>}
      <SiteFooter />
    </main>
  );
}

