/**
 * CmsAnnotert-komponent for visuell klikk-til-felt-redigering.
 * Annoterer redigerbare DOM-elementer i Draft Mode med data-attributter.
 * Et klientscript lytter på klikk og sender postMessage til admin-panelet.
 */

"use client";

import { useEffect } from "react";

interface CmsAnnotertProps {
  felt: string;
  aarstall: number;
  komponent: string;
  children: React.ReactNode;
  erDraftMode?: boolean;
}

export function CmsAnnotert({
  felt,
  aarstall,
  komponent,
  children,
  erDraftMode = false,
}: CmsAnnotertProps) {
  if (!erDraftMode) return <>{children}</>;

  return (
    <span
      data-cms-field={felt}
      data-cms-aarstall={aarstall}
      data-cms-komponent={komponent}
      className="cms-redigerbar"
      style={{
        position: "relative",
        cursor: "pointer",
      }}
    >
      {children}
    </span>
  );
}

/**
 * Klientscript som lytter på klikk i forhåndsvisning
 * og sender navigasjonsmelding til admin-panelet (parent iFrame).
 */
export function CmsKlikkLytter() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest("[data-cms-field]");
      if (!el) return;

      e.preventDefault();

      const htmlEl = el as HTMLElement;
      window.parent.postMessage(
        {
          type: "cms-naviger-til-felt",
          felt: htmlEl.dataset.cmsField,
          aarstall: htmlEl.dataset.cmsAarstall,
          komponent: htmlEl.dataset.cmsKomponent,
        },
        window.location.origin
      );
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <style>{`
      .cms-redigerbar {
        outline: 2px dashed transparent;
        transition: outline-color 0.15s;
      }
      .cms-redigerbar:hover {
        outline-color: var(--reg-blaa, #4156A6);
        outline-offset: 2px;
      }
      .cms-redigerbar:hover::after {
        content: attr(data-cms-field);
        position: absolute;
        top: -1.5rem;
        left: 0;
        background: var(--reg-blaa, #4156A6);
        color: #fff;
        font-size: 0.625rem;
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        white-space: nowrap;
        z-index: 1000;
      }
    `}</style>
  );
}
