import { useEffect, useRef } from "react";

import type { ComparisonFlow } from "../use-comparison-flow";
import { AdvisorComposer } from "./advisor-composer";

export function AskGuide({ flow, onClose, open }: {
  flow: ComparisonFlow;
  onClose: () => void;
  open: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function handleClose() {
    onClose();
    window.setTimeout(() => document.querySelector<HTMLButtonElement>(".chat-trigger")?.focus(), 0);
  }

  if (!flow.chatAvailable || !open) return null;

  return (
    <div className="assistant-scrim" onMouseDown={(event) => {
      if (event.target === event.currentTarget) handleClose();
    }}>
      <aside aria-labelledby="assistant-title" aria-modal="true" className="assistant-panel" role="dialog">
        <header className="assistant-panel-header">
          <div>
            <h2 id="assistant-title">Ask a question</h2>
            <p>Automated help from official Swiss sources</p>
          </div>
          <div>
            {flow.messages.length > 0 && <button onClick={flow.resetConversation} type="button">New</button>}
            <button aria-label="Close assistant" onClick={handleClose} ref={closeRef} type="button">×</button>
          </div>
        </header>
        <div className="assistant-panel-body">
          {flow.messages.length === 0 && <div className="assistant-welcome">
            <strong>What would you like explained?</strong>
            <p>I can help with franchises, insurance models, accident cover, premiums and switching.</p>
          </div>}
        <AdvisorComposer
          flow={flow}
          suggestions={[
            "What is a franchise?",
            "What does the family-doctor model mean?",
            "Can I exclude accident cover?",
            "When do I need to cancel?",
          ]}
        />
        </div>
      </aside>
    </div>
  );
}
