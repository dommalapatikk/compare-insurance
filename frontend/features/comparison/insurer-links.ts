// Official websites from the BAG list of authorised Swiss health insurers,
// published 1 October 2026 and stored in data/raw for reproducibility.
export const officialInsurers = [
  { id: "1535", name: "Philos Assurance Maladie SA", website: "https://www.groupemutuel.ch" },
  { id: "1542", name: "Assura-Basis SA", website: "https://www.assura.ch" },
  { id: "32", name: "Aquilana Versicherungen", website: "https://www.aquilana.ch" },
  { id: "1560", name: "Agrisano Krankenkasse AG", website: "https://www.agrisano.ch" },
  { id: "312", name: "Atupri Gesundheitsversicherung AG", website: "https://www.atupri.ch" },
  { id: "343", name: "Avenir Assurance Maladie SA", website: "https://www.groupemutuel.ch" },
  { id: "290", name: "CONCORDIA Kranken- und Unfallversicherung AG", website: "https://www.concordia.ch" },
  { id: "8", name: "CSS Krankenversicherung AG", website: "https://www.css.ch" },
  { id: "820", name: "curaulta", website: "https://www.curaulta.ch" },
  { id: "881", name: "EGK Grundversicherungen AG", website: "https://www.egk.ch" },
  { id: "134", name: "Einsiedler Krankenkasse", website: "https://www.kkeinsiedeln.ch" },
  { id: "1386", name: "Galenos AG", website: "https://www.galenos.ch" },
  { id: "780", name: "Glarner Krankenversicherung", website: "https://www.glkv.ch" },
  { id: "246", name: "Krankenkasse Steffisburg", website: "https://www.kkst.ch" },
  { id: "360", name: "Krankenkasse Luzerner Hinterland", website: "https://www.kklh.ch" },
  { id: "1322", name: "Krankenkasse Birchmeier", website: "https://www.kkbirchmeier.ch" },
  { id: "923", name: "Krankenkasse SLKK", website: "https://www.slkk.ch" },
  { id: "376", name: "KPT Krankenkasse AG", website: "https://www.kpt.ch" },
  { id: "1479", name: "Mutuel Assurance Maladie SA", website: "https://www.groupemutuel.ch" },
  { id: "1401", name: "rhenusana", website: "https://www.rhenusana.ch" },
  { id: "1568", name: "sana24 AG", website: "https://www.visana.ch" },
  { id: "1509", name: "Sanitas Grundversicherungen AG", website: "https://www.sanitas.com" },
  { id: "941", name: "sodalis gesundheitsgruppe", website: "https://www.sodalis.ch" },
  { id: "194", name: "Sumiswalder Krankenkasse", website: "https://www.sumiswalder.ch" },
  { id: "1384", name: "SWICA Krankenversicherung AG", website: "https://www.swica.ch" },
  { id: "1040", name: "Krankenkasse Visperterminen", website: "https://www.kkv.ch" },
  { id: "1555", name: "Visana AG", website: "https://www.visana.ch" },
  { id: "966", name: "vita surselva", website: "https://www.vitasurselva.ch" },
  { id: "509", name: "Vivao Sympany AG", website: "https://www.sympany.ch" },
  { id: "455", name: "ÖKK Kranken- und Unfallversicherungen AG", website: "https://www.oekk.ch" },
  { id: "1318", name: "Stiftung Krankenkasse Wädenswil", website: "https://www.kkwaedenswil.ch" },
].toSorted((left, right) => left.name.localeCompare(right.name));

const officialInsurerWebsites = Object.fromEntries(
  officialInsurers.map(({ id, website }) => [id, website]),
);

export function officialInsurerWebsite(insurerId: string) {
  return officialInsurerWebsites[insurerId] ?? null;
}
