"use client";

import { useState } from "react";
import type {
  Programomraade,
  Programkategori,
  Kapittel,
  Post,
  HierarkiNode,
} from "@/components/data/types/budget";
import type { EndringsData } from "@/components/data/types/budget";
import type { OmrOmtale } from "@/lib/mock-omtaler";
import { formaterBelop } from "@/components/shared/NumberFormat";
import ChangeIndicator from "./ChangeIndicator";
import styles from "./DrillDownPanel.module.css";

interface DrillDownPanelProps {
  data: Programomraade | Programkategori | Kapittel | Post;
  hierarkiSti: HierarkiNode[];
  onNavigate: (node: HierarkiNode) => void;
  onClose: () => void;
  visEndring: boolean;
  omtale?: OmrOmtale | null;
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
  visEndring,
  omtale,
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
            <div className={styles.total}>
              {formaterBelop(total)}
              {visEndring && "endring_fra_saldert" in data && (data as { endring_fra_saldert: EndringsData | null }).endring_fra_saldert && (
                <span style={{ marginLeft: "var(--space-2)" }}>
                  <ChangeIndicator
                    endring_absolut={(data as { endring_fra_saldert: EndringsData }).endring_fra_saldert.endring_absolut}
                    endring_prosent={(data as { endring_fra_saldert: EndringsData }).endring_fra_saldert.endring_prosent}
                  />
                </span>
              )}
            </div>
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

      {/* Redaksjonell omtale (vises kun på toppnivå — programområde) */}
      {omtale && navigasjonsStakk.length === 1 && (
        <OmtaleVisning omtale={omtale} />
      )}

      {/* Innhold basert på datanivå */}
      {erProgramomraade(data) && (
        <KategoriListe
          items={data.kategorier.map((k) => ({
            id: k.kat_nr,
            prefiks: `Kat. ${String(k.kat_nr).replace(/^(\d{2})(\d{2})$/, "$1.$2")}`,
            navn: k.navn,
            belop: k.total,
            data: k,
            endring: k.endring_fra_saldert,
          }))}
          total={data.total}
          visEndring={visEndring}
          onNaviger={(item) =>
            navigerDypere(item.data as Programkategori, {
              nivaa: 3,
              id: item.id,
              navn: item.prefiks ? `${item.prefiks} ${item.navn}` : item.navn,
            })
          }
        />
      )}

      {erProgramkategori(data) && (
        <KategoriListe
          items={data.kapitler.map((k) => ({
            id: k.kap_nr,
            prefiks: `Kap. ${k.kap_nr}`,
            navn: k.navn,
            belop: k.total,
            data: k,
            endring: k.endring_fra_saldert,
          }))}
          total={data.total}
          visEndring={visEndring}
          onNaviger={(item) =>
            navigerDypere(item.data as Kapittel, {
              nivaa: 4,
              id: item.id,
              navn: item.prefiks ? `${item.prefiks} ${item.navn}` : item.navn,
            })
          }
        />
      )}

      {erKapittel(data) && (
        <PostListe poster={data.poster} visEndring={visEndring} />
      )}
    </div>
  );
}

interface KategoriItemData {
  id: number;
  prefiks?: string;
  navn: string;
  belop: number;
  data: Programkategori | Kapittel;
  endring?: EndringsData | null;
}

function KategoriListe({
  items,
  total,
  visEndring,
  onNaviger,
}: {
  items: KategoriItemData[];
  total: number;
  visEndring: boolean;
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
              <div className={styles.kategoriNavn}>
                {item.prefiks && (
                  <span className={styles.kategoriPrefiks}>{item.prefiks}</span>
                )}
                {item.navn}
              </div>
              <div className={styles.kategoriBelop}>
                {formaterBelop(item.belop)}
                {visEndring && item.endring && (
                  <span style={{ marginLeft: "var(--space-1)" }}>
                    <ChangeIndicator
                      endring_absolut={item.endring.endring_absolut}
                      endring_prosent={item.endring.endring_prosent}
                      compact
                    />
                  </span>
                )}
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

function OmtaleVisning({ omtale }: { omtale: OmrOmtale }) {
  return (
    <div className={styles.omtale}>
      {omtale.ingress && (
        <p className={styles.omtaleIngress}>{omtale.ingress}</p>
      )}
      {omtale.brodtekst && (
        <div className={styles.omtaleBrodtekst}>
          {omtale.brodtekst.split("\n\n").map((avsnitt, i) => (
            <p key={i}>{avsnitt}</p>
          ))}
        </div>
      )}
      {omtale.grafer && omtale.grafer.length > 0 && (
        <div className={styles.omtaleGrafer}>
          {omtale.grafer.map((graf, i) => (
            <div key={i} className={styles.grafContainer}>
              <h4 className={styles.grafTittel}>{graf.tittel}</h4>
              {graf.type === "barplot" && graf.manuellData && (
                <MiniBarplot data={graf.manuellData} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniBarplot({ data }: { data: { etikett: string; verdi: number }[] }) {
  const maxVerdi = Math.max(...data.map((d) => d.verdi));
  const maxHoyde = 100;

  return (
    <div className={styles.miniBarplot} role="img" aria-label="Søylediagram">
      {data.map((d, i) => {
        const hoyde = maxVerdi > 0 ? (d.verdi / maxVerdi) * maxHoyde : 0;
        const erSiste = i === data.length - 1;
        return (
          <div key={d.etikett} className={styles.barplotKolonne}>
            <div className={styles.barplotVerdi}>{d.verdi}</div>
            <div
              className={styles.barplotBar}
              style={{
                height: `${hoyde}px`,
                backgroundColor: erSiste ? "var(--reg-marine)" : "var(--reg-lyseblaa)",
              }}
            />
            <div className={styles.barplotEtikett}>{d.etikett}</div>
          </div>
        );
      })}
    </div>
  );
}

function PostListe({ poster, visEndring }: { poster: Post[]; visEndring: boolean }) {
  const sortert = [...poster].sort((a, b) => b.belop - a.belop);
  const harEndring = visEndring && poster.some((p) => p.endring_fra_saldert !== null);
  const harNyePost = poster.some((p) => p.endring_fra_saldert === null && visEndring);

  return (
    <div className={styles.postTabell}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)", fontSize: "var(--tekst-sm)" }}>
        <caption className="sr-only">Poster i kapittelet</caption>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--reg-lysgraa)" }}>
            <th scope="col" style={{ textAlign: "left", padding: "var(--space-2)", fontWeight: "var(--vekt-semibold)" }}>Post</th>
            <th scope="col" style={{ textAlign: "left", padding: "var(--space-2)", fontWeight: "var(--vekt-semibold)" }}>Navn</th>
            <th scope="col" style={{ textAlign: "right", padding: "var(--space-2)", fontWeight: "var(--vekt-semibold)" }}>Beløp</th>
            {harEndring && (
              <>
                <th scope="col" style={{ textAlign: "right", padding: "var(--space-2)", fontWeight: "var(--vekt-semibold)" }}>Saldert</th>
                <th scope="col" style={{ textAlign: "right", padding: "var(--space-2)", fontWeight: "var(--vekt-semibold)" }}>Endring</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sortert.map((post) => {
            const endring = post.endring_fra_saldert;
            const erNyPost = visEndring && endring === null && harNyePost;
            return (
              <tr
                key={`${post.post_nr}-${post.upost_nr}`}
                style={{
                  borderBottom: "1px solid var(--reg-lysgraa)",
                  backgroundColor: erNyPost ? "rgba(255, 223, 79, 0.1)" : undefined,
                }}
              >
                <td style={{ padding: "var(--space-2)", fontFamily: "var(--font-tall)" }}>
                  {post.post_nr}
                  {post.upost_nr > 0 ? `.${post.upost_nr}` : ""}
                </td>
                <td style={{ padding: "var(--space-2)" }}>{post.navn}</td>
                <td style={{ padding: "var(--space-2)", textAlign: "right", fontFamily: "var(--font-tall)" }}>
                  {formaterBelop(post.belop)}
                </td>
                {harEndring && (
                  <>
                    <td style={{ padding: "var(--space-2)", textAlign: "right", fontFamily: "var(--font-tall)", color: "var(--tekst-sekundaer)" }}>
                      {endring ? formaterBelop(endring.saldert_forrige) : "—"}
                    </td>
                    <td style={{ padding: "var(--space-2)", textAlign: "right" }}>
                      {erNyPost ? (
                        <ChangeIndicator endring_absolut={null} endring_prosent={null} er_ny_post compact />
                      ) : endring ? (
                        <ChangeIndicator
                          endring_absolut={endring.endring_absolut}
                          endring_prosent={endring.endring_prosent}
                          compact
                        />
                      ) : null}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
