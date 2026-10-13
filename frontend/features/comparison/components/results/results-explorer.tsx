"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { DeductibleLadder } from "../deductible-ladder";
import type { PremiumSearchResponse } from "../../types";
import { ModelComparison } from "./model-comparison";
import { RankedPlans } from "./ranked-plans";

const tabs = [
  { id: "franchise", label: "By franchise" },
  { id: "model", label: "By care model" },
  { id: "offers", label: "Top 10" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ResultsExplorer({ results }: { results: PremiumSearchResponse }) {
  const [activeTab, setActiveTab] = useState<TabId>("franchise");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!(["ArrowLeft", "ArrowRight", "Home", "End"] as string[]).includes(event.key)) return;
    event.preventDefault();
    let next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : index + (event.key === "ArrowRight" ? 1 : -1);
    if (next < 0) next = tabs.length - 1;
    if (next >= tabs.length) next = 0;
    setActiveTab(tabs[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <section className="results-explorer" aria-labelledby="explorer-title">
      <div className="explorer-heading">
        <h3 id="explorer-title">Compare your results</h3>
        <p>See the cheapest match at each franchise or within each care model.</p>
      </div>
      <div className="result-tabs" role="tablist" aria-label="Result views">
        {tabs.map((tab, index) => <button
          aria-controls={`${tab.id}-panel`} aria-selected={activeTab === tab.id}
          id={`${tab.id}-tab`} key={tab.id} onClick={() => setActiveTab(tab.id)}
          onKeyDown={(event) => moveFocus(event, index)} ref={(node) => { tabRefs.current[index] = node; }}
          role="tab" tabIndex={activeTab === tab.id ? 0 : -1} type="button"
        >{tab.label}</button>)}
      </div>
      <div aria-labelledby="franchise-tab" hidden={activeTab !== "franchise"} id="franchise-panel" role="tabpanel" tabIndex={0}>
        <DeductibleLadder offers={results.cheapest_by_deductible} />
      </div>
      <div aria-labelledby="model-tab" hidden={activeTab !== "model"} id="model-panel" role="tabpanel" tabIndex={0}>
        <ModelComparison offers={results.cheapest_by_model} />
      </div>
      <div aria-labelledby="offers-tab" hidden={activeTab !== "offers"} id="offers-panel" role="tabpanel" tabIndex={0}>
        <RankedPlans offers={results.offers} source={results.source_name} />
      </div>
    </section>
  );
}
