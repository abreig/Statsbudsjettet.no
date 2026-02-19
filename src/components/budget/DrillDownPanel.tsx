"use client";

import { useState } from "react";
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

/**
 * DrillDownPanel — vises inne i ModalOverlay.
 * Støtter dypere navigering: Programområde → Programkategori → Kapittel → Poster.
 */
export default function DrillDownPanel({
  data: initialData,
  hierarkiSti: initialSti,
  onClose,
}: DrillDownPanelProps) {
  // Intern state for dypere navigering
  const [navigasjonsStakk, setNavigasjonsStakk] = useState<
    { data: Programomraade | Programkategori | Kapittel | Post; sti: HierarkiNode[] }[]
  >([{ data: initialData, sti: initialSti }]);

  const gjeldende = navigasjonsStakk[navigasjonsStakk.length - 1];
  const data = gjeldende.data;
  const hierarkiSti = gjeldende.sti;

  const navigerDypere = (
    nyData: Programkategori | Kapittel,
    nyNode: HierarkiNode
  ) => {
    setNavigasjonsStakk((prev) => [
      ...prev,
      { data: nyData, sti: [...hierarkiSti, nyNode] },
    ]);
  };

  const navigerTilbake = (tilIndeks: number) => {
    setNavigasjonsStakk((prev) => prev.slice(0, tilIndeks + 1));
  };

  const total = "total" in data ? (data as { total: number }).total : 0;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          {/* Brødsmulesti */}
          <nav className={styles.breadcrumb} aria-label="Hierarkisk sti">
            {hierarkiSti.map((node, i) => (
              <span key={`${node.nivaa}-${node.id}`}>
                {i > 0 && (
                  <span className={styles.breadcrumbSeparator} aria-hidden="true"> › </span>
                )}
                {i < hierarkiSti.length - 1 ? (
                  <button
                    className={styles.breadcrumbLink}
                    onClick={() => navigerTilbake(i)}
                  >
                    {node.navn}
                  </button>
                ) : (
                  <span aria-current="page">{node.navn}</span>
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
            data: k,
          }))}
          total={data.total}
          onNaviger={(item) =>
            navigerDypere(item.data as Programkategori, {
              nivaa: 3,
              id: item.id,
              navn: item.navn,
            })
          }
        />
      )}

      {erProgramkategori(data) && (
        <KategoriListe
          items={data.kapitler.map((k) => ({
            id: k.kap_nr,
            navn: k.navn,
            belop: k.total,
            data: k,
          }))}
          total={data.total}
          onNaviger={(item) =>
            navigerDypere(item.data as Kapittel, {
              nivaa: 4,
              id: item.id,
              navn: item.navn,
            })
          }
        />
      )}

      {erKapittel(data) && (
        <PostListe poster={data.poster} />
      )}
    </div>
  );
}

interface KategoriItemData {
  id: number;
  navn: string;
  belop: number;
  data: Programkategori | Kapittel;
}

function KategoriListe({
  items,
  total,
  onNaviger,
}: {
  items: KategoriItemData[];
  total: number;
  onNaviger: (item: KategoriItemData) => void;
}) {
  const sortert = [...items].sort((a, b) => b.belop - a.belop);

  return (
    <ul className={styles.kategoriListe} role="list">
      {sortert.map((item) => (
        <li key={item.id} className={styles.kategoriItem}>
          <button
            className={styles.kategoriKnapp}
            onClick={() => onNaviger(item)}
            aria-label={`${item.navn}: ${formaterBelop(item.belop)}. Klikk for detaljer.`}
          >
            <div
              className={styles.kategoriBar}
              style={{
                backgroundColor: "var(--reg-blaa)",
                height: `${Math.max(32, (item.belop / total) * 120)}px`,
              }}
              aria-hidden="true"
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
            <span className={styles.kategoriPil} aria-hidden="true">›</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function PostListe({ poster }: { poster: Post[] }) {
  const sortert = [...poster].sort((a, b) => b.belop - a.belop);

  return (
    <div className={styles.postTabell}>
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
    </div>
  );
}
