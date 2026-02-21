/**
 * Mock-omtaler for drill-down-visning.
 * Inneholder redaksjonelt innhold per programområde og aggregert kategori.
 * Erstatter CMS/Prisma-baserte programomraade_innhold i utviklingsmodus.
 */

import type { GrafKonfigurasjon } from "@/lib/types/cms";

export interface OmrOmtale {
  ingress: string;
  brodtekst: string;
  grafer: GrafKonfigurasjon[];
}

/** Nøkkelformat: "{aar}:{omr_nr}" eller "{aar}:agg:{aggregert_id}" */
type OmtaleNokkel = string;

const OMTALER: Record<OmtaleNokkel, OmrOmtale> = {
  // =========================================================================
  // 2026: Aggregerte kategorier (for drill-down fra stacked barplot)
  // =========================================================================

  // --- Folketrygden (omr 28, 29, 30, 33) ---
  "2026:agg:folketrygden": {
    ingress:
      "Folketrygden er statens største utgiftsområde og sikrer alle innbyggere grunnleggende økonomisk trygghet gjennom livet — fra foreldrepenger til alderspensjon.",
    brodtekst:
      "Regjeringens samlede forslag til utgifter under folketrygdens programområder for 2026 er på 744,0 mrd. kroner, en økning på 41,8 mrd. kroner fra saldert budsjett 2025. Økningen skyldes i hovedsak økte utgifter til alderspensjon, arbeidsavklaringspenger og uføretrygd. I tillegg bidrar regulering av folketrygdens grunnbeløp med anslagsvis 18,7 mrd. kroner.\n\nInnen sosiale formål (programområde 29) er økningen alene på 35,5 mrd. kroner. Utgiftene til uføretrygd øker med om lag 8 mrd. kroner, dels som følge av trygdeoppgjøret (5,4 mrd.) og dels økt overgang fra AAP. Antall uføretrygdede forventes å øke fra 375 300 til 380 700. Arbeidsavklaringspenger øker med 5,8 mrd. kroner, drevet av flere mottakere (fra 165 100 til 171 900).\n\nFolketrygdens finansieringsbehov — differansen mellom utgifter (744 mrd.) og inntekter fra trygdeavgift og arbeidsgiveravgift (517 mrd.) — utgjør 226,9 mrd. kroner, som dekkes av statstilskudd.",
    grafer: [
      {
        type: "barplot",
        tittel: "Folketrygdens utgifter 2022–2026 (mrd. kr)",
        manuellData: [
          { etikett: "2022", verdi: 560 },
          { etikett: "2023", verdi: 614 },
          { etikett: "2024", verdi: 660 },
          { etikett: "2025", verdi: 702 },
          { etikett: "2026", verdi: 744 },
        ],
      },
    ],
  },

  // --- Kommuner og distrikter (omr 13) ---
  "2026:agg:kommuner": {
    ingress:
      "Kommunesektoren leverer grunnleggende velferdstjenester innen helse, omsorg, skole og barnehage til befolkningen i hele landet.",
    brodtekst:
      "Regjeringen foreslår en realvekst i kommunesektorens frie inntekter på 4,2 mrd. kroner i 2026, tilsvarende 0,7 prosent. Av veksten går 3,2 mrd. til kommunene og 1,0 mrd. til fylkeskommunene. Forslaget gir kommunesektoren et handlingsrom utover kostnader knyttet til befolkningsutviklingen på om lag 1,3 mrd. kroner.\n\nKommunene og fylkeskommunene kan ut fra lokale behov bruke handlingsrommet til å bedre den økonomiske balansen eller styrke tjenestetilbudet. Bevilgningene ble også økt med 1,6 mrd. i forbindelse med revidert nasjonalbudsjett 2025, og dette videreføres.\n\nRegjeringen vil føre en aktiv boligpolitikk med en låneramme i Husbanken på 32 mrd. kroner. Det foreslås også tiltak for en bærekraftig arealpolitikk og helhetlig distrikts- og nordområdepolitikk, med oppfølging av nordområdestrategien.",
    grafer: [
      {
        type: "barplot",
        tittel: "Frie inntekter til kommunesektoren 2022–2026 (mrd. kr)",
        manuellData: [
          { etikett: "2022", verdi: 253 },
          { etikett: "2023", verdi: 272 },
          { etikett: "2024", verdi: 282 },
          { etikett: "2025", verdi: 290 },
          { etikett: "2026", verdi: 315 },
        ],
      },
    ],
  },

  // --- Helse og omsorg (omr 10) ---
  "2026:agg:helse": {
    ingress:
      "Helse- og omsorgsbudsjettet dekker spesialisthelsetjenesten, kommunehelsetjenesten, folkehelse, eldre og psykisk helse.",
    brodtekst:
      "Regjeringen foreslår å styrke de regionale helseforetakene med 3,4 mrd. kroner i 2026 sammenlignet med saldert budsjett 2025. Bevilgningsøkningen dekker økt aktivitet i sykehusene som følge av at befolkningen øker og blir eldre. Det foreslås investeringslån til pågående og nye sykehusprosjekter på om lag 7 mrd. kroner, inkludert nytt Mjøssykehus, nytt bygg ved Sykehuset Østfold og utbygging av Sunnaas sykehus.\n\nRegjeringen foreslår et eldreløft med nye satsinger på bolig, bemanning og kvalitet. Det foreslås tilskudd for å gjøre boliger mer aldersvennlige, investeringstilskudd til om lag 1 500 heldøgns omsorgsplasser og en ny ordning for aktivitetstiltak for eldre. Allmennlegetjenesten styrkes med 115 mill. kroner, blant annet til utprøving av kommunal nettlege og konsultasjoner delegert til sykepleier.\n\nOpptrappingsplanen for psykisk helse videreføres med ytterligere 140 mill. kroner, blant annet til kunnskapsbaserte lavterskeltilbud og styrking av frivillige organisasjoner innen psykisk helse og rus.",
    grafer: [
      {
        type: "barplot",
        tittel: "Utgifter til helse og omsorg 2022–2026 (mrd. kr)",
        manuellData: [
          { etikett: "2022", verdi: 219 },
          { etikett: "2023", verdi: 234 },
          { etikett: "2024", verdi: 241 },
          { etikett: "2025", verdi: 248 },
          { etikett: "2026", verdi: 257 },
        ],
      },
    ],
  },

  // --- Forsvar (omr 4) ---
  "2026:agg:forsvar": {
    ingress:
      "Regjeringen foreslår å øke forsvarsbudsjettet med 4,2 mrd. kroner til oppfølging av langtidsplanen for forsvarssektoren.",
    brodtekst:
      "Forsvarsbudsjettet styrkes med prioritering av beredskap, utholdenhet og materiellinvesteringer. Regjeringen fortsetter oppbyggingen av Forsvaret gjennom økte driftsrammer, mer ressurser til materielldrift og reservedeler, og personelloppbygging med om lag 600 fast ansatte, 750 reservister og 700 vernepliktige.\n\nDe største utbetalingene til materiellinvesteringer i 2026 går til nye ubåter, våpen og tiltak knyttet til kampfly F-35-programmet, anskaffelse av Seahawk til Kystvakten og nye stridsvogner til Hæren. Etterretningstjenesten og situasjonsforståelsen videreutvikles.\n\nStøtten til Ukrainas forsvarskamp gjennom Nansen-programmet videreføres som en sentral prioritering, i lys av den sikkerhetspolitiske situasjonen.",
    grafer: [
      {
        type: "barplot",
        tittel: "Forsvarsbudsjettet 2022–2026 (mrd. kr)",
        manuellData: [
          { etikett: "2022", verdi: 69 },
          { etikett: "2023", verdi: 78 },
          { etikett: "2024", verdi: 90 },
          { etikett: "2025", verdi: 110 },
          { etikett: "2026", verdi: 180 },
        ],
      },
    ],
  },

  // --- Kunnskapsformål (omr 7) ---
  "2026:agg:kunnskap": {
    ingress:
      "Kunnskapsbudsjettet dekker barnehager, grunnopplæring, fagskoler, høyere utdanning og forskning.",
    brodtekst:
      "Regjeringen foreslår å videreføre maksimalprisen i barnehagene på 1 200 kroner per måned nasjonalt, med 700 kroner i distrikter og gratis barnehage i innsatssonen. Kapasiteten i arbeidsplassbasert barnehagelærerutdanning (ABLU) trappes opp til 490 årlige plasser. Tilskudd til økt pedagogtetthet i levekårsutsatte områder videreføres.\n\nRegjeringen vil bruke 1 mrd. kroner over fire år på å løfte leseferdighetene i grunnskolen, med økt tilskudd til skolebibliotek og fysiske lærebøker. Utstyr- og læringsarenaordningen utvides til 1.–4. trinn. Innsatsen mot barne- og ungdomskriminalitet videreføres gjennom skolemiljøteam.\n\nFagskolene får 1,8 mrd. kroner i driftstilskudd — en nominell økning på nesten 50 pst. siden 2023 — med 900 nye studieplasser. Høyere utdanning videreføres med en rammebevilgning på 48,2 mrd. kroner.",
    grafer: [
      {
        type: "barplot",
        tittel: "Utgifter til kunnskapsformål 2022–2026 (mrd. kr)",
        manuellData: [
          { etikett: "2022", verdi: 125 },
          { etikett: "2023", verdi: 132 },
          { etikett: "2024", verdi: 139 },
          { etikett: "2025", verdi: 145 },
          { etikett: "2026", verdi: 153 },
        ],
      },
    ],
  },

  // --- Næring og fiskeri (omr 17) ---
  "2026:agg:naering": {
    ingress:
      "Nærings- og fiskeribudsjettet omfatter næringsstøtte, romvirksomhet, fiskeri, landbruk og svalbardpolitikk.",
    brodtekst:
      "Regjeringen foreslår økte bevilgninger på til sammen over 1,1 mrd. kroner til nytt sjøfibersamband til Svalbard og Jan Mayen, oppgradering av energiforsyning i Longyearbyen og opprydding etter gruvedrift. Sikker energiforsyning legger til rette for at Longyearbyensamfunnet kan videreutvikles etter at kulldriften i Gruve 7 ble avviklet.\n\nNorge deltar i europeisk romsamarbeid gjennom ESA og EUs romprogram. Regjeringen samler de nasjonale følgeprogrammene i porteføljeprogrammet Norsk program for romkapasiteter (NORKAP). Rammen for CO₂-kompensasjon til fiskeflåten økes med 140 mill. kroner, der ordningen premierer drivstoffeffektiv drift.\n\nKonkurransen i dagligvarebransjen styrkes ved å øke Konkurransetilsynets budsjett og overføre ansvaret for håndhevingen av lov om god handelsskikk fra Dagligvaretilsynet til Konkurransetilsynet.",
    grafer: [
      {
        type: "barplot",
        tittel: "Utgifter til næring og fiskeri 2022–2026 (mrd. kr)",
        manuellData: [
          { etikett: "2022", verdi: 107 },
          { etikett: "2023", verdi: 120 },
          { etikett: "2024", verdi: 128 },
          { etikett: "2025", verdi: 134 },
          { etikett: "2026", verdi: 144 },
        ],
      },
    ],
  },

  // --- Innenlands transport (omr 21) ---
  "2026:agg:transport": {
    ingress:
      "Transportbudsjettet på 96,1 mrd. kroner følger opp Nasjonal transportplan 2025–2036 med satsing på jernbane, riksveier og byvekstavtaler.",
    brodtekst:
      "Regjeringen foreslår 96,1 mrd. kroner til oppfølging av Nasjonal transportplan, en økning på 1,5 mrd. kroner fra saldert budsjett 2025. Drift og vedlikehold av riksveier styrkes med ytterligere 0,6 mrd. kroner. Samlet legger regjeringen opp til å bruke over 40 mrd. kroner til gjennomføring av igangsatte prosjekter.\n\nBlant de store prosjektene er Fellesprosjektet Vossebanen/E16 Arna–Stanghelle med anleggsstart på den første av de store kontraktene, og ny Hamar stasjon. Byvekstavtalene videreføres med midler til nye prosjekter i de fire største byområdene for å fremme kollektivtransport, sykling og gange.\n\nRegjeringen foreslår en kostnadsramme på 2,4 mrd. kroner for kjøp av 13 nye regiontog, som vil gi flere tog fra 2028 og en bedre reisehverdag.",
    grafer: [
      {
        type: "barplot",
        tittel: "Utgifter til innenlands transport 2022–2026 (mrd. kr)",
        manuellData: [
          { etikett: "2022", verdi: 82 },
          { etikett: "2023", verdi: 86 },
          { etikett: "2024", verdi: 89 },
          { etikett: "2025", verdi: 94 },
          { etikett: "2026", verdi: 100 },
        ],
      },
    ],
  },

  // --- Øvrige utgifter (samlepost) ---
  "2026:agg:ovrige_utgifter": {
    ingress:
      "Øvrige utgifter dekker 15 programområder innen justis, kultur, utenriks, klima, energi, arbeidsliv og flere.",
    brodtekst:
      "Justissektoren prioriterer best mulig ressursutnyttelse — politiet omstrukturerer med nedleggelse av 14 passkontor erstattet av passbusser, og kriminalomsorgen legger om til bachelorgrad for fengselsbetjenter. Kultur- og likestillingsdepartementet øker med 4,8 pst. og prioriterer full MVA-kompensasjon for frivilllige organisasjoner (økt med 429 mill. kr) og økte tilskudd til musikk- og scenekunstinstitusjoner (nær 6,3 mrd. kr).\n\nKlima- og miljøbudsjettet viderefører Klimasats-ordningen til 2030 og Klima- og skog-satsingen. Digitaliserings- og forvaltningsdepartementet prioriterer etablering av myndighetsapparat for ny KI-lov. Energidepartementet følger opp energipolitikken.\n\nArbeids- og inkluderingsdepartementet foreslår økt innsats mot barne- og ungdomskriminalitet (90 mill. kr) og styrking av barnevernets institusjonskapasitet (nesten 550 mill. kr til private plasser). Jordbruksavtalen økes med 1,2 mrd. kroner til 30,1 mrd. for å følge opp opptrappingsplanen for bøndenes inntekt.",
    grafer: [
      {
        type: "barplot",
        tittel: "Øvrige utgifter 2022–2026 (mrd. kr)",
        manuellData: [
          { etikett: "2022", verdi: 438 },
          { etikett: "2023", verdi: 466 },
          { etikett: "2024", verdi: 496 },
          { etikett: "2025", verdi: 522 },
          { etikett: "2026", verdi: 541 },
        ],
      },
    ],
  },

  // =========================================================================
  // 2026: Inntektskategorier
  // =========================================================================

  "2026:agg:skatt_person": {
    ingress:
      "Skatt på formue og inntekt er statens viktigste inntektskilde og anslås til 514,8 mrd. kroner i 2026 — en økning på 18,4 prosent.",
    brodtekst:
      "Samlet skatt på formue og inntekt anslås til 514,8 mrd. kroner i 2026, opp fra 434,9 mrd. i saldert budsjett 2025. Anslagene er basert på prognoser for lønnsvekst, sysselsetting og selskapsoverskudd utenom petroleumssektoren, samt forslaget til skatte- og avgiftsopplegg fra Prop. 1 LS.\n\nDe største inntektene kommer fra skatter og avgifter fra Fastlands-Norge, som samlet anslås til 1 560,2 mrd. kroner — 91 prosent av statsbudsjettets inntekter utenom petroleumsvirksomheten.",
    grafer: [
      {
        type: "barplot",
        tittel: "Skatt på inntekt og formue 2022–2026 (mrd. kr)",
        manuellData: [
          { etikett: "2022", verdi: 331 },
          { etikett: "2023", verdi: 376 },
          { etikett: "2024", verdi: 407 },
          { etikett: "2025", verdi: 430 },
          { etikett: "2026", verdi: 508 },
        ],
      },
    ],
  },

  "2026:agg:mva": {
    ingress:
      "Merverdiavgiften anslås til 421,0 mrd. kroner i 2026, en økning på 2,9 prosent fra saldert budsjett 2025.",
    brodtekst:
      "Merverdiavgiften er en av statens viktigste inntektskilder og kreves inn på omsetning av varer og tjenester. Inntektene anslås å øke med 11,7 mrd. kroner fra 409,3 mrd. i 2025, drevet av økt privat forbruk og generell prisvekst.\n\nDen alminnelige MVA-satsen på 25 prosent videreføres. Den reduserte satsen for næringsmidler og den lave satsen for persontransport og kultur holdes uendret. Skatte- og avgiftsopplegget for 2026 er nærmere omtalt i Prop. 1 LS (2025–2026).",
    grafer: [
      {
        type: "barplot",
        tittel: "Merverdiavgift 2022–2026 (mrd. kr)",
        manuellData: [
          { etikett: "2022", verdi: 349 },
          { etikett: "2023", verdi: 371 },
          { etikett: "2024", verdi: 392 },
          { etikett: "2025", verdi: 409 },
          { etikett: "2026", verdi: 421 },
        ],
      },
    ],
  },

  "2026:agg:arbeidsgiveravgift": {
    ingress:
      "Arbeidsgiveravgift og trygdeavgift utgjør til sammen 514,2 mrd. kroner i 2026 — en økning på 10,2 prosent.",
    brodtekst:
      "Arbeidsgiveravgiften anslås til 283,0 mrd. kroner i 2026, beregnet ut fra arbeidsgivers lønnsutbetalinger. Veksten gjenspeiler økt sysselsetting og lønnsvekst i norsk økonomi.\n\nDen differensierte arbeidsgiveravgiften videreføres med soner fra 0 til 14,1 prosent for å ivareta distrikts- og regionalpolitiske hensyn. Folketrygdens finansieringsbehov for 2026 er anslått til 226,9 mrd. kroner, som dekkes gjennom statstilskudd.",
    grafer: [
      {
        type: "barplot",
        tittel: "Arbeidsgiveravgift 2022–2026 (mrd. kr)",
        manuellData: [
          { etikett: "2022", verdi: 216 },
          { etikett: "2023", verdi: 236 },
          { etikett: "2024", verdi: 254 },
          { etikett: "2025", verdi: 269 },
          { etikett: "2026", verdi: 283 },
        ],
      },
    ],
  },

  "2026:agg:trygdeavgift": {
    ingress:
      "Trygdeavgiften betales av lønnstakere og selvstendig næringsdrivende og er øremerket finansiering av folketrygden.",
    brodtekst:
      "Trygdeavgiften anslås til 231,2 mrd. kroner i 2026. Sammen med arbeidsgiveravgiften og mindre gebyrer utgjør folketrygdens inntekter 517,1 mrd. kroner. Utgiftene til folketrygden er 744,0 mrd. kroner, som gir et finansieringsbehov på 226,9 mrd. kroner som dekkes av statstilskudd.\n\nTrygdeavgiftssatsene foreslås videreført på 7,9 prosent for lønnstakere og 11,2 prosent for selvstendig næringsdrivende.",
    grafer: [
      {
        type: "barplot",
        tittel: "Trygdeavgift 2022–2026 (mrd. kr)",
        manuellData: [
          { etikett: "2022", verdi: 162 },
          { etikett: "2023", verdi: 176 },
          { etikett: "2024", verdi: 188 },
          { etikett: "2025", verdi: 197 },
          { etikett: "2026", verdi: 231 },
        ],
      },
    ],
  },

  "2026:agg:ovrige_inntekter": {
    ingress:
      "Øvrige inntekter omfatter renter og aksjeutbytte (83,9 mrd. kr), særavgifter, tollinntekter og andre statlige inntekter.",
    brodtekst:
      "Utenom de store skatteartene består statens inntekter av renter og aksjeutbytte (83,9 mrd. kr, ned 4,2 pst.), avgifter på tobakk og alkohol (24,0 mrd.), motorvognavgifter (18,7 mrd.), elektrisitetsavgift (4,8 mrd., ned 55,8 pst. grunnet endrede satser), tollinntekter og andre avgifter.\n\nRenter og aksjeutbytte inkluderer fra 2025 også overføring fra Statens pensjonsfond Norge (SPN). Inntekter fra statens forvaltningsbedrifter anslås til 5,2 mrd. kroner, en økning på 14,5 prosent.",
    grafer: [
      {
        type: "barplot",
        tittel: "Øvrige inntekter 2022–2026 (mrd. kr)",
        manuellData: [
          { etikett: "2022", verdi: 345 },
          { etikett: "2023", verdi: 366 },
          { etikett: "2024", verdi: 386 },
          { etikett: "2025", verdi: 413 },
          { etikett: "2026", verdi: 417 },
        ],
      },
    ],
  },
};

/**
 * Hent omtale for en aggregert kategori.
 */
export function hentAggregertOmtale(aar: number, aggId: string): OmrOmtale | null {
  return OMTALER[`${aar}:agg:${aggId}`] ?? null;
}

/**
 * Hent omtale for et spesifikt programområde.
 */
export function hentOmraadeOmtale(aar: number, omrNr: number): OmrOmtale | null {
  return OMTALER[`${aar}:${omrNr}`] ?? null;
}
