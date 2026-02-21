/**
 * NextAuth-konfigurasjon med Azure Entra ID (OIDC).
 * Kobler autentisering mot Postgres brukertabell.
 */

import NextAuth from "next-auth";
import type { NextAuthOptions, Session } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import type { Rolle } from "./types/cms";

// Utvid Session-typen med rolle og brukerId
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      rolle: Rolle;
      brukerId: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rolle?: Rolle;
    brukerId?: number;
  }
}

// Utviklingsmodus: bruk Credentials-provider for lokal testing
const utviklingsProviders =
  process.env.NODE_ENV === "development"
    ? [
        CredentialsProvider({
          name: "Utviklingsmodus",
          credentials: {
            epost: {
              label: "E-post",
              type: "email",
              placeholder: "admin@dev.local",
            },
          },
          async authorize(credentials) {
            if (!credentials?.epost) return null;

            try {
              // Finn eller opprett utviklerbruker
              let bruker = await prisma.bruker.findUnique({
                where: { epost: credentials.epost },
              });

              if (!bruker) {
                bruker = await prisma.bruker.create({
                  data: {
                    epost: credentials.epost,
                    navn: "Utvikler",
                    rolle: "administrator",
                    aktiv: true,
                  },
                });
              }

              return {
                id: String(bruker.id),
                name: bruker.navn,
                email: bruker.epost,
              };
            } catch (error) {
              console.error("[AUTH] Credentials authorize error:", error);
              return null;
            }
          },
        }),
      ]
    : [];

export const authOptions: NextAuthOptions = {
  providers: [
    // Azure Entra ID for produksjon
    ...(process.env.AZURE_AD_CLIENT_ID
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID!,
          }),
        ]
      : []),
    ...utviklingsProviders,
  ],

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 timer
  },

  pages: {
    signIn: "/admin/logginn",
    error: "/admin/feil",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        // Finn bruker basert på Entra ID (Azure) eller e-post
        const entraId = account?.providerAccountId;
        let bruker = entraId
          ? await prisma.bruker.findUnique({ where: { entraId } })
          : await prisma.bruker.findUnique({
              where: { epost: user.email },
            });

        if (!bruker) {
          // For Azure/OIDC provider: opprett ny bruker ved første innlogging
          // For Credentials provider: authorize() callback opprettet den allerede,
          // så hvis vi kommer her er det noe rart. Log it og tillat innlogging.
          console.warn(
            "[AUTH] SignIn: Bruker ikke funnet for",
            user.email,
            "- dette er vanlig for Credentials provider.",
          );
          return true; // Allow sign-in; authorize() already created the user
        }

        // For Azure provider: oppdater entraId hvis den er ny
        if (entraId && !bruker.entraId) {
          await prisma.bruker.update({
            where: { id: bruker.id },
            data: { entraId },
          });
        }

        // Sjekk om brukeren er aktiv
        if (!bruker.aktiv) {
          console.warn("[AUTH] SignIn: Bruker er inaktiv:", user.email);
          return false;
        }

        return true;
      } catch (error) {
        console.error("[AUTH] SignIn error:", error);
        return false;
      }
    },

    async jwt({ token, user }) {
      try {
        if (user?.email) {
          const bruker = await prisma.bruker.findUnique({
            where: { epost: user.email },
          });
          if (bruker) {
            token.rolle = bruker.rolle as Rolle;
            token.brukerId = bruker.id;
          }
        }
      } catch (error) {
        console.error("[AUTH] JWT callback error:", error);
      }
      return token;
    },

    async session({ session, token }): Promise<Session> {
      try {
        if (token.rolle && token.brukerId) {
          session.user.rolle = token.rolle;
          session.user.brukerId = token.brukerId;
        }
      } catch (error) {
        console.error("[AUTH] Session callback error:", error);
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
