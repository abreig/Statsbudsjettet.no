"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TILGJENGELIGE_AAR } from "@/lib/mock-cms";
import styles from "./Header.module.css";

interface HeaderProps {
  aar?: number;
}

export default function Header({ aar = 2026 }: HeaderProps) {
  const [menyAapen, setMenyAapen] = useState(false);
  const router = useRouter();

  const handleAarEndring = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nyttAar = e.target.value;
    router.push(`/${nyttAar}`);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href={`/${aar}`} className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/rikslove.svg`}
            alt=""
            className={styles.rikslove}
            aria-hidden="true"
          />
          Statsbudsjettet
        </Link>

        <nav aria-label="Hovednavigasjon">
          <ul className={styles.nav}>
            <li>
              <a href="#plan" className={styles.navLink}>
                Regjeringens plan
              </a>
            </li>
            <li>
              <a href="#budsjett" className={styles.navLink}>
                Budsjettet
              </a>
            </li>
            <li>
              <a href="#nokkeltall" className={styles.navLink}>
                Nøkkeltall
              </a>
            </li>
            <li>
              <Link href="/historikk" className={styles.navLink}>
                Historikk
              </Link>
            </li>
          </ul>
        </nav>

        <select
          className={styles.aarVelger}
          value={aar}
          aria-label="Velg budsjettår"
          onChange={handleAarEndring}
        >
          {TILGJENGELIGE_AAR.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <button
          className={styles.hamburger}
          aria-label={menyAapen ? "Lukk meny" : "Åpne meny"}
          aria-expanded={menyAapen}
          onClick={() => setMenyAapen(!menyAapen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menyAapen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <>
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </>
            )}
          </svg>
        </button>
      </div>

      <div className={styles.mobileMenu} data-open={menyAapen}>
        <a href="#plan" className={styles.navLink} onClick={() => setMenyAapen(false)}>
          Regjeringens plan
        </a>
        <a href="#budsjett" className={styles.navLink} onClick={() => setMenyAapen(false)}>
          Budsjettet
        </a>
        <a href="#nokkeltall" className={styles.navLink} onClick={() => setMenyAapen(false)}>
          Nøkkeltall
        </a>
        <Link href="/historikk" className={styles.navLink} onClick={() => setMenyAapen(false)}>
          Historikk
        </Link>
      </div>
    </header>
  );
}
