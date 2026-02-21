import { redirect } from "next/navigation";
import type { Metadata } from "next";

const GJELDENDE_BUDSJETTAAR = 2026;

export const metadata: Metadata = {
  alternates: {
    canonical: `/${GJELDENDE_BUDSJETTAAR}`,
  },
};

export default function Forside() {
  redirect(`/${GJELDENDE_BUDSJETTAAR}`);
}
