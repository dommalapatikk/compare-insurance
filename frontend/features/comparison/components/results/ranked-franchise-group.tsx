import { modelLabels } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import { officialInsurerWebsite } from "../../insurer-links";
import type { RankedOfferSet } from "../../types";
import { MobileComparisonList } from "./mobile-comparison-list";

function GroupResults({ franchise, ranking }: { franchise: number; ranking: RankedOfferSet }) {
  if (!ranking.offers.length) {
    return <p className="franchise-empty">No published offers match this franchise and insurance model.</p>;
  }

  const mobileItems = ranking.offers.map((offer) => ({
    key: `${offer.rank}-${offer.insurer_id}-${offer.plan_id ?? offer.product_name}`,
    rank: offer.rank,
    eyebrow: modelLabels[offer.insurance_model] || offer.insurance_model,
    premium: Number(offer.monthly_premium_chf),
    insurer: offer.insurer_name,
    plan: offer.product_name,
    model: modelLabels[offer.insurance_model] || offer.insurance_model,
    franchise: offer.deductible_chf,
    difference: offer.rank === 1
      ? undefined
      : `${formatCurrency(Number(offer.monthly_difference_from_cheapest_chf))} more`,
    insurerUrl: officialInsurerWebsite(offer.insurer_id),
    status: offer.rank === 1 ? `Lowest at ${formatDeductible(franchise)}` : undefined,
    best: offer.rank === 1,
  }));

  return <>
    <div className="comparison-scroll">
      <table className="comparison-table ranked-franchise-table">
        <caption>Top premiums with a {formatDeductible(franchise)} franchise</caption>
        <thead><tr>
          <th scope="col">Rank</th>
          <th scope="col">Monthly premium</th>
          <th scope="col">Insurer and plan</th>
          <th scope="col">Insurance model</th>
          <th scope="col">Difference</th>
          <th scope="col"><span className="sr-only">Insurer website</span></th>
        </tr></thead>
        <tbody>{ranking.offers.map((offer) => {
          const insurerUrl = officialInsurerWebsite(offer.insurer_id);
          return <tr className={offer.rank === 1 ? "best-row" : ""} key={`${offer.rank}-${offer.insurer_id}-${offer.plan_id ?? offer.product_name}`}>
            <td>#{offer.rank}</td>
            <td className="money"><strong>{formatCurrency(Number(offer.monthly_premium_chf))}</strong><small>/month</small></td>
            <th scope="row"><strong>{offer.insurer_name}</strong><small>{offer.product_name}</small></th>
            <td>{modelLabels[offer.insurance_model] || offer.insurance_model}</td>
            <td className={offer.rank === 1 ? "difference best" : "difference"}>{offer.rank === 1 ? `Lowest at ${formatDeductible(franchise)}` : `${formatCurrency(Number(offer.monthly_difference_from_cheapest_chf))} more`}</td>
            <td>{insurerUrl
              ? <a className="insurer-link" href={insurerUrl} target="_blank" rel="noopener noreferrer">Visit insurer ↗</a>
              : <span className="link-unavailable">Website unavailable</span>}
            </td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    <MobileComparisonList items={mobileItems} label={`Top premiums at ${formatDeductible(franchise)}`} />
  </>;
}

export function RankedFranchiseGroup({
  franchise,
  ranking,
  collapsible,
  initiallyOpen,
}: {
  franchise: number;
  ranking: RankedOfferSet;
  collapsible: boolean;
  initiallyOpen?: boolean;
}) {
  const lowest = ranking.offers[0];
  const summary = <div className="franchise-summary">
    <strong>{formatDeductible(franchise)} franchise</strong>
    <span>{lowest ? `From ${formatCurrency(Number(lowest.monthly_premium_chf))}/month` : "No matching premiums"}</span>
    <small>Showing {ranking.offers.length} of {ranking.total_eligible_offers} plan{ranking.total_eligible_offers === 1 ? "" : "s"}</small>
  </div>;

  if (!collapsible) {
    return <section className="franchise-group" aria-labelledby={`franchise-${franchise}`}>
      <div className="franchise-group-heading" id={`franchise-${franchise}`}>{summary}</div>
      <p className="franchise-near-note">{ranking.within_five_offer_count} offer{ranking.within_five_offer_count === 1 ? "" : "s"} from {ranking.within_five_insurer_count} insurer{ranking.within_five_insurer_count === 1 ? "" : "s"} are within CHF 5/month of the lowest in this franchise.</p>
      <GroupResults franchise={franchise} ranking={ranking} />
    </section>;
  }

  return <details className="franchise-group" open={initiallyOpen}>
    <summary>{summary}<span aria-hidden="true">⌄</span></summary>
    <div className="franchise-group-content">
      <p className="franchise-near-note">{ranking.within_five_offer_count} offer{ranking.within_five_offer_count === 1 ? "" : "s"} from {ranking.within_five_insurer_count} insurer{ranking.within_five_insurer_count === 1 ? "" : "s"} are within CHF 5/month of the lowest in this franchise.</p>
      <GroupResults franchise={franchise} ranking={ranking} />
    </div>
  </details>;
}
