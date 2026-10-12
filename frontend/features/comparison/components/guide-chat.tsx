import type { FormEvent } from "react";

import { quickQuestions } from "../config";
import type { ComparisonFlow } from "../use-comparison-flow";

export function GuideChat({ flow }: { flow: ComparisonFlow }) {
  function submitChat(event: FormEvent) {
    event.preventDefault();
    void flow.sendMessage(flow.draft);
  }

  return (
    <section className="guide-help" aria-labelledby="ask-guide-title">
      <p className="eyebrow">Optional AI help</p>
      <h2 id="ask-guide-title">Ask about the choices</h2>
      <p className="guide-intro">
        The guide can explain terms. It cannot create, change, or rank premium values;
        those always come from the deterministic BAG comparison.
      </p>
      <details className="chat-disclosure">
        <summary>Open question box <span aria-hidden="true">→</span></summary>
        {flow.messages.length > 0 && (
          <div className="chat-transcript" aria-live="polite">
            {flow.messages.map((message) => (
              <div className={`chat-message ${message.role}`} key={message.id}>
                <span>{message.role === "assistant" ? "GUIDE" : "YOU"}</span>
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
          <label className="sr-only" htmlFor="chat-message">Message the insurance guide</label>
          <textarea
            id="chat-message"
            maxLength={2000}
            onChange={(event) => flow.setDraft(event.target.value)}
            placeholder="Ask for an explanation…"
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
        <p className="chat-note">Explanations only—not insurance, legal, or financial advice.</p>
      </details>
    </section>
  );
}
