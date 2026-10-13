import type { FormEvent } from "react";

import { quickQuestions } from "../config";
import type { ComparisonFlow } from "../use-comparison-flow";

export function AskQuestion({ flow }: { flow: ComparisonFlow }) {
  function submitChat(event: FormEvent) {
    event.preventDefault();
    void flow.sendMessage(flow.draft);
  }

  return (
    <section className="question-help" aria-labelledby="ask-question-title">
      <p className="eyebrow">Need help?</p>
      <h2 id="ask-question-title">Ask about health insurance</h2>
      <p className="question-intro">
        Get plain-language answers about deductibles, insurance models, accident
        cover and your results.
      </p>
      <details className="chat-disclosure">
        <summary>Ask a question <span aria-hidden="true">→</span></summary>
        {flow.messages.length > 0 && (
          <div className="chat-transcript" aria-live="polite">
            {flow.messages.map((message) => (
              <div className={`chat-message ${message.role}`} key={message.id}>
                <span>{message.role === "assistant" ? "ANSWER" : "YOU"}</span>
                <p>{message.content}</p>
              </div>
            ))}
          </div>
        )}
        <div className="quick-questions" aria-label="Suggested questions">
          {quickQuestions.map((question) => (
            <button key={question} onClick={() => void flow.sendMessage(question)} type="button">
              {question}
            </button>
          ))}
        </div>
        <form className="chat-composer" onSubmit={submitChat}>
          <label className="sr-only" htmlFor="chat-message">Ask a health insurance question</label>
          <textarea
            id="chat-message"
            maxLength={2000}
            onChange={(event) => flow.setDraft(event.target.value)}
            placeholder="Type your question…"
            rows={2}
            value={flow.draft}
          />
          <button
            disabled={!flow.draft.trim() || flow.isSending || !flow.threadId}
            type="submit"
          >
            {flow.isSending ? "…" : "Send"}
          </button>
        </form>
        <p className="chat-note">General information only. Confirm plan details with the insurer.</p>
      </details>
    </section>
  );
}
