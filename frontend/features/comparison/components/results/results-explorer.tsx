"use client";

import { useMemo, useState } from "react";

import { modelLabels } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import { officialInsurerWebsite } from "../../insurer-links";
import { differenceFromLowest, filterAndSortMinimums } from "../../result-view-model";
import type { PremiumSearchResponse } from "../../types";
import { MobileComparisonList } from "./mobile-comparison-list";

const ALL = "all";

function uniqueNumbers(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

function uniqueModels(values: string[]) {
  return [...new Set(values)].sort((left, right) => (
    (modelLabels[left] || left).localeCompare(modelLabels[right] || right)
  ));
}

export function ResultsExplorer({ results }: { results: PremiumSearchResponse }) {
  const [deductible, setDeductible] = useState<typeof ALL | number>(ALL);
  const [model, setModel] = useState<typeof ALL | string>(ALL);
  const sourceOffers = results.cheapest_by_deductible_and_model;
  const deductibles = useMemo(
    () => uniqueNumbers(sourceOffers.map((offer) => offer.deductible_chf)),
    [sourceOffers],
  );
  const models = useMemo(
    () => uniqueModels(sourceOffers.map((offer) => offer.insurance_model)),
    [sourceOffers],
  );
  const offers = useMemo(
    () => filterAndSortMinimums(sourceOffers, { deductible, model }),
    [deductible, model, sourceOffers],
  );
  const lowest = offers[0];
  const sameFranchise = deductible !== ALL;
  const withinFive = sameFranchise
    ? offers.filter((offer) => differenceFromLowest(offer, lowest) <= 5)
    : [];
  const withinFiveInsurers = new Set(withinFive.map((offer) => offer.insurer_id)).size;

  const mobileItems = offers.map((offer, index) => {
    const difference = differenceFromLowest(offer, lowest);
    const status = index === 0
      ? "Lowest in this view"
      : sameFranchise && difference <= 5
        ? "Within CHF 5/month"
        : undefined;
    return {
      key: `${offer.deductible_chf}-${offer.insurance_model}-${offer.insurer_id}-${offer.plan_id ?? offer.product_name}`,
      eyebrow: modelLabels[offer.insurance_model] || offer.insurance_model,
      premium: Number(offer.monthly_premium_chf),
      insurer: offer.insurer_name,
      plan: offer.product_name,
      model: modelLabels[offer.insurance_model] || offer.insurance_model,
      franchise: offer.deductible_chf,
      difference: index === 0 ? undefined : `${formatCurrency(difference)} more`,
      insurerUrl: officialInsurerWebsite(offer.insurer_id),
      status,
      best: index === 0,
    };
  });

  return (
    <section className="results-explorer" aria-labelledby="explorer-title">
      <div className="explorer-heading">
        <div>
          <h3 id="explorer-title">Compare premiums</h3>
          <p>Lowest matching plan for every selected franchise and insurance model.</p>
        </div>
        <span>{results.source_year} · Before subsidies</span>
      </div>

      <div className="result-filters" aria-label="Filter comparison results">
        <label>
          <span>Franchise</span>
          <select
            value={deductible}
            onChange={(event) => setDeductible(event.target.value === ALL ? ALL : Number(event.target.value))}
          >
            <option value={ALL}>All franchises</option>
            {deductibles.map((value) => <option key={value} value={value}>{formatDeductible(value)}</option>)}
          </select>
        </label>
        <label>
          <span>Insurance model</span>
          <select value={model} onChange={(event) => setModel(event.target.value)}>
            <option value={ALL}>All models</option>
            {models.map((value) => <option key={value} value={value}>{modelLabels[value] || value}</option>)}
          </select>
        </label>
        <p className="result-count" aria-live="polite">{offers.length} matching combination{offers.length === 1 ? "" : "s"}</p>
      </div>

      <p className="comparison-guidance">
        {sameFranchise
          ? `${withinFive.length} matching combination${withinFive.length === 1 ? "" : "s"} from ${withinFiveInsurers} insurer${withinFiveInsurers === 1 ? "" : "s"} ${withinFive.length === 1 ? "is" : "are"} within CHF 5/month of the lowest. CHF 5/month is CHF 60/year.`
          : "Sorted by monthly premium. A higher franchise can lower the premium but increase what you pay yourself when you need care."}
      </p>

      <div className="comparison-scroll">
        <table className="comparison-table unified-results-table">
          <caption>Lowest matching premium for each franchise and insurance model</caption>
          <thead><tr>
            <th scope="col">Monthly premium</th>
            <th scope="col">Insurer and plan</th>
            <th scope="col">Insurance model</th>
            <th scope="col">Franchise</th>
            <th scope="col">Comparison</th>
            <th scope="col"><span className="sr-only">Insurer website</span></th>
          </tr></thead>
          <tbody>{offers.map((offer, index) => {
            const difference = differenceFromLowest(offer, lowest);
            const insurerUrl = officialInsurerWebsite(offer.insurer_id);
            return <tr className={index === 0 ? "best-row" : ""} key={`${offer.deductible_chf}-${offer.insurance_model}-${offer.insurer_id}-${offer.plan_id ?? offer.product_name}`}>
              <td className="money"><strong>{formatCurrency(Number(offer.monthly_premium_chf))}</strong><small>/month</small></td>
              <th scope="row"><strong>{offer.insurer_name}</strong><small>{offer.product_name}</small></th>
              <td>{modelLabels[offer.insurance_model] || offer.insurance_model}</td>
              <td>{formatDeductible(offer.deductible_chf)}</td>
              <td className={index === 0 ? "difference best" : "difference"}>
                {index === 0
                  ? "Lowest in this view"
                  : sameFranchise && difference <= 5
                    ? "Within CHF 5/month"
                    : `${formatCurrency(difference)} more`}
              </td>
              <td>{insurerUrl
                ? <a className="insurer-link" href={insurerUrl} target="_blank" rel="noopener noreferrer">Visit insurer ↗</a>
                : <span className="link-unavailable">Website unavailable</span>}
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>

      <MobileComparisonList items={mobileItems} label="Filtered premium comparison" />

      <div className="comparison-source">
        <span>Official BAG premium data · {results.source_year}</span>
        <a href="https://www.priminfo.admin.ch/" target="_blank" rel="noopener noreferrer">Verify on Priminfo ↗</a>
      </div>
      <p className="insurer-link-note">Insurer links open the company website. Confirm the exact plan, eligibility and final premium there before switching.</p>
    </section>
  );
}
