export type SwitchingDeadlineState =
  | { phase: "before_deadline"; daysRemaining: number }
  | { phase: "deadline_today" }
  | { phase: "awaiting_cover_start"; coverStart: "2027-01-01" }
  | { phase: "cycle_complete" };

const ZURICH_TIME_ZONE = "Europe/Zurich";
const SWITCH_DEADLINE_DAY = Date.UTC(2026, 10, 30);
const NEW_COVER_DAY = Date.UTC(2027, 0, 1);
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function zurichCalendarDay(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZURICH_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return Date.UTC(values.year, values.month - 1, values.day);
}

export function switchingDeadlineState(asOf = new Date()): SwitchingDeadlineState {
  const currentDay = zurichCalendarDay(asOf);
  const daysRemaining = Math.round(
    (SWITCH_DEADLINE_DAY - currentDay) / DAY_IN_MILLISECONDS,
  );

  if (daysRemaining > 0) return { phase: "before_deadline", daysRemaining };
  if (daysRemaining === 0) return { phase: "deadline_today" };
  if (currentDay < NEW_COVER_DAY) {
    return { phase: "awaiting_cover_start", coverStart: "2027-01-01" };
  }
  return { phase: "cycle_complete" };
}
