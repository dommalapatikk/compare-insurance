import type { ComparisonFlow } from "../use-comparison-flow";
import { AdvisorComposer } from "./advisor-composer";

export function AskGuide({ flow }: { flow: ComparisonFlow }) {
  if (!flow.chatAvailable) return null;

  return (
    <section className="ask-guide" aria-label="Insurance question assistant">
      <details className="advisor-help-disclosure">
        <summary>Ask a question</summary>
        <AdvisorComposer
          flow={flow}
          suggestions={[
            "What does the family-doctor model mean?",
            "How does the franchise affect my costs?",
          ]}
        />
      </details>
    </section>
  );
}
