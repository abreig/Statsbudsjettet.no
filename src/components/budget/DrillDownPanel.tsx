"use client";

import { useEffect, useRef } from "react";
import type {
  Programomraade,
  Programkategori,
  Kapittel,
  Post,
  HierarkiNode,
} from "@/components/data/types/budget";
import { formaterBelop } from "@/components/shared/NumberFormat";
import styles from "./DrillDownPanel.module.css";

interface DrillDownPanelProps {
  data: Programomraade | Programkategori | Kapittel | Post;
  hierarkiSti: HierarkiNode[];
  onNavigate: (node: HierarkiNode) => void;
  onClose: () => void;
  visEndring: boolean;
}

function erProgramomraade(data: unknown): data is Programomraade {
  return (data as Programomraade).kategorier !== undefined;
}

function erProgramkategori(data: unknown): data is Programkategori {
  return (data as Programkategori).kapitler !== undefined;
}

function erKapittel(data: unknown): data is Kapittel {
  return (data as Kapittel).poster !== undefined;
}

export default function DrillDownPanel({
  data,
  hierarkiSti,
  onNavigate,
  onClose,
}: DrillDownPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Fokus-trap og Escape-lukking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    // Fokuser panelet ved åpning
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const total = "total" in data ? (data as { total: number }).total : 0;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div
        className={styles.panel}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drilldown-tittel"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div>
            {/* Brødsmulesti */}
            <nav className={styles.breadcrumb} aria-label="Hierarkisk sti">
              {hierarkiSti.map((node, i) => (
                <span key={`${node.nivaa}-${node.id}`}>
                  {i > 0 && (
                    <span className={styles.breadcrumbSeparator}> › </span>
                  )}
                  {i < hierarkiSti.length - 1 ? (
                    <button
                      className={styles.breadcrumbLink}
                      onClick={() => onNavigate(node)}
                    >
                      {node.navn}
                    </button>
                  ) : (
                    <span>{node.navn}</span>
                  )}
                </span>
              ))}
            </nav>

            <h3 id="drilldown-tittel" className={styles.tittel}>
              {data.navn}
            </h3>
            {total > 0 && (
              <div className={styles.total}>{formaterBelop(total)}</div>
            )}
          </div>

          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Lukk panel"
          >
            ✕
          </button>
        </div>

        {/* Innhold basert på datanivå */}
        {erProgramomraade(data) && (
          <KategoriListe
            items={data.kategorier.map((k) => ({
              id: k.kat_nr,
              navn: k.navn,
              belop: k.total,
            }))}
            total={data.total}
          />
        )}

        {erProgramkategori(data) && (
          <KategoriListe
            items={data.kapitler.map((k) => ({
              id: k.kap_nr,
              navn: k.navn,
              belop: k.total,
            }))}
            total={data.total}
          />
        )}

        {erKapittel(data) && (
          <PostListe poster={data.poster} />
        )}
      </div>
    </>
  );
}

function KategoriListe({
  items,
  total,
}: {
  items: { id: number; navn: string; belop: number }[];
  total: number;
}) {
  const sortert = [...items].sort((a, b) => b.belop - a.belop);

  return (
    <ul className={styles.kategoriListe}>
      {sortert.map((item) => (
        <li key={item.id} className={styles.kategoriItem}>
          <div
            className={styles.kategoriBar}
            style={{
              backgroundColor: "var(--reg-blaa)",
              height: `${Math.max(32, (item.belop / total) * 120)}px`,
            }}
          />
          <div className={styles.kategoriInfo}>
            <div className={styles.kategoriNavn}>{item.navn}</div>
            <div className={styles.kategoriBelop}>
              {formaterBelop(item.belop)}
            </div>
          </div>
          <div className={styles.kategoriAndel}>
            {((item.belop / total) * 100).toFixed(1)} %
          </div>
        </li>
      ))}
    </ul>
  );
}

function PostListe({ poster }: { poster: Post[] }) {
  const sortert = [...poster].sort((a, b) => b.belop - a.belop);

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)", fontSize: "var(--tekst-sm)" }}>
      <caption className="sr-only">Poster i kapittelet</caption>
      <thead>
        <tr style={{ borderBottom: "2px solid var(--reg-lysgraa)" }}>
          <th scope="col" style={{ textAlign: "left", padding: "var(--space-2)", fontWeight: "var(--vekt-semibold)" }}>Post</th>
          <th scope="col" style={{ textAlign: "left", padding: "var(--space-2)", fontWeight: "var(--vekt-semibold)" }}>Navn</th>
          <th scope="col" style={{ textAlign: "right", padding: "var(--space-2)", fontWeight: "var(--vekt-semibold)" }}>Beløp</th>
        </tr>
      </thead>
      <tbody>
        {sortert.map((post) => (
          <tr
            key={`${post.post_nr}-${post.upost_nr}`}
            style={{ borderBottom: "1px solid var(--reg-lysgraa)" }}
          >
            <td style={{ padding: "var(--space-2)", fontFamily: "var(--font-tall)" }}>
              {post.post_nr}
              {post.upost_nr > 0 ? `.${post.upost_nr}` : ""}
            </td>
            <td style={{ padding: "var(--space-2)" }}>{post.navn}</td>
            <td style={{ padding: "var(--space-2)", textAlign: "right", fontFamily: "var(--font-tall)" }}>
              {formaterBelop(post.belop)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
