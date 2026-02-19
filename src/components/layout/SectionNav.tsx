"use client";

import styles from "./SectionNav.module.css";

interface Ankerpunkt {
  id: string;
  tekst: string;
}

interface SectionNavProps {
  ankerpunkter: Ankerpunkt[];
  aktivt?: string;
}

export default function SectionNav({ ankerpunkter, aktivt }: SectionNavProps) {
  return (
    <nav className={styles.sectionNav} aria-label="Seksjonsnavigasjon">
      <div className={styles.sectionNavInner}>
        {ankerpunkter.map((punkt) => (
          <a
            key={punkt.id}
            href={`#${punkt.id}`}
            className={
              aktivt === punkt.id ? styles.ankerpunktAktiv : styles.ankerpunkt
            }
          >
            {punkt.tekst}
          </a>
        ))}
      </div>
    </nav>
  );
}
