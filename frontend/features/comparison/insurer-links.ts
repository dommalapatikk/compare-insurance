/**
 * Canonical 2027 BAG insurer catalogue.
 *
 * IDs and legal names mirror data/raw/zugelassene_krankenversicherer_2026-10-01.xlsx.
 * Short names are presentation metadata only; matching always uses the BAG ID.
 */
export const officialInsurers = [
  { id: "8", name: "CSS Krankenversicherung AG", shortName: "CSS", website: "https://www.css.ch" },
  { id: "32", name: "Aquilana Versicherungen", shortName: "Aquilana", website: "https://www.aquilana.ch" },
  { id: "134", name: "Einsiedler Krankenkasse", shortName: "Einsiedler", website: "https://www.kkeinsiedeln.ch" },
  { id: "194", name: "Sumiswalder Krankenkasse", shortName: "Sumiswalder", website: "https://www.sumiswalder.ch" },
  { id: "246", name: "Genossenschaft Krankenkasse Steffisburg", shortName: "Krankenkasse Steffisburg", website: "https://www.kkst.ch" },
  { id: "290", name: "CONCORDIA Schweiz. Kranken- und Unfallversicherung AG", shortName: "CONCORDIA", website: "https://www.concordia.ch" },
  { id: "312", name: "Atupri Gesundheitsversicherung AG", shortName: "Atupri", website: "https://www.atupri.ch" },
  { id: "343", name: "Avenir Assurance Maladie SA", shortName: "Avenir", website: "https://www.groupemutuel.ch" },
  { id: "360", name: "Krankenkasse Luzerner Hinterland", shortName: "Luzerner Hinterland", website: "https://www.kklh.ch" },
  { id: "376", name: "KPT Krankenkasse AG", shortName: "KPT", website: "https://www.kpt.ch" },
  { id: "455", name: "ÖKK Kranken- und Unfallversicherungen AG", shortName: "ÖKK", website: "https://www.oekk.ch" },
  { id: "509", name: "Vivao Sympany AG", shortName: "Sympany", website: "https://www.sympany.ch" },
  { id: "780", name: "Genossenschaft Glarner Krankenversicherung", shortName: "Glarner", website: "https://www.glkv.ch" },
  { id: "820", name: "curaulta", shortName: "curaulta", website: "https://www.curaulta.ch" },
  { id: "881", name: "EGK Grundversicherungen AG", shortName: "EGK", website: "https://www.egk.ch" },
  { id: "923", name: "Genossenschaft KRANKENKASSE SLKK", shortName: "SLKK", website: "https://www.slkk.ch" },
  { id: "941", name: "sodalis gesundheitsgruppe", shortName: "sodalis", website: "https://www.sodalis.ch" },
  { id: "966", name: "vita surselva", shortName: "vita surselva", website: "https://www.vitasurselva.ch" },
  { id: "1040", name: "Verein Krankenkasse Visperterminen", shortName: "Visperterminen", website: "https://www.kkv.ch" },
  { id: "1113", name: "Caissemaladie de la vallée d’Entremont société coopérative Mutuelle Neuchâteloise Assurance Maladie", shortName: "Vallée d’Entremont", website: "https://www.groupemutuel.ch" },
  { id: "1318", name: "Stiftung Krankenkasse Wädenswil", shortName: "Wädenswil", website: "https://www.kkwaedenswil.ch" },
  { id: "1322", name: "Krankenkasse Birchmeier", shortName: "Birchmeier", website: "https://www.kkbirchmeier.ch" },
  { id: "1384", name: "SWICA Krankenversicherung AG", shortName: "SWICA", website: "https://www.swica.ch" },
  { id: "1386", name: "Galenos AG", shortName: "Galenos", website: "https://www.galenos.ch" },
  { id: "1401", name: "rhenusana Taggeldkasse bildende KünstlerInnen", shortName: "rhenusana", website: "https://www.rhenusana.ch" },
  { id: "1479", name: "Mutuel Assurance Maladie SA", shortName: "Mutuel", website: "https://www.groupemutuel.ch" },
  { id: "1507", name: "AMB Assurances SA", shortName: "AMB", website: "https://www.groupemutuel.ch" },
  { id: "1509", name: "Sanitas Grundversicherungen AG", shortName: "Sanitas", website: "https://www.sanitas.com" },
  { id: "1535", name: "Philos Assurance Maladie SA", shortName: "Philos", website: "https://www.groupemutuel.ch" },
  { id: "1542", name: "AssuraBasis SA", shortName: "Assura", website: "https://www.assura.ch" },
  { id: "1555", name: "Visana AG", shortName: "Visana", website: "https://www.visana.ch" },
  { id: "1560", name: "Agrisano Krankenkasse AG", shortName: "Agrisano", website: "https://www.agrisano.ch" },
  { id: "1562", name: "Helsana Versicherungen AG", shortName: "Helsana", website: "https://www.helsana.ch" },
  { id: "1568", name: "sana24 AG", shortName: "sana24", website: "https://www.visana.ch" },
].toSorted((left, right) => left.name.localeCompare(right.name));

const insurersById = new Map(officialInsurers.map((insurer) => [insurer.id, insurer]));

export function officialInsurerWebsite(insurerId: string) {
  return insurersById.get(insurerId)?.website ?? null;
}

export function officialInsurerShortName(insurerId: string, fallbackName = "") {
  return insurersById.get(insurerId)?.shortName || fallbackName;
}

export function officialInsurerLegalName(insurerId: string, fallbackName = "") {
  return insurersById.get(insurerId)?.name || fallbackName;
}
