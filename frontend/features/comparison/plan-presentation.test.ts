import { describe, expect, it } from "vitest";

import {
  duplicatePraxisPlanNote,
  planDisplayName,
  praxisSubtype,
} from "./plan-presentation";

describe("plan presentation", () => {
  it("removes repeated insurer names, generic labels, and internal region codes", () => {
    expect(planDisplayName({
      insuranceModel: "praxis",
      legalInsurerName: "ÖKK Kranken- und Unfallversicherungen AG",
      productName: "ÖKK CASAMED HMO",
      shortInsurerName: "ÖKK",
    })).toBe("CASAMED HMO");
    expect(planDisplayName({
      insuranceModel: "praxis",
      legalInsurerName: "Helsana Versicherungen AG",
      productName: "Helsana BeneFit PLUS General Practitioner R1",
      shortInsurerName: "Helsana",
    })).toBe("BeneFit PLUS General Practitioner");
    expect(planDisplayName({
      insuranceModel: "standard",
      legalInsurerName: "CSS Krankenversicherung AG",
      productName: "Basic health insurance",
      shortInsurerName: "CSS",
    })).toBe("");
  });

  it("classifies PRAXIS plans without guessing pharmacy-first rules", () => {
    expect(praxisSubtype("ÖKK CASAMED HMO")).toBe("HMO centre");
    expect(praxisSubtype("ÖKK CASAMED GENERAL PRACTITIONER")).toBe("Your own family doctor");
    expect(praxisSubtype("KPTwin.plus - HMO GP")).toBe("HMO centre");
    expect(praxisSubtype("VIVA health plan")).toBe("Doctor network");
    expect(praxisSubtype("PharMed")).toBe("Doctor network");
  });

  it("explains duplicate HMO and family-doctor plans once at the second plan", () => {
    expect(duplicatePraxisPlanNote("ÖKK", ["HMO centre", "Your own family doctor"])).toBe(
      "ÖKK has 2 plans in this group. HMO plans use a specific centre; family-doctor plans let you choose from ÖKK’s doctor list.",
    );
  });
});
