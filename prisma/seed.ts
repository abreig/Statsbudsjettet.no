// @ts-nocheck
/**
 * Prisma seed-script.
 * Fyller databasen med testdata: ett budsjettår (2025),
 * moduler, temaer og nøkkeltall.
 *
 * Kjør med: npx prisma db seed
 */

import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeder databasen...");

  // Opprett testbruker (administrator)
  const admin = await prisma.bruker.upsert({
    where: { epost: "admin@dev.local" },
    update: {},
    create: {
      epost: "admin@dev.local",
      navn: "Administrator",
      rolle: "administrator",
    },
  });

  // Opprett testbruker (redaktør)
  await prisma.bruker.upsert({
    where: { epost: "redaktor@dev.local" },
    update: {},
    create: {
      epost: "redaktor@dev.local",
      navn: "Redaktør",
      rolle: "redaktor",
    },
  });

  // Opprett budsjettår 2025
  const aar2025 = await prisma.budsjettaar.upsert({
    where: { aarstall: 2025 },
    update: {},
    create: {
      aarstall: 2025,
      status: "kladd",
      opprettetAvId: admin.id,
    },
  });

  // Opprett moduler
  await prisma.modul.deleteMany({ where: { budsjettaarId: aar2025.id } });
  await prisma.modul.createMany({
    data: [
      {
        budsjettaarId: aar2025.id,
        type: "hero",
        rekkefoelge: 0,
        synlig: true,
        konfigurasjon: {
          tittel: "Statsbudsjettet 2025",
          undertittel: "Regjeringens plan for Norge",
        },
      },
      {
        budsjettaarId: aar2025.id,
        type: "plan_for_norge",
        rekkefoelge: 1,
        synlig: true,
        konfigurasjon: {
          overskrift: "Regjeringens plan for Norge",
        },
      },
      {
        budsjettaarId: aar2025.id,
        type: "budsjettgrafer",
        rekkefoelge: 2,
        synlig: true,
        konfigurasjon: {
          overskrift: "Budsjettet i tall",
          forklaringstekst:
            "Statsbudsjettet viser regjeringens forslag til hvordan fellesskapets midler skal brukes.",
          spuForklaring:
            "Overføringen fra oljefondet dekker det oljekorrigerte underskuddet.",
          visEndringDefault: false,
        },
      },
      {
        budsjettaarId: aar2025.id,
        type: "nokkeltall",
        rekkefoelge: 3,
        synlig: true,
        konfigurasjon: {
          tittel: "Nøkkeltall",
          layout: "rad",
        },
      },
    ],
  });

  // Opprett temaer
  await prisma.tema.deleteMany({ where: { budsjettaarId: aar2025.id } });
  await prisma.tema.createMany({
    data: [
      {
        budsjettaarId: aar2025.id,
        rekkefoelge: 0,
        tittel: "Trygghet for økonomien",
        ingress:
          "Regjeringen fører en ansvarlig økonomisk politikk som gir trygghet for arbeidsplasser og velferd.",
        farge: "#2A7F7F",
        prioriteringer: [
          {
            tittel: "Stram finanspolitikk",
            beskrivelse:
              "Holde oljepengebruken innenfor handlingsregelen.",
          },
          {
            tittel: "Styrke arbeidslinjen",
            beskrivelse:
              "Gjøre det lønnsomt å jobbe, og lettere å inkludere flere i arbeidslivet.",
          },
        ],
        budsjettlenker: [
          {
            omrNr: 9,
            visningsnavn: "Arbeid og sosiale formål",
            datareferanse: "utgifter.omraader[omr_nr=9].total",
          },
        ],
      },
      {
        budsjettaarId: aar2025.id,
        rekkefoelge: 1,
        tittel: "Trygghet for helsa",
        ingress:
          "Et sterkt offentlig helsevesen gir trygghet for alle, uansett økonomi.",
        farge: "#B84C3C",
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
          {
            omrNr: 10,
            visningsnavn: "Helse og omsorg",
            datareferanse: "utgifter.omraader[omr_nr=10].total",
          },
        ],
      },
    ],
  });

  // Opprett nøkkeltall
  await prisma.nokkeltall.deleteMany({ where: { budsjettaarId: aar2025.id } });
  await prisma.nokkeltall.createMany({
    data: [
      {
        budsjettaarId: aar2025.id,
        etikett: "Totale utgifter",
        verdi: "2 970,9",
        enhet: "mrd. kr",
        endringsindikator: "opp",
        datareferanse: "utgifter.total",
      },
      {
        budsjettaarId: aar2025.id,
        etikett: "Totale inntekter",
        verdi: "2 796,8",
        enhet: "mrd. kr",
        datareferanse: "inntekter.total",
      },
      {
        budsjettaarId: aar2025.id,
        etikett: "Overføring fra oljefondet",
        verdi: "413,6",
        enhet: "mrd. kr",
        datareferanse: "spu.overfoering_fra_fond",
      },
      {
        budsjettaarId: aar2025.id,
        etikett: "Netto oljepengebruk",
        verdi: "311,3",
        enhet: "mrd. kr",
        datareferanse: "spu.netto_overfoering",
      },
    ],
  });

  console.log("Seed fullført!");
  console.log(`  - 2 brukere (admin, redaktør)`);
  console.log(`  - 1 budsjettår (2025)`);
  console.log(`  - 4 moduler`);
  console.log(`  - 2 temaer`);
  console.log(`  - 4 nøkkeltall`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
