import type { ReactNode } from "react";

import type { Choice } from "../types";

export function QuestionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="assistant-row current-question">
      <div className="mini-avatar" aria-hidden="true">CI</div>
      <section className="question-card">
        <p className="card-eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p className="question-description">{description}</p>
        {children}
      </section>
    </div>
  );
}
export function StepActions({
  onContinue,
  disabled = false,
  continueLabel = "Continue",
}: {
  onContinue: () => void;
  disabled?: boolean;
  continueLabel?: string;
}) {
  return (
    <div className="step-actions">
      <span>Stored only for this comparison</span>
      <button className="primary-action" type="button" disabled={disabled} onClick={onContinue}>
        {continueLabel} <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

export function RadioCard({
  name,
  choice,
  checked,
  onChange,
}: {
  name: string;
  choice: Choice;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="radio-card">
      <input type="radio" name={name} value={choice.value} checked={checked} onChange={onChange} />
      <span>
        <strong>{choice.label}</strong>
        {choice.description && <small>{choice.description}</small>}
      </span>
    </label>
  );
}

export function AnswerChip({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="answer-row">
      <div><span>{label}</span><strong>{value}</strong></div>
      <button type="button" onClick={onEdit}>Edit <span className="sr-only">{label}</span></button>
    </div>
  );
}
