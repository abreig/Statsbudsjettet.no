"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";
import styles from "./ModalOverlay.module.css";

interface ModalOverlayProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
}

const FOKUSBARE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function ModalOverlay({ open, onClose, ariaLabel, children }: ModalOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleTastatur = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const fokusbare = panel.querySelectorAll(FOKUSBARE);
      if (fokusbare.length === 0) return;

      const foerste = fokusbare[0] as HTMLElement;
      const siste = fokusbare[fokusbare.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === foerste) {
          e.preventDefault();
          siste.focus();
        }
      } else {
        if (document.activeElement === siste) {
          e.preventDefault();
          foerste.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    document.addEventListener("keydown", handleTastatur);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleTastatur);
      document.body.style.overflow = "";
    };
  }, [open, handleTastatur]);

  if (!open) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.container}>
        <div
          className={styles.panel}
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
    </>
  );
}
