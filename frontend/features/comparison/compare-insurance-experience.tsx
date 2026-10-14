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

  return (
    <main id="top">
      <SiteHeader onRestart={flow.restartJourney} />
      {isFirstStep && <Intro />}
      <GuidedAdvisor flow={flow} />
      <ResultsPreview flow={flow} />
      <section className="support-panel" aria-label="Health insurance help">
        <OfficialHelp />
      </section>
      <SiteFooter />
    </main>
  );
}

