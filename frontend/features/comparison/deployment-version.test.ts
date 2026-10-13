import { describe, expect, it } from "vitest";

import { deploymentChanged } from "./deployment-version";

describe("deployment version checks", () => {
  it("reloads only when two known deployment identifiers differ", () => {
    expect(deploymentChanged("release-a", "release-b")).toBe(true);
    expect(deploymentChanged("release-a", "release-a")).toBe(false);
    expect(deploymentChanged("", "release-b")).toBe(false);
    expect(deploymentChanged("release-a", "")).toBe(false);
  });
});
