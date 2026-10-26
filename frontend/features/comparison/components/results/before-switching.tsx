import { switchingDeadlineState } from "../../domain/switching-deadline";
import type { SwitchingDeadlineState } from "../../domain/switching-deadline";

type DeadlinePresentation = {
  badge: string;
  badgeTone: "countdown" | "next-date" | "expired";
  title: string;
  description: string;
};

function deadlinePresentation(state: SwitchingDeadlineState): DeadlinePresentation {
  if (state.phase === "before_deadline") {
    return {
      badge: `${state.daysRemaining} ${state.daysRemaining === 1 ? "day" : "days"} left`,
      badgeTone: "countdown",
      title: "Cancel by 30 November 2026",
      description: "Your cancellation must reach your current insurer by the deadline.",
    };
  }
  if (state.phase === "deadline_today") {
    return {
      badge: "Due today",
      badgeTone: "countdown",
      title: "Cancel by 30 November 2026",
      description: "Your cancellation must reach your current insurer today.",
    };
  }
  if (state.phase === "awaiting_cover_start") {
    return {
      badge: "Cover starts 1 Jan 2027",
      badgeTone: "next-date",
      title: "Keep your confirmation",
      description: "Your new basic-insurance cover starts on 1 January 2027.",
    };
  }
  return {
    badge: "Check the next deadline",
    badgeTone: "expired",
    title: "Check your next deadline",
    description: "The deadline depends on when you want your cover to change.",
  };
}

export function BeforeSwitching() {
  const deadline = deadlinePresentation(switchingDeadlineState());

  return (
    <section className="before-switching" aria-labelledby="switching-title">
      <div className="before-switching-heading">
        <div>
          <p>Ready to change?</p>
          <h3 id="switching-title">Switch in 3 steps</h3>
        </div>
        <span className={`switch-deadline ${deadline.badgeTone}`} suppressHydrationWarning>
          {deadline.badge}
        </span>
      </div>
      <ol>
        <li><strong>Check the plan rules</strong>Make sure the required first contact and available doctors suit you.</li>
        <li><strong>Apply to the new insurer</strong>Confirm the plan is available before cancelling your current basic insurance.</li>
        <li><strong>{deadline.title}</strong>{deadline.description}</li>
      </ol>
      <p><a href="https://www.priminfo.admin.ch/de/zahlen-und-fakten/wechsel" target="_blank" rel="noreferrer">Official switching guidance ↗</a></p>
    </section>
  );
}
