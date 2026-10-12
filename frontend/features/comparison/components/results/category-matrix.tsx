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
          <p className="eyebrow">Cheapest by category</p>
          <h3 id="matrix-title">Compare franchise and model</h3>
        </div>
        <p>Each cell is the lowest approved premium for that exact combination.</p>
      </div>
      <div className="matrix-scroll">
        <table className="matrix-table">
          <caption>Lowest monthly premium by franchise and insurance model</caption>
          <thead><tr><th>Franchise</th>{models.map((model) => <th key={model}>{modelLabels[model]}</th>)}</tr></thead>
          <tbody>
            {deductibles.map((deductible) => {
              const rowOffers = models.map((model) => cells.get(key(deductible, model))).filter(Boolean) as CategoryMinimum[];
              const rowMinimum = Math.min(...rowOffers.map((offer) => Number(offer.monthly_premium_chf)));
              return (
                <tr key={deductible}>
                  <th>{formatDeductible(deductible)}</th>
                  {models.map((model) => {
                    const offer = cells.get(key(deductible, model));
                    if (!offer) return <td key={model} className="unavailable">—</td>;
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
      <p className="matrix-note">
        Premium only. A higher franchise may increase your out-of-pocket costs when you use care.
      </p>
    </section>
  );
}
