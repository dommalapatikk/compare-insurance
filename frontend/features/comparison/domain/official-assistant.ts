import type { ChatCitation } from "../types";

export type OfficialAssistantReply = {
  message: string;
  citations: ChatCitation[];
};

const CH_COSTS: ChatCitation = {
  title: "CH.CH: health insurance costs",
  url: "https://www.ch.ch/en/health/health-insurance/health-insurance-costs/",
};
const BAG_MODELS: ChatCitation = {
  title: "BAG: insurance models",
  url: "https://www.bag.admin.ch/de/krankenversicherung-versicherungsmodelle-mit-eingeschraenkter-wahl-der-leistungserbringer",
};
const PRIMINFO_SWITCHING: ChatCitation = {
  title: "Priminfo: changing insurer",
  url: "https://www.priminfo.admin.ch/de/zahlen-und-fakten/wechsel",
};
const PRIMINFO: ChatCitation = {
  title: "Priminfo: official premium comparison",
  url: "https://www.priminfo.admin.ch/",
};

export function officialAssistantReply(question: string): OfficialAssistantReply {
  const normalized = question.toLocaleLowerCase("en");

  if (/cancel|switch|deadline|november/.test(normalized)) {
    return {
      message: "To change basic insurer for 1 January 2027, your cancellation must reach your current insurer by 30 November 2026. Apply to the new insurer first, then cancel the old policy. Check the official guidance for exceptions and delivery details.",
      citations: [PRIMINFO_SWITCHING],
    };
  }
  if (/accident/.test(normalized)) {
    return {
      message: "If you work at least 8 hours a week for the same employer, you are generally covered for non-work accidents through your employer. Otherwise, keep accident cover included. Confirm your employment coverage before excluding it.",
      citations: [CH_COSTS],
    };
  }
  if (/franchise|deductible/.test(normalized)) {
    return {
      message: "The franchise is the amount you pay each year towards covered care before basic insurance contributes. A higher franchise usually lowers the monthly premium, but increases what you may pay yourself when you need care.",
      citations: [CH_COSTS],
    };
  }
  if (/hmo|family.?doctor|telemedicine|insurance model|first contact/.test(normalized)) {
    return {
      message: "With an HMO plan, you contact a specified HMO centre first. With a family doctor plan, you choose a doctor from the insurer’s approved list. Telemedicine plans require a phone or online service first. Check the exact plan rules and local provider network before switching.",
      citations: [BAG_MODELS],
    };
  }
  if (/best|quality|service|recommend/.test(normalized)) {
    return {
      message: "I cannot rank insurers by service or quality. This comparison ranks official basic-insurance offers by premium for the choices you entered. Use the filters to compare prices, then check the plan rules and provider network with the insurer.",
      citations: [PRIMINFO],
    };
  }
  return {
    message: "I can explain franchises, insurance models, accident cover, official premiums and switching. I do not provide medical advice or choose an insurer for you. Ask one short question and I’ll point you to an official source.",
    citations: [PRIMINFO],
  };
}
