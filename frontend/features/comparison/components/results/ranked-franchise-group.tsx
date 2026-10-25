import { useEffect, useRef, useState } from "react";

import { modelLabels } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import { officialInsurerShortName, officialInsurerWebsite } from "../../insurer-links";
import {
  duplicatePraxisPlanNote,
  logGenericPraxisPlan,
  planDisplayName,
  praxisSubtype,
} from "../../plan-presentation";
import type { PraxisSubtype } from "../../plan-presentation";
import { compareOfferWithCurrentPremium, nearbyOfferSentence, shouldShowCurrentPlanDifferenceColumn } from "../../result-view-model";
import type { RankedOfferSet } from "../../types";
import { MobileComparisonList } from "./mobile-comparison-list";

function GroupResults({ franchise, model, ranking, isLoadingMorePlans, onLoadMorePlans, currentInsurerId, currentPremium, highlightedInsurerId }: {
  franchise: number;
  model: string;
  ranking: RankedOfferSet;
  isLoadingMorePlans: boolean;
  onLoadMorePlans: (franchise: number, model: string) => Promise<void>;
  currentInsurerId: string;
  currentPremium: string;
  highlightedInsurerId: string;
}) {
  const hadMorePlans = useRef(ranking.offers.length < ranking.total_eligible_offers);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    ranking.offers.forEach((offer) => {
      if (offer.insurance_model === "praxis" && praxisSubtype(offer.product_name) === "Doctor network") {
        logGenericPraxisPlan(offer.product_name);
      }
    });
  }, [ranking.offers]);

  if (!ranking.offers.length) {
    return <p className="franchise-empty">No published offers match this franchise and insurance model.</p>;
  }

  const allPlansShown = ranking.offers.length >= ranking.total_eligible_offers;
  const statusId = `plans-status-${franchise}-${model}`;
  const showCurrentDifference = shouldShowCurrentPlanDifferenceColumn(ranking.offers, currentPremium);
  const praxisSubtypesByInsurer = new Map<string, PraxisSubtype[]>();
  for (const offer of ranking.offers) {
    if (offer.insurance_model !== "praxis") continue;
    const subtypes = praxisSubtypesByInsurer.get(offer.insurer_id) ?? [];
    subtypes.push(praxisSubtype(offer.product_name));
    praxisSubtypesByInsurer.set(offer.insurer_id, subtypes);
  }
  const insurerOccurrences = new Map<string, number>();
  const presentations = ranking.offers.map((offer) => {
    const insurerShortName = officialInsurerShortName(offer.insurer_id, offer.insurer_name);
    const subtype = offer.insurance_model === "praxis"
      ? praxisSubtype(offer.product_name)
      : undefined;
    const occurrence = offer.insurance_model === "praxis"
      ? (insurerOccurrences.get(offer.insurer_id) ?? 0) + 1
      : 0;
    if (offer.insurance_model === "praxis") insurerOccurrences.set(offer.insurer_id, occurrence);
    const duplicateSubtypes = praxisSubtypesByInsurer.get(offer.insurer_id) ?? [];
    return {
      insurerShortName,
      planName: planDisplayName({
        insuranceModel: offer.insurance_model,
        legalInsurerName: offer.insurer_name,
        productName: offer.product_name,
        shortInsurerName: insurerShortName,
      }),
      subtype,
      groupNote: occurrence === 2 && duplicateSubtypes.length > 1
        ? duplicatePraxisPlanNote(insurerShortName, duplicateSubtypes)
        : undefined,
    };
  });

  async function loadMore() {
    if (isLoadingMorePlans || allPlansShown) return;
    setLoadError("");
    try {
      await onLoadMorePlans(franchise, model);
    } catch (error) {
      setLoadError(error instanceof Error
        ? error.message
        : "We couldn't load more premiums right now. Please try again.");
    }
  }

  const mobileItems = ranking.offers.map((offer, index) => {
    const currentComparison = showCurrentDifference
      ? compareOfferWithCurrentPremium(offer, currentPremium)
      : null;
    const presentation = presentations[index];
    return {
      key: `${offer.rank}-${offer.insurer_id}-${offer.plan_id ?? offer.product_name}`,
      rank: offer.rank,
      eyebrow: modelLabels[offer.insurance_model] || offer.insurance_model,
      premium: Number(offer.monthly_premium_chf),
      insurer: presentation.insurerShortName,
      plan: presentation.planName,
      model: modelLabels[offer.insurance_model] || offer.insurance_model,
      modelSubtype: presentation.subtype,
      franchise: offer.deductible_chf,
      difference: offer.rank === 1
        ? undefined
        : `${formatCurrency(Number(offer.monthly_difference_from_cheapest_chf))} more`,
      insurerUrl: officialInsurerWebsite(offer.insurer_id),
      status: offer.rank === 1 ? `Lowest at ${formatDeductible(franchise)}` : undefined,
      best: offer.rank === 1,
      currentInsurer: offer.insurer_id === currentInsurerId,
      currentComparison: currentComparison
        ? { label: currentComparison.label, tone: currentComparison.tone }
        : undefined,
      highlighted: offer.insurer_id === highlightedInsurerId,
      insurerId: offer.insurer_id,
      groupNote: presentation.groupNote,
    };
  });

  return <>
    <div className="comparison-scroll">
      <table className={`comparison-table ranked-franchise-table${showCurrentDifference ? " with-current-premium" : ""}`}>
        <caption>Top premiums with a {formatDeductible(franchise)} franchise</caption>
        <thead><tr>
          <th scope="col">Rank</th>
          <th scope="col">Monthly premium</th>
          <th scope="col">Insurer and plan</th>
          <th scope="col">Insurance model</th>
          <th scope="col">Vs cheapest</th>
          {showCurrentDifference && <th scope="col">Vs your current plan</th>}
          <th scope="col"><span className="sr-only">Insurer website</span></th>
        </tr></thead>
        <tbody>{ranking.offers.map((offer, index) => {
          const insurerUrl = officialInsurerWebsite(offer.insurer_id);
          const currentComparison = showCurrentDifference
            ? compareOfferWithCurrentPremium(offer, currentPremium)
            : null;
          const presentation = presentations[index];
          const rowClasses = [offer.rank === 1 ? "best-row" : "", offer.insurer_id === highlightedInsurerId ? "highlighted-offer" : ""].filter(Boolean).join(" ");
          return <tr className={rowClasses} data-offer-insurer={offer.insurer_id} tabIndex={-1} key={`${offer.rank}-${offer.insurer_id}-${offer.plan_id ?? offer.product_name}`}>
            <td>#{offer.rank}</td>
            <td className="money"><strong>{formatCurrency(Number(offer.monthly_premium_chf))}</strong><small>/month</small></td>
            <th scope="row"><strong>{presentation.insurerShortName}</strong>{offer.insurer_id === currentInsurerId && <em className="current-insurer-badge">Your insurer</em>}{presentation.planName && <small>{presentation.planName}</small>}{presentation.groupNote && <small className="duplicate-plan-note">ⓘ {presentation.groupNote}</small>}</th>
            <td>{modelLabels[offer.insurance_model] || offer.insurance_model}{presentation.subtype && <small className="model-subtype">{presentation.subtype}</small>}</td>
            <td className={offer.rank === 1 ? "difference best" : "difference"}>{offer.rank === 1 ? `Lowest at ${formatDeductible(franchise)}` : `${formatCurrency(Number(offer.monthly_difference_from_cheapest_chf))} more`}</td>
            {currentComparison && <td className={`current-plan-difference ${currentComparison.tone}`}>{currentComparison.label}</td>}
            <td>{insurerUrl
              ? <a className="insurer-link" href={insurerUrl} target="_blank" rel="noopener noreferrer" title={`Visit ${presentation.insurerShortName} (${offer.insurer_name}) website`} aria-label={`Visit ${presentation.insurerShortName} (${offer.insurer_name}) website`}>Visit insurer ↗</a>
              : <span className="link-unavailable">Website unavailable</span>}
            </td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    <MobileComparisonList items={mobileItems} label={`Top premiums at ${formatDeductible(franchise)}`} showFranchise={false} />
    {hadMorePlans.current && <button
      className="show-all-plans"
      aria-disabled={isLoadingMorePlans || allPlansShown}
      aria-describedby={loadError ? statusId : undefined}
      aria-live="polite"
      onClick={() => void loadMore()}
      type="button"
    >{allPlansShown
        ? `All ${ranking.total_eligible_offers} plans shown`
        : isLoadingMorePlans
          ? "Loading more plans…"
          : `Show ${Math.min(10, ranking.total_eligible_offers - ranking.offers.length)} more`}</button>}
    {loadError && <p className="plans-page-error" id={statusId} role="status">{loadError}</p>}
  </>;
}

export function RankedFranchiseGroup({
  franchise,
  model,
  ranking,
  collapsible,
  initiallyOpen,
  isLoadingMorePlans,
  onLoadMorePlans,
  currentInsurerId,
  currentPremium,
  highlightedInsurerId,
}: {
  franchise: number;
  model: string;
  ranking: RankedOfferSet;
  collapsible: boolean;
  initiallyOpen?: boolean;
  isLoadingMorePlans: boolean;
  onLoadMorePlans: (franchise: number, model: string) => Promise<void>;
  currentInsurerId: string;
  currentPremium: string;
  highlightedInsurerId: string;
}) {
  const lowest = ranking.offers[0];
  const summary = <span className="franchise-summary">
    <strong>{formatDeductible(franchise)} franchise</strong>
    <span>{lowest ? `From ${formatCurrency(Number(lowest.monthly_premium_chf))}/month` : "No matching premiums"}</span>
    <small>Showing {ranking.offers.length} of {ranking.total_eligible_offers} plan{ranking.total_eligible_offers === 1 ? "" : "s"}</small>
  </span>;

  if (!collapsible) {
    return <section className="franchise-group" aria-labelledby={`franchise-${franchise}`}>
      <div className="franchise-group-heading" id={`franchise-${franchise}`}>{summary}</div>
      <p className="franchise-near-note">{nearbyOfferSentence(ranking.within_five_offer_count, ranking.within_five_insurer_count)}</p>
      <GroupResults franchise={franchise} model={model} ranking={ranking} isLoadingMorePlans={isLoadingMorePlans} onLoadMorePlans={onLoadMorePlans} currentInsurerId={currentInsurerId} currentPremium={currentPremium} highlightedInsurerId={highlightedInsurerId} />
    </section>;
  }

  return <details className="franchise-group" open={initiallyOpen}>
    <summary>{summary}<span aria-hidden="true">⌄</span></summary>
    <div className="franchise-group-content">
      <p className="franchise-near-note">{nearbyOfferSentence(ranking.within_five_offer_count, ranking.within_five_insurer_count)}</p>
      <GroupResults franchise={franchise} model={model} ranking={ranking} isLoadingMorePlans={isLoadingMorePlans} onLoadMorePlans={onLoadMorePlans} currentInsurerId={currentInsurerId} currentPremium={currentPremium} highlightedInsurerId={highlightedInsurerId} />
    </div>
  </details>;
}
