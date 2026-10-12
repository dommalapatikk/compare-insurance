import type { ComparisonFlow } from "../use-comparison-flow";
import { AnswerHistory } from "./answer-history";
import { CurrentStep } from "./current-step";
import { GuideChat } from "./guide-chat";

export function ComparisonGuide({ flow }: { flow: ComparisonFlow }) {
  return (
    <article className="guide-panel">
      <div className="guide-header">
        <div className="agent-avatar" aria-hidden="true">CI</div>
        <div>
          <p className="step-label">LANGCHAIN GUIDE</p>
          <h2>Build your comparison</h2>
        </div>
        <span className="agent-status"><i /> Guide ready · prices unavailable</span>
      </div>

      <div className="progress-heading">
        <span>Step {flow.progressStep} of 6</span>
        <span>{flow.progress}% complete</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Comparison progress"
        aria-valuemin={1}
        aria-valuemax={6}
        aria-valuenow={flow.progressStep}
      >
        <span style={{ width: `${flow.progress}%` }} />
      </div>

      <div className="conversation">
        <div className="assistant-row">
          <div className="mini-avatar" aria-hidden="true">CI</div>
          <div className="assistant-bubble">
            Grüezi. I’ll collect only the details needed for a Swiss basic-insurance
            comparison. You can edit any answer before comparing.
          </div>
        </div>
        <AnswerHistory flow={flow} />
        <CurrentStep flow={flow} />
      </div>

      <GuideChat flow={flow} />
    </article>
  );
}

