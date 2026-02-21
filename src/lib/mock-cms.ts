/**
 * Mock CMS-data for utvikling uten Sanity-instans.
 * Erstatter GROQ-spørringer med statiske data.
 */

import type { ModulKonfigurasjon } from "@/components/data/types/budget";

export interface CMSBudsjettaar {
  aar: number;
  status: "draft" | "pending_review" | "approved";
  moduler: ModulKonfigurasjon[];
  temaer: CMSTema[];
}

export interface CMSTema {
  nr: number;
  tittel: string;
  ingress: string;
  farge: string;
  problembeskrivelse: string;
  prioriteringer: { tittel: string; beskrivelse: string }[];
  sitat?: { tekst: string; person: string; tittel: string };
  budsjettlenker: { omrNr: number; visningsnavn: string; datareferanse: string }[];
}

/** Tilgjengelige budsjettår i CMS */
export const TILGJENGELIGE_AAR = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019];

export function hentMockCMSData(aar: number): CMSBudsjettaar | null {
  if (aar === 2026) return MOCK_2026;
  if (aar === 2025) return MOCK_2025;
  if (TILGJENGELIGE_AAR.includes(aar)) return genererHistoriskMock(aar);
  return null;
}

/**
 * Genererer forenklet CMS-data for historiske år.
 * Kun hero + budsjettgrafer + nøkkeltall-moduler, ingen temaer.
 */
function genererHistoriskMock(aar: number): CMSBudsjettaar {
  return {
    aar,
    status: "approved",
    moduler: [
      {
        type: "hero",
        synlig: true,
        rekkefolge: 0,
        konfigurasjon: {
          tittel: `Statsbudsjettet ${aar}`,
          undertittel: "Regjeringens forslag til statsbudsjett",
          nokkeltall: [
            { etikett: "Utgifter uten olje og gass", datareferanse: "oljekorrigert.utgifter_total" },
            { etikett: "Inntekter uten olje og gass", datareferanse: "oljekorrigert.inntekter_total" },
            { etikett: "Oljekorrigert underskudd", datareferanse: "spu.fondsuttak" },
          ],
        },
      },
      {
        type: "budsjettgrafer",
        synlig: true,
        rekkefolge: 1,
        konfigurasjon: {
          overskrift: "Budsjettet i tall",
          forklaringstekst: `Statsbudsjettet ${aar} viser regjeringens forslag til hvordan fellesskapets midler skal brukes.`,
        },
      },
      {
        type: "nokkeltall",
        synlig: true,
        rekkefolge: 2,
        konfigurasjon: {
          tittel: "Nøkkeltall",
          layout: "horisontal",
          tall: [
            { etikett: "Utgifter uten olje og gass", datareferanse: "oljekorrigert.utgifter_total" },
            { etikett: "Inntekter uten olje og gass", datareferanse: "oljekorrigert.inntekter_total" },
            { etikett: "Oljekorrigert underskudd", datareferanse: "spu.fondsuttak" },
            { etikett: "Netto overføring til SPU", datareferanse: "spu.netto_overfoering_til_spu" },
          ],
        },
      },
    ],
    temaer: [],
  };
}

const MOCK_2026: CMSBudsjettaar = {
  aar: 2026,
  status: "approved",
  moduler: [
    {
      type: "hero",
      synlig: true,
      rekkefolge: 0,
      konfigurasjon: {
        tittel: "Statsbudsjettet 2026",
        undertittel: "Regjeringens plan for Norge",
        nokkeltall: [
          { etikett: "Utgifter uten olje og gass", datareferanse: "oljekorrigert.utgifter_total" },
          { etikett: "Inntekter uten olje og gass", datareferanse: "oljekorrigert.inntekter_total" },
          { etikett: "Oljekorrigert underskudd", datareferanse: "spu.fondsuttak" },
          { etikett: "Strukturelt underskudd", datareferanse: "oljekorrigert.strukturelt_underskudd" },
        ],
      },
    },
    {
      type: "plan_for_norge",
      synlig: true,
      rekkefolge: 1,
      konfigurasjon: {},
    },
    {
      type: "budsjettgrafer",
      synlig: true,
      rekkefolge: 2,
      konfigurasjon: {
        overskrift: "Budsjettet i tall",
        forklaringstekst:
          "Statsbudsjettet viser regjeringens forslag til hvordan fellesskapets midler skal brukes. Klikk på et segment for å utforske detaljene.",
        spuForklaring:
          "Overføringen fra oljefondet (Statens pensjonsfond utland) dekker det oljekorrigerte underskuddet.",
        visEndringDefault: false,
      },
    },
    {
      type: "nokkeltall",
      synlig: true,
      rekkefolge: 3,
      konfigurasjon: {
        tittel: "Nøkkeltall",
        layout: "horisontal",
        tall: [
          { etikett: "Utgifter uten olje og gass", datareferanse: "oljekorrigert.utgifter_total" },
          { etikett: "Inntekter uten olje og gass", datareferanse: "oljekorrigert.inntekter_total" },
          { etikett: "Oljekorrigert underskudd", datareferanse: "spu.fondsuttak" },
          { etikett: "Strukturelt underskudd", datareferanse: "oljekorrigert.strukturelt_underskudd" },
          { etikett: "Uttaksprosent (handlingsregelen)", datareferanse: "oljekorrigert.uttaksprosent" },
        ],
      },
    },
  ],
  temaer: [
    {
      nr: 1,
      tittel: "Trygghet for økonomien",
      ingress:
        "Regjeringen fører en ansvarlig økonomisk politikk som gir trygghet for arbeidsplasser og velferd.",
      farge: "#2A7F7F",
      problembeskrivelse:
        "Norsk økonomi er i bedring, men usikkerheten internasjonalt er stor. Regjeringen prioriterer en ansvarlig pengebruk innenfor handlingsregelen.",
      prioriteringer: [
        {
          tittel: "Ansvarlig pengebruk",
          beskrivelse: "Holde oljepengebruken innenfor handlingsregelen i en tid med økt usikkerhet.",
        },
        {
          tittel: "Styrke arbeidslinjen",
          beskrivelse: "Gjøre det lønnsomt å jobbe, og lettere å inkludere flere i arbeidslivet.",
        },
      ],
      budsjettlenker: [
        { omrNr: 9, visningsnavn: "Arbeid og sosiale formål", datareferanse: "utgifter.omraader[omr_nr=9].total" },
      ],
    },
    {
      nr: 2,
      tittel: "Trygghet for arbeids- og næringslivet",
      ingress:
        "Gode rammevilkår for næringslivet og et trygt arbeidsliv er avgjørende for verdiskaping.",
      farge: "#7B5EA7",
      problembeskrivelse:
        "Næringslivet trenger forutsigbarhet og gode rammebetingelser for å investere og skape arbeidsplasser i en tid med geopolitisk usikkerhet.",
      prioriteringer: [
        {
          tittel: "Næringspolitikk",
          beskrivelse: "Styrke konkurransekraften i norsk næringsliv.",
        },
      ],
      budsjettlenker: [
        { omrNr: 17, visningsnavn: "Næring og fiskeri", datareferanse: "utgifter.omraader[omr_nr=17].total" },
      ],
    },
    {
      nr: 3,
      tittel: "Trygghet for barn og unge",
      ingress:
        "Alle barn og unge skal ha like muligheter til å lykkes, uavhengig av bakgrunn.",
      farge: "#C99A2E",
      problembeskrivelse:
        "For mange barn vokser opp i familier med vedvarende lavinntekt. Regjeringen styrker innsatsen for like muligheter.",
      prioriteringer: [
        {
          tittel: "Barnehage og skole",
          beskrivelse: "Styrke kvaliteten i barnehager og skoler over hele landet.",
        },
      ],
      budsjettlenker: [
        { omrNr: 7, visningsnavn: "Kunnskapsformål", datareferanse: "utgifter.omraader[omr_nr=7].total" },
      ],
    },
    {
      nr: 4,
      tittel: "Trygghet for helsa",
      ingress:
        "Et sterkt offentlig helsevesen gir trygghet for alle, uansett økonomi.",
      farge: "#B84C3C",
      problembeskrivelse:
        "Befolkningen blir eldre og behovet for helsetjenester øker. Regjeringen styrker sykehusene og den kommunale helse- og omsorgstjenesten.",
      prioriteringer: [
        {
          tittel: "Sykehus",
          beskrivelse: "Øke kapasiteten og redusere ventetidene.",
        },
        {
          tittel: "Fastleger",
          beskrivelse: "Styrke rekrutteringen av fastleger i hele landet.",
        },
      ],
      budsjettlenker: [
        { omrNr: 10, visningsnavn: "Helse og omsorg", datareferanse: "utgifter.omraader[omr_nr=10].total" },
      ],
    },
    {
      nr: 5,
      tittel: "Trygghet for landet",
      ingress:
        "I en urolig verden styrker regjeringen forsvaret og beredskapen ytterligere.",
      farge: "#8B7530",
      problembeskrivelse:
        "Sikkerhetssituasjonen i Europa er fortsatt alvorlig. Regjeringen viderefører den historiske satsingen på Forsvaret med en markant økning i forsvarsbudsjettet.",
      prioriteringer: [
        {
          tittel: "Forsvar",
          beskrivelse: "Fortsette å øke forsvarsbudsjettet i tråd med langtidsplanen.",
        },
        {
          tittel: "Beredskap",
          beskrivelse: "Styrke den sivile beredskapen og politiet.",
        },
      ],
      budsjettlenker: [
        { omrNr: 4, visningsnavn: "Forsvar", datareferanse: "utgifter.omraader[omr_nr=4].total" },
      ],
    },
  ],
};

const MOCK_2025: CMSBudsjettaar = {
  aar: 2025,
  status: "approved",
  moduler: [
    {
      type: "hero",
      synlig: true,
      rekkefolge: 0,
      konfigurasjon: {
        tittel: "Statsbudsjettet 2025",
        undertittel: "Regjeringens plan for Norge",
        nokkeltall: [
          { etikett: "Utgifter uten olje og gass", datareferanse: "oljekorrigert.utgifter_total" },
          { etikett: "Inntekter uten olje og gass", datareferanse: "oljekorrigert.inntekter_total" },
          { etikett: "Oljekorrigert underskudd", datareferanse: "spu.fondsuttak" },
          { etikett: "Netto overføring til SPU", datareferanse: "spu.netto_overfoering_til_spu" },
        ],
      },
    },
    {
      type: "plan_for_norge",
      synlig: true,
      rekkefolge: 1,
      konfigurasjon: {},
    },
    {
      type: "budsjettgrafer",
      synlig: true,
      rekkefolge: 2,
      konfigurasjon: {
        overskrift: "Budsjettet i tall",
        forklaringstekst:
          "Statsbudsjettet viser regjeringens forslag til hvordan fellesskapets midler skal brukes. Klikk på et segment for å utforske detaljene.",
        spuForklaring:
          "Overføringen fra oljefondet (Statens pensjonsfond utland) dekker det oljekorrigerte underskuddet.",
        visEndringDefault: false,
      },
    },
    {
      type: "nokkeltall",
      synlig: true,
      rekkefolge: 3,
      konfigurasjon: {
        tittel: "Nøkkeltall",
        layout: "horisontal",
        tall: [
          { etikett: "Utgifter uten olje og gass", datareferanse: "oljekorrigert.utgifter_total" },
          { etikett: "Inntekter uten olje og gass", datareferanse: "oljekorrigert.inntekter_total" },
          { etikett: "Oljekorrigert underskudd", datareferanse: "spu.fondsuttak" },
          { etikett: "Netto kontantstrøm petroleum", datareferanse: "spu.netto_kontantstrom" },
          { etikett: "Netto overføring til SPU", datareferanse: "spu.netto_overfoering_til_spu" },
        ],
      },
    },
  ],
  temaer: [
    {
      nr: 1,
      tittel: "Trygghet for økonomien",
      ingress:
        "Regjeringen fører en ansvarlig økonomisk politikk som gir trygghet for arbeidsplasser og velferd.",
      farge: "#2A7F7F",
      problembeskrivelse:
        "Norsk økonomi er i en krevende omstilling. Prisveksten dempes, men rentene er fortsatt høye. Regjeringen prioriterer å holde offentlig pengebruk under kontroll.",
      prioriteringer: [
        {
          tittel: "Stram finanspolitikk",
          beskrivelse: "Holde oljepengebruken innenfor handlingsregelen.",
        },
        {
          tittel: "Styrke arbeidslinjen",
          beskrivelse: "Gjøre det lønnsomt å jobbe, og lettere å inkludere flere i arbeidslivet.",
        },
      ],
      budsjettlenker: [
        { omrNr: 9, visningsnavn: "Arbeid og sosiale formål", datareferanse: "utgifter.omraader[omr_nr=9].total" },
      ],
    },
    {
      nr: 2,
      tittel: "Trygghet for arbeids- og næringslivet",
      ingress:
        "Gode rammevilkår for næringslivet og et trygt arbeidsliv er avgjørende for verdiskaping.",
      farge: "#7B5EA7",
      problembeskrivelse:
        "Næringslivet trenger forutsigbarhet og gode rammebetingelser for å investere og skape arbeidsplasser.",
      prioriteringer: [
        {
          tittel: "Næringspolitikk",
          beskrivelse: "Styrke konkurransekraften i norsk næringsliv.",
        },
      ],
      budsjettlenker: [
        { omrNr: 17, visningsnavn: "Næring og fiskeri", datareferanse: "utgifter.omraader[omr_nr=17].total" },
      ],
    },
    {
      nr: 3,
      tittel: "Trygghet for barn og unge",
      ingress:
        "Alle barn og unge skal ha like muligheter til å lykkes, uavhengig av bakgrunn.",
      farge: "#C99A2E",
      problembeskrivelse:
        "For mange barn vokser opp i familier med vedvarende lavinntekt. Regjeringen styrker innsatsen mot barnefattigdom.",
      prioriteringer: [
        {
          tittel: "Barnehage og skole",
          beskrivelse: "Styrke kvaliteten i barnehager og skoler over hele landet.",
        },
      ],
      budsjettlenker: [
        { omrNr: 7, visningsnavn: "Kunnskapsformål", datareferanse: "utgifter.omraader[omr_nr=7].total" },
      ],
    },
    {
      nr: 4,
      tittel: "Trygghet for helsa",
      ingress:
        "Et sterkt offentlig helsevesen gir trygghet for alle, uansett økonomi.",
      farge: "#B84C3C",
      problembeskrivelse:
        "Befolkningen blir eldre og behovet for helsetjenester øker. Regjeringen styrker sykehusene og fastlegeordningen.",
      prioriteringer: [
        {
          tittel: "Sykehus",
          beskrivelse: "Øke kapasiteten og redusere ventetidene.",
        },
        {
          tittel: "Fastleger",
          beskrivelse: "Styrke rekrutteringen av fastleger.",
        },
      ],
      budsjettlenker: [
        { omrNr: 10, visningsnavn: "Helse og omsorg", datareferanse: "utgifter.omraader[omr_nr=10].total" },
      ],
    },
    {
      nr: 5,
      tittel: "Trygghet for landet",
      ingress:
        "I en urolig verden styrker regjeringen forsvaret og beredskapen.",
      farge: "#8B7530",
      problembeskrivelse:
        "Sikkerhetssituasjonen i Europa er alvorlig. Regjeringen gjennomfører en historisk satsing på Forsvaret.",
      prioriteringer: [
        {
          tittel: "Forsvar",
          beskrivelse: "Øke forsvarsbudsjettet betydelig for å styrke beredskapen.",
        },
        {
          tittel: "Beredskap",
          beskrivelse: "Styrke den sivile beredskapen og politiet.",
        },
      ],
      sitat: {
        tekst: "Vi lever i den mest alvorlige sikkerhetspolitiske situasjonen siden andre verdenskrig.",
        person: "Jonas Gahr Støre",
        tittel: "Statsminister",
      },
      budsjettlenker: [
        { omrNr: 4, visningsnavn: "Forsvar", datareferanse: "utgifter.omraader[omr_nr=4].total" },
      ],
    },
  ],
};
