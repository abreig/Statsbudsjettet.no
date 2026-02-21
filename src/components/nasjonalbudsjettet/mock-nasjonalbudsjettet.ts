/**
 * Mock-data for Nasjonalbudsjettet 2026 (Meld. St. 1).
 * Brukes i utvikling uten Sanity-instans.
 */

import type { NasjonalbudsjettetKonfigurasjon } from "./types";

/**
 * Henter nasjonalbudsjettet-data for gitt år.
 * Tilsvarer fremtidig Sanity-spørring.
 */
export function hentNasjonalbudsjettetData(
  aar: number,
): NasjonalbudsjettetKonfigurasjon | null {
  if (aar === 2026) return NASJONALBUDSJETTET_2026;
  if (aar === 2025) return NASJONALBUDSJETTET_2025;
  return null;
}

export const NASJONALBUDSJETTET_2026: NasjonalbudsjettetKonfigurasjon = {
  tittel: "Nasjonalbudsjettet — tilstanden i norsk økonomi",
  ingress:
    "Norsk økonomi er i en moderat oppgangskonjunktur med stabil vekst, lav arbeidsledighet og fallende inflasjon. Finanspolitikken innrettes for å støtte omstilling og bærekraftig verdiskaping.",
  pdf_lenke:
    "https://www.regjeringen.no/no/dokumenter/meld.-st.-1-20252026/id3063020/",
  vis_paa_landingsside: true,

  nokkeltall: [
    {
      etikett: "BNP-vekst Fastlands-Norge",
      verdi: "2,1 %",
      endring: "+0,1 pp",
      retning: "opp",
      positivt_er: "opp",
    },
    {
      etikett: "Konsumprisvekst (KPI)",
      verdi: "2,2 %",
      endring: "−0,6 pp",
      retning: "ned",
      positivt_er: "ned",
    },
    {
      etikett: "Registrert ledighet",
      verdi: "2,1 %",
      endring: "0,0 pp",
      retning: "noytral",
      positivt_er: "ned",
    },
    {
      etikett: "Strukturell fondsbruk",
      verdi: "13,1 %",
      endring: "+0,5 pp",
      retning: "opp",
    },
  ],

  seksjoner: [
    {
      type: "tekst",
      overskrift: "Norsk økonomi",
      innhold:
        "Norsk økonomi viser god motstandskraft. BNP for Fastlands-Norge anslås å vokse med 2,1 prosent i 2026, en forsiktig oppgang fra året før. Sysselsettingen er høy, og arbeidsledigheten holder seg på et historisk lavt nivå. Samtidig avtar inflasjonen gradvis mot Norges Banks mål på 2 prosent.",
    },
    {
      type: "graf_placeholder",
      tittel: "BNP-vekst Fastlands-Norge",
      beskrivelse: "Årlig prosentvis endring i BNP for Fastlands-Norge",
      hoyde: 380,
    },
    {
      type: "tekst",
      overskrift: "Prisvekst og renter",
      innhold:
        "Konsumprisveksten anslås til 2,2 prosent i 2026, ned fra 2,8 prosent året før. Kronesvekkelsen i 2023–2024 har gradvis avtatt, og importert prisvekst bidrar mindre til den samlede inflasjonen. Norges Bank forventes å videreføre en gradvis normalisering av styringsrenten.",
    },
    {
      type: "graf_placeholder",
      tittel: "KPI og inflasjonsmål",
      beskrivelse: "Konsumprisindeksen og Norges Banks inflasjonsmål (2 %)",
      hoyde: 380,
    },
    {
      type: "tekst",
      overskrift: "Arbeidsmarkedet",
      innhold:
        "Arbeidsmarkedet er stramt. Registrert arbeidsledighet ligger på 2,1 prosent, uendret fra året før. Sysselsettingsandelen er høy i internasjonal sammenheng, og etterspørselen etter arbeidskraft er fortsatt sterk i flere sektorer. Mangel på kvalifisert arbeidskraft er en utfordring i deler av næringslivet og offentlig sektor.",
    },
    {
      type: "graf_placeholder",
      tittel: "Registrert arbeidsledighet",
      beskrivelse: "Registrert arbeidsledighet som andel av arbeidsstyrken",
      hoyde: 380,
    },
    {
      type: "tekst",
      overskrift: "Finanspolitikken og handlingsregelen",
      innhold:
        "Regjeringen fører en ansvarlig finanspolitikk innenfor handlingsregelens rammer. Det strukturelle oljekorrigerte underskuddet anslås til 579,4 milliarder kroner, tilsvarende 3,1 prosent av Statens pensjonsfond utland. Fondsbruken er dermed nær den langsiktige rettesnoren på 3 prosent av fondskapitalen.",
    },
    {
      type: "graf_placeholder",
      tittel: "Strukturell fondsbruk som andel av trend-BNP",
      beskrivelse: "Strukturelt oljekorrigert underskudd i prosent av trend-BNP for Fastlands-Norge",
      hoyde: 380,
    },
    {
      type: "tekst",
      overskrift: "Oljefondet (SPU)",
      innhold:
        "Statens pensjonsfond utland (SPU) hadde ved inngangen til 2026 en markedsverdi på om lag 19 800 milliarder kroner. Fondets avkastning de siste årene har vært sterk, drevet av god utvikling i globale aksjemarkeder. Netto kontantstrøm fra petroleumsvirksomheten anslås til 557 milliarder kroner i 2026.",
    },
    {
      type: "graf_placeholder",
      tittel: "Fondsverdien over tid",
      beskrivelse: "Markedsverdien av Statens pensjonsfond utland, milliarder kroner",
      hoyde: 380,
    },
    {
      type: "tekst",
      overskrift: "Risikobildet",
      innhold:
        "Den økonomiske utviklingen er usikker. Geopolitiske spenninger, vedvarende handelskonflikter og risiko for nye forstyrrelser i globale forsyningskjeder utgjør nedside­risiko. Høyere renter internasjonalt enn ventet kan dempe den globale veksten og påvirke norsk eksport. På oppsiden kan sterkere produktivitetsvekst og raskere fall i inflasjonen gi rom for en mer ekspansiv pengepolitikk.",
    },
  ],
};

export const NASJONALBUDSJETTET_2025: NasjonalbudsjettetKonfigurasjon = {
  tittel: "Nasjonalbudsjettet — tilstanden i norsk økonomi",
  ingress:
    "Norsk økonomi viser motstandskraft i møte med global usikkerhet, med moderat vekst og stabil sysselsetting.",
  pdf_lenke:
    "https://www.regjeringen.no/no/dokumenter/meld.-st.-1-20242025/id3053754/",
  vis_paa_landingsside: true,

  nokkeltall: [
    {
      etikett: "BNP-vekst Fastlands-Norge",
      verdi: "2,0 %",
      retning: "opp",
      positivt_er: "opp",
    },
    {
      etikett: "Konsumprisvekst (KPI)",
      verdi: "2,8 %",
      retning: "ned",
      positivt_er: "ned",
    },
    {
      etikett: "Registrert ledighet",
      verdi: "2,1 %",
      retning: "noytral",
      positivt_er: "ned",
    },
  ],

  seksjoner: [
    {
      type: "tekst",
      overskrift: "Norsk økonomi",
      innhold:
        "Etter en periode med høy inflasjon og renteoppgang viser norsk økonomi tegn til stabilisering. BNP for Fastlands-Norge anslås å vokse med 2,0 prosent i 2025.",
    },
    {
      type: "graf_placeholder",
      tittel: "BNP-vekst Fastlands-Norge",
      hoyde: 380,
    },
  ],
};
