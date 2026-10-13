"""Small reviewed guidance catalogue; language models do not invent these facts."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class GuidanceEntry:
    content: str
    title: str
    url: str


OFFICIAL_GUIDANCE: dict[str, GuidanceEntry] = {
    "2027_premiums": GuidanceEntry(
        content=(
            "Swiss compulsory health-insurance premiums rise by an average of "
            "5.0% in 2027. The national mean premium is CHF 412 per month. "
            "An individual's premium depends on location, age category, "
            "deductible, insurer and insurance model."
        ),
        title="FOPH/BAG: premiums and costs in 2027",
        url="https://www.bag.admin.ch/en/premiums-and-costs-answers-to-frequently-asked-questions",
    ),
    "deductible": GuidanceEntry(
        content=(
            "The deductible is the amount paid towards covered healthcare costs "
            "each year before the insurer starts contributing. A higher "
            "deductible can lower the premium but increases possible "
            "out-of-pocket costs."
        ),
        title="ch.ch: health-insurance costs",
        url="https://www.ch.ch/en/health/health-insurance/health-insurance-costs/",
    ),
    "accident_coverage": GuidanceEntry(
        content=(
            "People employed for more than eight hours per week by one employer "
            "are generally covered by compulsory accident insurance and may not "
            "need accident cover in basic health insurance. Confirm the situation "
            "with the employer or insurer before excluding it."
        ),
        title="ch.ch: health-insurance costs",
        url="https://www.ch.ch/en/health/health-insurance/health-insurance-costs/",
    ),
    "insurance_models": GuidanceEntry(
        content=(
            "The official 2027 comparison categories are Standard, FLEX, PRAXIS, "
            "TEL-DIG and PHARM. Restricted-choice models define a first point of "
            "contact, such as a practice, digital service or pharmacy; exact "
            "rules depend on the insurer's product."
        ),
        title="FOPH/BAG: insurance models with restricted provider choice",
        url=(
            "https://www.bag.admin.ch/de/krankenversicherung-versicherungsmodelle-"
            "mit-eingeschraenkter-wahl-der-leistungserbringer"
        ),
    ),
    "switching": GuidanceEntry(
        content=(
            "For 2027 premiums, insured people can change their basic insurer or "
            "adjust their insurance model by the end of November. Confirm the "
            "receipt deadline and required notice with the insurer."
        ),
        title="FOPH/BAG: 2027 premium announcement",
        url="https://www.bag.admin.ch/de/newnsb/BfuGvedj0OOX",
    ),
}
