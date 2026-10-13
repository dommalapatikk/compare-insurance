import type { FormEvent } from "react";

import type { ComparisonFlow } from "../use-comparison-flow";

export function AdvisorComposer({
  flow,
  suggestions,
}: {
  flow: ComparisonFlow;
  suggestions: string[];
}) {
  function submit(event: FormEvent) {
    event.preventDefault();
    void flow.sendMessage(flow.draft);
  }

  return (
    <div className="advisor-conversation">
      {flow.messages.length > 0 && (
        <div className="advisor-transcript" aria-live="polite" aria-relevant="additions text" role="log">
          {flow.messages.map((message) => (
            <div className={`advisor-message ${message.role}`} key={message.id}>
              <span>{message.role === "assistant" ? "Guide" : "You"}</span>
              <p>{message.content}</p>
              {message.citations?.length ? (
                <div className="message-citations">
                  {message.citations.map((citation) => (
                    <a href={citation.url} key={citation.url} rel="noreferrer" target="_blank">
                      {citation.title} ↗
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <form className="advisor-composer" onSubmit={submit}>
        <label htmlFor="advisor-message">Ask a question</label>
        <div>
          <textarea
            id="advisor-message"
            maxLength={2000}
            onChange={(event) => flow.setDraft(event.target.value)}
            placeholder="What would you like to know?"
            rows={1}
            value={flow.draft}
          />
          <button
            disabled={!flow.draft.trim() || flow.isSending || !flow.threadId}
            type="submit"
          >
            {flow.isSending ? "Working…" : "Ask"}
          </button>
        </div>
      </form>

      {suggestions.length > 0 && <div className="advisor-suggestions" aria-label="Suggested questions">
        {suggestions.map((question) => (
          <button key={question} onClick={() => void flow.sendMessage(question)} type="button">
            {question}
          </button>
        ))}
      </div>}
      <p className="advisor-privacy">
        Please do not enter medical history, policy numbers or payment details.
      </p>
    </div>
  );
}
