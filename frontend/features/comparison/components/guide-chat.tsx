import type { FormEvent } from "react";

import { quickQuestions } from "../config";
import type { ComparisonFlow } from "../use-comparison-flow";

export function GuideChat({ flow }: { flow: ComparisonFlow }) {
  function submitChat(event: FormEvent) {
    event.preventDefault();
    void flow.sendMessage(flow.draft);
  }

  return (
    <section className="free-chat" aria-labelledby="ask-guide-title">
      <div className="free-chat-heading">
        <div>
          <p className="step-label">QUESTIONS</p>
          <h3 id="ask-guide-title">Ask the guide at any time</h3>
        </div>
        <span aria-live="polite">{flow.isSending ? "Guide is responding…" : ""}</span>
      </div>

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
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void flow.sendMessage(flow.draft);
            }
          }}
          placeholder="Ask for an explanation. Guided fields are required for prices."
          rows={2}
          value={flow.draft}
        />
        <button
          disabled={!flow.draft.trim() || flow.isSending || !flow.threadId}
          type="submit"
          aria-label="Send message"
        >
          ↑
        </button>
      </form>
      <p className="chat-disclaimer">
        Explanations only—not medical, legal, financial, or insurance advice.
      </p>
    </section>
  );
}

