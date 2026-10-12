import type { ComparisonFlow } from "../use-comparison-flow";
import { AccidentStep } from "./steps/accident-step";
import { AgeStep } from "./steps/age-step";
import { DeductibleStep } from "./steps/deductible-step";
import { LocationStep } from "./steps/location-step";
import { ModelStep } from "./steps/model-step";
import { PremiumStep } from "./steps/premium-step";
import { ReviewStep } from "./steps/review-step";

export function CurrentStep({ flow }: { flow: ComparisonFlow }) {
  switch (flow.step) {
    case 1:
      return <LocationStep flow={flow} />;
    case 2:
      return <AgeStep flow={flow} />;
    case 3:
      return <AccidentStep flow={flow} />;
    case 4:
      return <DeductibleStep flow={flow} />;
    case 5:
      return <ModelStep flow={flow} />;
    case 6:
      return <PremiumStep flow={flow} />;
    case 7:
      return <ReviewStep flow={flow} />;
  }
}

