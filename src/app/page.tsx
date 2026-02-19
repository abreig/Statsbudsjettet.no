import { redirect } from "next/navigation";

const GJELDENDE_BUDSJETTAAR = 2025;

export default function Forside() {
  redirect(`/${GJELDENDE_BUDSJETTAAR}`);
}
