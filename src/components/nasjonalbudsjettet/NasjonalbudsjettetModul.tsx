"use client";

import { useState } from "react";
import type { NasjonalbudsjettetKonfigurasjon } from "./types";
import NasjonalbudsjettetIngressBoks from "./NasjonalbudsjettetIngressBoks";
import NasjonalbudsjettetPanel from "./NasjonalbudsjettetPanel";

interface NasjonalbudsjettetModulProps {
  konfigurasjon: NasjonalbudsjettetKonfigurasjon;
  aar: number;
}

/**
 * Wrapper som kobler IngressBoks og Panel sammen med felles åpen/lukk-tilstand.
 */
export default function NasjonalbudsjettetModul({
  konfigurasjon,
  aar,
}: NasjonalbudsjettetModulProps) {
  const [erAapen, setErAapen] = useState(false);

  return (
    <>
      <NasjonalbudsjettetIngressBoks
        konfigurasjon={konfigurasjon}
        onAapne={() => setErAapen(true)}
        erAapen={erAapen}
      />

      {erAapen && (
        <NasjonalbudsjettetPanel
          konfigurasjon={konfigurasjon}
          aar={aar}
          onLukk={() => setErAapen(false)}
        />
      )}
    </>
  );
}
