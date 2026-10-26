import { describe, expect, it } from "vitest";

import { officialAssistantReply } from "./official-assistant";

describe("official assistant fallback", () => {
  it("explains franchises using an official source", () => {
    const reply = officialAssistantReply("How does the franchise affect my costs?");

    expect(reply.message).toContain("amount you pay each year");
    expect(reply.citations[0]?.url).toContain("ch.ch");
  });

  it("distinguishes family-doctor and HMO first-contact rules", () => {
    const reply = officialAssistantReply("What is the difference between HMO and family doctor?");

    expect(reply.message).toContain("HMO centre");
    expect(reply.message).toContain("family doctor");
    expect(reply.citations[0]?.url).toContain("bag.admin.ch");
  });

  it("gives the 2027 switching deadline from Priminfo guidance", () => {
    const reply = officialAssistantReply("When do I need to cancel?");

    expect(reply.message).toContain("30 November 2026");
    expect(reply.citations[0]?.url).toContain("priminfo.admin.ch");
  });

  it("does not invent a recommendation or premium for open questions", () => {
    const reply = officialAssistantReply("Which insurer is best for me?");

    expect(reply.message).toContain("cannot rank insurers by service or quality");
    expect(reply.message).not.toMatch(/CHF\s*\d/);
  });
});
