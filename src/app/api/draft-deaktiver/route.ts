/**
 * Deaktiverer Next.js Draft Mode.
 */

import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {
  (await draftMode()).disable();
  redirect("/admin");
}
