const CH_COSTS = "https://www.ch.ch/en/health/health-insurance/health-insurance-costs/";

const answers = [
  {
    question: "What is a deductible (franchise)?",
    answer:
      "The deductible is the amount you pay each year towards covered healthcare before basic insurance starts contributing. Adults can choose CHF 300, 500, 1,000, 1,500, 2,000 or 2,500.",
  },
  {
    question: "Is a higher deductible always cheaper?",
    answer:
      "It lowers your premium but can increase what you pay when you need care. With a CHF 2,500 deductible, an adult may pay up to CHF 3,200 for the deductible and co-payment, plus any hospital contribution.",
  },
  {
    question: "Can I exclude accident cover?",
    answer:
      "If you work at least 8 hours a week for the same employer, you are generally covered for non-work accidents through your employer. Check your coverage before excluding it.",
  },
  {
    question: "What changes between models?",
    answer:
      "Alternative models can lower your premium by changing whom you contact first, such as a family doctor, HMO practice or telemedicine service. Rules vary by insurer and plan.",
  },
];

export function OfficialHelp() {
  return (
    <section className="official-help" aria-labelledby="help-title">
      <div className="section-heading">
        <div><p className="eyebrow">Good to know</p><h2 id="help-title">Health insurance basics</h2></div>
        <a href={CH_COSTS} target="_blank" rel="noreferrer">Information from CH.CH ↗</a>
      </div>
      <div className="faq-list">
        {answers.map((item, index) => (
          <details key={item.question} open={index === 0}>
            <summary>{item.question}<span aria-hidden="true">+</span></summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
