import { modelChoices, modelLabels } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import type { CategoryMinimum } from "../../types";

function key(deductible: number, model: string) {
  return `${deductible}-${model}`;
}

export function CategoryMatrix({ offers }: { offers: CategoryMinimum[] }) {
  const deductibles = [...new Set(offers.map((offer) => offer.deductible_chf))].sort((a, b) => a - b);
  const presentModels = new Set(offers.map((offer) => offer.insurance_model));
  const models = modelChoices.map(({ value }) => value).filter((value) => presentModels.has(value));
  const cells = new Map(offers.map((offer) => [key(offer.deductible_chf, offer.insurance_model), offer]));

  return (
    <section className="matrix-section" aria-labelledby="matrix-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Compare options</p>
          <h3 id="matrix-title">Lowest premium by deductible and model</h3>
        </div>
        <p>The lowest monthly premium for each selected combination.</p>
      </div>
      <div className="matrix-scroll">
        <table className="matrix-table">
          <caption>Lowest monthly premium by deductible and insurance model</caption>
          <thead><tr><th>Annual deductible</th>{models.map((model) => <th key={model}>{modelLabels[model]}</th>)}</tr></thead>
          <tbody>
            {deductibles.map((deductible) => {
              const rowOffers = models.map((model) => cells.get(key(deductible, model))).filter(Boolean) as CategoryMinimum[];
              const rowMinimum = Math.min(...rowOffers.map((offer) => Number(offer.monthly_premium_chf)));
              return (
                <tr key={deductible}>
                  <th>{formatDeductible(deductible)}</th>
                  {models.map((model) => {
                    const offer = cells.get(key(deductible, model));
                    if (!offer) return <td key={model} className="unavailable">Not offered</td>;
                    const isLowest = Number(offer.monthly_premium_chf) === rowMinimum;
                    return (
                      <td key={model} className={isLowest ? "cell-lowest" : ""}>
                        {isLowest && <b className="best-label">Lowest</b>}
                        <strong>{formatCurrency(Number(offer.monthly_premium_chf))}</strong>
                        <span>{offer.insurer_name}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="matrix-mobile" aria-label="Lowest monthly premiums by deductible and model">
        {deductibles.map((deductible) => {
          const rowOffers = models.map((model) => cells.get(key(deductible, model))).filter(Boolean) as CategoryMinimum[];
          const rowMinimum = Math.min(...rowOffers.map((offer) => Number(offer.monthly_premium_chf)));
          return (
            <details key={deductible}>
              <summary>{formatDeductible(deductible)} deductible</summary>
              <div>
                {models.map((model) => {
                  const offer = cells.get(key(deductible, model));
                  return <article key={model}>
                    <span>{modelLabels[model]}</span>
                    {offer ? <><strong>{formatCurrency(Number(offer.monthly_premium_chf))}</strong><small>{offer.insurer_name}{Number(offer.monthly_premium_chf) === rowMinimum ? " · Lowest" : ""}</small></> : <small>Not offered</small>}
                  </article>;
                })}
              </div>
            </details>
          );
        })}
      </div>
      <p className="matrix-note">
        Premiums only. A higher deductible can mean paying more yourself when you need care.
      </p>
    </section>
  );
}
