const CH_COSTS = "https://www.ch.ch/en/health/health-insurance/health-insurance-costs/";
const BAG_MODELS = "https://www.bag.admin.ch/de/krankenversicherung-versicherungsmodelle-mit-eingeschraenkter-wahl-der-leistungserbringer";
const PRIMINFO = "https://www.priminfo.admin.ch/de/praemien/";
const BAG_2027 = "https://www.bag.admin.ch/de/newnsb/BfuGvedj0OOX";
const answers = [
  {
    question: "What changed in 2027?",
    answer:
      "The average monthly premium is CHF 412, which is 5.0% higher than in 2026. To change insurer or insurance model for 1 January 2027, your request must generally reach your insurer by 30 November 2026.",
    source: BAG_2027,
    sourceLabel: "BAG",
  },
  {
    question: "What is a franchise?",
    answer:
      "The franchise is the amount you pay each year towards covered healthcare before basic insurance starts contributing. Adults can choose CHF 300, 500, 1,000, 1,500, 2,000 or 2,500.",
    source: CH_COSTS,
    sourceLabel: "CH.CH",
  },
  {
    question: "Does a higher franchise always save money?",
    answer:
      "It lowers your premium but can increase what you pay when you need care. With a CHF 2,500 franchise, an adult may pay up to CHF 3,200 for the franchise and co-payment, plus any hospital contribution.",
    source: CH_COSTS,
    sourceLabel: "CH.CH",
  },
  {
    question: "Can I exclude accident cover?",
    answer:
      "If you work at least 8 hours a week for the same employer, you are generally covered for non-work accidents through your employer. Check your coverage before excluding it.",
    source: CH_COSTS,
    sourceLabel: "CH.CH",
  },
  {
    question: "What does the family-doctor model mean?",
    answer:
      "For 2027, family-doctor and HMO plans are grouped under PRAXIS. You agree to contact a designated doctor or medical practice first. That practice coordinates further treatment and referrals. The exact rules differ by plan, so check them before choosing.",
    source: BAG_MODELS,
    sourceLabel: "BAG",
  },
  {
    question: "Why do you only ask for birth year?",
    answer:
      "Basic-insurance premiums use the official child, young-adult and adult categories. We derive the category from your birth year. Gender is not a pricing filter in the official basic-insurance premium calculator.",
    source: PRIMINFO,
    sourceLabel: "Priminfo",
  },
];

export function OfficialHelp() {
  return (
    <section className="official-help" aria-labelledby="help-title">
      <div className="section-heading">
        <div><h2 id="help-title">Understand your choices</h2><p>Short answers from official Swiss sources.</p></div>
      </div>
      <div className="faq-list">
        {answers.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>
              {item.answer}{" "}
              <a href={item.source} target="_blank" rel="noreferrer">
                {item.sourceLabel} ↗
              </a>
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
