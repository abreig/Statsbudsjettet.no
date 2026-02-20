/**
 * Server-side sesjonskrav med rollesjekk.
 * Brukes i Server Components og Server Actions for å kreve autentisering.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import type { Rolle } from "./types/cms";

export interface AuthSession {
  brukerId: number;
  rolle: Rolle;
  navn: string;
  epost: string;
}

/**
 * Krever en autentisert sesjon med en av de angitte rollene.
 * Redirecter til innlogging hvis ikke autentisert.
 * Kaster feil hvis brukeren ikke har riktig rolle.
 */
export async function requireSession(
  tillattRoller: Rolle[]
): Promise<AuthSession> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/admin/logginn");
  }

  const { rolle, brukerId } = session.user;

  if (!tillattRoller.includes(rolle)) {
    throw new Error("Utilstrekkelige rettigheter");
  }

  return {
    brukerId,
    rolle,
    navn: session.user.name ?? "",
    epost: session.user.email ?? "",
  };
}

/**
 * Sjekker om brukeren har en gyldig sesjon uten å redirecte.
 * Nyttig for betinget rendering i Server Components.
 */
export async function hentSesjon(): Promise<AuthSession | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.rolle || !session.user.brukerId) {
    return null;
  }

  return {
    brukerId: session.user.brukerId,
    rolle: session.user.rolle,
    navn: session.user.name ?? "",
    epost: session.user.email ?? "",
  };
}
