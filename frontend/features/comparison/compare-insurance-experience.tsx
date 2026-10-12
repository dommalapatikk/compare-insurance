"use client";

import { GuideChat } from "./components/guide-chat";
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
      <div className="support-grid">
        <OfficialHelp />
        <GuideChat flow={flow} />
      </div>
      <SiteFooter />
    </main>
  );
}

