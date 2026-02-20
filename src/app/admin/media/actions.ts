/**
 * Server Actions for mediebibliotek.
 */

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/requireSession";
import { loggRevisjon } from "@/lib/revisjonslogg";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.MEDIA_UPLOAD_DIR ?? "./public/uploads";

export async function lastOppMedia(formData: FormData) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  const fil = formData.get("fil") as File;
  const budsjettaarId = formData.get("budsjettaarId");

  if (!fil) throw new Error("Ingen fil valgt");

  // Valider filtype
  const tillatteTyper = ["image/jpeg", "image/png", "image/webp"];
  if (!tillatteTyper.includes(fil.type)) {
    throw new Error("Ugyldig filtype");
  }

  // Valider størrelse (maks 5 MB)
  if (fil.size > 5 * 1024 * 1024) {
    throw new Error("Filen er for stor (maks 5 MB)");
  }

  // Generer unik filnavn
  const ext = fil.name.split(".").pop() ?? "jpg";
  const unikNavn = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

  // Opprett katalog om den ikke finnes
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  // Lagre fil
  const buffer = Buffer.from(await fil.arrayBuffer());
  const filsti = path.join(UPLOAD_DIR, unikNavn);
  await fs.writeFile(filsti, buffer);

  // Lagringsbane relativ til public
  const lagringsbane = `/uploads/${unikNavn}`;

  const media = await prisma.media.create({
    data: {
      filnavn: fil.name,
      lagringsbane,
      mimeType: fil.type,
      stoerrelseBytes: fil.size,
      budsjettaarId: budsjettaarId ? parseInt(String(budsjettaarId)) : null,
      lastetOppAvId: sesjon.brukerId,
    },
  });

  await loggRevisjon({
    tabell: "media",
    radId: media.id,
    handling: "opprett",
    snapshot: { filnavn: fil.name, mimeType: fil.type },
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/media");

  return {
    id: media.id,
    filnavn: media.filnavn,
    lagringsbane: media.lagringsbane,
    mimeType: media.mimeType,
    stoerrelseBytes: media.stoerrelseBytes,
    altTekst: media.altTekst,
    lastetOppAv: sesjon.navn,
    lastetOppTid: media.lastetOppTid.toISOString(),
    budsjettaar: null,
  };
}

export async function slettMedia(id: number) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new Error("Bilde ikke funnet");

  // Slett fysisk fil
  try {
    const filsti = path.join(process.cwd(), "public", media.lagringsbane);
    await fs.unlink(filsti);
  } catch {
    // Filen finnes kanskje ikke allerede
  }

  await prisma.media.delete({ where: { id } });

  await loggRevisjon({
    tabell: "media",
    radId: id,
    handling: "slett",
    snapshot: { filnavn: media.filnavn },
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/media");
}

export async function oppdaterAltTekst(id: number, altTekst: string) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  await prisma.media.update({
    where: { id },
    data: { altTekst: altTekst || null },
  });

  await loggRevisjon({
    tabell: "media",
    radId: id,
    handling: "endre",
    snapshot: { altTekst },
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/media");
}
