const CH_COSTS = "https://www.ch.ch/en/health/health-insurance/health-insurance-costs/";

const answers = [
  {
    question: "What does franchise mean?",
    answer:
      "The franchise is the annual amount you pay towards eligible healthcare costs before basic insurance starts contributing. Adults can choose CHF 300 to CHF 2,500.",
  },
  {
    question: "Is a higher franchise always cheaper?",
    answer:
      "It lowers the monthly premium, but can increase what you pay when you need care. CH.CH advises keeping up to CHF 3,200 available with the CHF 2,500 option: the franchise plus the maximum adult retention fee.",
  },
  {
    question: "Can I exclude accident cover?",
    answer:
      "People employed by one employer for more than eight hours per week are generally covered for accidents through work. Confirm your own coverage before excluding it.",
  },
  {
    question: "What changes between models?",
    answer:
      "Alternative models can lower the premium by changing your first point of contact, such as a family doctor, HMO practice, or telemedicine service. The exact rules depend on the insurer and product.",
  },
];

export function OfficialHelp() {
  return (
    <section className="official-help" aria-labelledby="help-title">
      <div className="section-heading">
        <div><p className="eyebrow">Plain-language help</p><h2 id="help-title">Before you compare</h2></div>
        <a href={CH_COSTS} target="_blank" rel="noreferrer">Source: CH.CH ↗</a>
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
