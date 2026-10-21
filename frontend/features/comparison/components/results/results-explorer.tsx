"use client";

import { useMemo, useState } from "react";

import { modelLabels } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import type { JourneyIntent } from "../../journey-machine";
import { buildCurrentPremiumMessage } from "../../result-view-model";
import type { PremiumSearchResponse, RankedDeductibleGroup } from "../../types";
import { RankedFranchiseGroup } from "./ranked-franchise-group";

const ALL = "all";

function rankingFor(group: RankedDeductibleGroup, model: string) {
  if (model === ALL) return group.all_selected_models;
  return group.models.find((item) => item.insurance_model === model)?.ranking ?? {
    total_eligible_offers: 0,
    within_five_offer_count: 0,
    within_five_insurer_count: 0,
    offers: [],
  };
}

function FilterFields({
  deductible,
  groups,
  model,
  models,
  onDeductibleChange,
  onModelChange,
  totalResults,
}: {
  deductible: typeof ALL | number;
  groups: RankedDeductibleGroup[];
  model: typeof ALL | string;
  models: string[];
  onDeductibleChange: (value: typeof ALL | number) => void;
  onModelChange: (value: string) => void;
  totalResults: number;
}) {
  return <div className="result-filter-fields">
    <label>
      <span>Franchise</span>
      <select value={deductible} onChange={(event) => onDeductibleChange(event.target.value === ALL ? ALL : Number(event.target.value))}>
        <option value={ALL}>All franchises</option>
        {groups.map((group) => <option key={group.deductible_chf} value={group.deductible_chf}>{formatDeductible(group.deductible_chf)}</option>)}
      </select>
    </label>
    <label>
      <span>Insurance model</span>
      <select value={model} onChange={(event) => onModelChange(event.target.value)}>
        <option value={ALL}>All models</option>
        {models.map((value) => <option key={value} value={value}>{modelLabels[value] || value}</option>)}
      </select>
    </label>
    <p className="result-count" aria-live="polite">{totalResults} eligible plan{totalResults === 1 ? "" : "s"}</p>
  </div>;
}

export function ResultsExplorer({
  results,
  intent,
  currentPremium,
  currentInsurerId,
  currentInsurerName,
  loadingPlansKey,
  onLoadMorePlans,
}: {
  results: PremiumSearchResponse;
  intent: JourneyIntent | null;
  currentPremium: string;
  currentInsurerId: string;
  currentInsurerName: string;
  loadingPlansKey: string | null;
  onLoadMorePlans: (franchise: number, model: string) => Promise<void>;
}) {
  const groups = results.ranked_by_deductible ?? [];
  const [deductible, setDeductible] = useState<typeof ALL | number>(
    groups.length === 1 ? groups[0].deductible_chf : ALL,
  );
  const [model, setModel] = useState<typeof ALL | string>(
    results.query.insurance_models.length === 1 ? results.query.insurance_models[0] : ALL,
  );
  const visibleGroups = useMemo(
    () => groups
      .filter((group) => deductible === ALL || group.deductible_chf === deductible)
      .map((group) => ({ ...group, selectedRanking: rankingFor(group, model) })),
    [deductible, groups, model],
  );
  const totalResults = visibleGroups.reduce(
    (sum, group) => sum + group.selectedRanking.total_eligible_offers,
    0,
  );
  const currentComparison = intent === "compare_current" && results.offers[0]
    ? buildCurrentPremiumMessage(results.offers[0], currentPremium, currentInsurerName)
    : null;

  return (
    <section className="results-explorer" aria-labelledby="explorer-title">
      <div className="explorer-heading">
        <div>
          <h3 id="explorer-title">Compare premiums</h3>
          <p>True lowest offers for the franchises and insurance models you selected.</p>
        </div>
        <span>{results.source_year} · Before subsidies</span>
      </div>

      {currentComparison && <div className={`current-comparison ${currentComparison.tone}`} role="status">
        <strong>{currentComparison.title}</strong>
        <span>{currentComparison.detail}</span>
      </div>}

      {intent !== "compare_current" && <>
        <div className="result-filters desktop-result-filters" aria-label="Filter comparison results">
          <FilterFields deductible={deductible} groups={groups} model={model} models={results.query.insurance_models} onDeductibleChange={setDeductible} onModelChange={setModel} totalResults={totalResults} />
        </div>
        <details className="mobile-result-filters">
          <summary>Filters <span>{deductible === ALL ? "All franchises" : formatDeductible(deductible)} · {model === ALL ? "All models" : modelLabels[model] || model}</span></summary>
          <FilterFields deductible={deductible} groups={groups} model={model} models={results.query.insurance_models} onDeductibleChange={setDeductible} onModelChange={setModel} totalResults={totalResults} />
        </details>
      </>}

      {intent !== "compare_current" && <p className="selection-summary"><strong>Franchise:</strong> {deductible === ALL ? "All franchises" : formatDeductible(deductible)} <span>·</span> <strong>Insurance model:</strong> {model === ALL ? "All models" : modelLabels[model] || model}</p>}
      <p className="comparison-guidance">{deductible === ALL
        ? "Each franchise has its own ranking. A higher franchise can lower the premium but increases what you may pay yourself, so compare within each group."
        : `Every result uses a ${formatDeductible(deductible)} franchise, so the premiums can be compared directly.`}</p>

      {!groups.length && <p className="result-state error">Grouped results are unavailable. Please refresh and try again.</p>}
      <div className="franchise-groups">
        {visibleGroups.map((group, index) => <RankedFranchiseGroup
          key={`${group.deductible_chf}-${model}`}
          franchise={group.deductible_chf}
          model={model}
          ranking={group.selectedRanking}
          collapsible={deductible === ALL}
          initiallyOpen={index === 0}
          isLoadingMorePlans={loadingPlansKey === `${group.deductible_chf}:${model}`}
          onLoadMorePlans={onLoadMorePlans}
          currentInsurerId={currentInsurerId}
        />)}
      </div>

      <div className="comparison-source">
        <span>Official BAG premium data · {results.source_year}</span>
        <a href="https://www.priminfo.admin.ch/" target="_blank" rel="noopener noreferrer">Verify on Priminfo ↗</a>
      </div>
      <p className="insurer-link-note">Insurer links open the company website. Confirm the exact plan, eligibility and final premium there before switching.</p>
    </section>
  );
}
