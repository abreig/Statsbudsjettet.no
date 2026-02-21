"use client";

import { useRef, useState, useEffect } from "react";
import styles from "./HighchartsEmbed.module.css";

interface HighchartsEmbedProps {
  tittel: string;
  kilde?: string;
  iframe_url?: string;
  config?: object;
  hoyde?: number;
}

export default function HighchartsEmbed({
  tittel,
  kilde,
  iframe_url,
  hoyde = 380,
}: HighchartsEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [synlig, setSynlig] = useState(false);

  // Lazy-loading: last kun når komponenten er i viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSynlig(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <figure className={styles.figur} ref={ref}>
      {iframe_url && synlig ? (
        <div className={styles.iframeWrapper} style={{ height: hoyde }}>
          <iframe
            src={iframe_url}
            title={tittel}
            width="100%"
            height={hoyde}
            style={{ border: "none" }}
            loading="lazy"
          />
        </div>
      ) : iframe_url && !synlig ? (
        <div
          className={styles.lasterWrapper}
          style={{ height: hoyde }}
          aria-hidden="true"
        >
          <span className={styles.lasterTekst}>Laster graf...</span>
        </div>
      ) : null}

      {(tittel || kilde) && (
        <figcaption className={styles.figurtekst}>
          {tittel && <span className={styles.grafTittel}>{tittel}</span>}
          {kilde && (
            <span className={styles.kilde}>
              Kilde: {kilde}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
