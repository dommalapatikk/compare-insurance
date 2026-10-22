import { describe, expect, it } from "vitest";

import { currentPremiumError } from "./current-premium-validation";

describe("current premium validation", () => {
  it("requires a positive monthly premium", () => {
    expect(currentPremiumError("")).toBe("Enter your 2027 renewal premium.");
    expect(currentPremiumError("0")).toBe("Enter a monthly premium greater than CHF 0.");
    expect(currentPremiumError("-5")).toBe("Enter a monthly premium greater than CHF 0.");
  });

  it("accepts realistic premiums in five-rappen increments", () => {
    expect(currentPremiumError("420")).toBe("");
    expect(currentPremiumError("412.50")).toBe("");
    expect(currentPremiumError("2000")).toBe("");
  });

  it("rejects values outside the field contract", () => {
    expect(currentPremiumError("2000.05")).toBe("Enter a monthly premium of CHF 2,000 or less.");
    expect(currentPremiumError("412.53")).toBe("Enter the premium in CHF 0.05 increments.");
  });
});
