"use client";

import { useMemo, useState } from "react";

import { modelLabels } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import type { JourneyIntent } from "../../journey-machine";
import { explainSavings } from "../../result-view-model";
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

export function ResultsExplorer({
  results,
  intent,
  currentPremium,
}: {
  results: PremiumSearchResponse;
  intent: JourneyIntent | null;
  currentPremium: string;
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
  const savings = intent === "compare_current" && results.offers[0]
    ? explainSavings(results.offers[0], currentPremium)
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

      {savings && <div className="current-comparison" role="status">
        <strong>{formatCurrency(Number(results.offers[0].monthly_premium_chf))}/month is the lowest with the same setup.</strong>
        <span>{savings.monthlyDifference} {savings.relation} per month · {savings.annualDifference} {savings.relation} per year than {savings.baseline}.</span>
      </div>}

      <div className="result-filters" aria-label="Filter comparison results">
        <label>
          <span>Franchise</span>
          <select value={deductible} onChange={(event) => setDeductible(event.target.value === ALL ? ALL : Number(event.target.value))}>
            <option value={ALL}>All franchises</option>
            {groups.map((group) => <option key={group.deductible_chf} value={group.deductible_chf}>{formatDeductible(group.deductible_chf)}</option>)}
          </select>
        </label>
        <label>
          <span>Insurance model</span>
          <select value={model} onChange={(event) => setModel(event.target.value)}>
            <option value={ALL}>All models</option>
            {results.query.insurance_models.map((value) => <option key={value} value={value}>{modelLabels[value] || value}</option>)}
          </select>
        </label>
        <p className="result-count" aria-live="polite">{totalResults} eligible plan{totalResults === 1 ? "" : "s"}</p>
      </div>

      <p className="selection-summary"><strong>Franchise:</strong> {deductible === ALL ? "All franchises" : formatDeductible(deductible)} <span>·</span> <strong>Insurance model:</strong> {model === ALL ? "All models" : modelLabels[model] || model}</p>
      <p className="comparison-guidance">{deductible === ALL
        ? "Each franchise has its own ranking. A higher franchise can lower the premium but increases what you may pay yourself, so compare within each group."
        : `Every result uses a ${formatDeductible(deductible)} franchise, so the premiums can be compared directly.`}</p>

      {!groups.length && <p className="result-state error">Grouped top-10 results are unavailable. Refresh after the latest comparison service is deployed.</p>}
      <div className="franchise-groups">
        {visibleGroups.map((group, index) => <RankedFranchiseGroup
          key={`${group.deductible_chf}-${model}`}
          franchise={group.deductible_chf}
          ranking={group.selectedRanking}
          collapsible={deductible === ALL}
          initiallyOpen={index === 0}
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
