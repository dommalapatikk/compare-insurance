import { describe, expect, it } from "vitest";

import { switchingDeadlineState } from "./switching-deadline";

describe("switching deadline", () => {
  it("counts calendar days in Switzerland before the deadline", () => {
    expect(switchingDeadlineState(new Date("2026-10-26T12:00:00+01:00"))).toEqual({
      phase: "before_deadline",
      daysRemaining: 35,
    });
  });

  it("uses the Zurich calendar date near a UTC day boundary", () => {
    expect(switchingDeadlineState(new Date("2026-11-29T23:30:00Z"))).toEqual({
      phase: "deadline_today",
    });
  });

  it("marks the deadline day explicitly", () => {
    expect(switchingDeadlineState(new Date("2026-11-30T08:00:00+01:00"))).toEqual({
      phase: "deadline_today",
    });
  });

  it("moves to the upcoming-cover phase after the deadline", () => {
    expect(switchingDeadlineState(new Date("2026-12-01T08:00:00+01:00"))).toEqual({
      phase: "awaiting_cover_start",
      coverStart: "2027-01-01",
    });
  });

  it("expires the 2027 switching guidance after cover begins", () => {
    expect(switchingDeadlineState(new Date("2027-01-02T08:00:00+01:00"))).toEqual({
      phase: "cycle_complete",
    });
  });
});
