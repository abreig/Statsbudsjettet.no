import styles from "./GrafPlaceholder.module.css";

interface GrafPlaceholderProps {
  tittel: string;
  beskrivelse?: string;
  hoyde?: number;
}

export default function GrafPlaceholder({
  tittel,
  beskrivelse,
  hoyde = 380,
}: GrafPlaceholderProps) {
  return (
    <figure
      className={styles.placeholder}
      style={{ height: hoyde }}
      aria-hidden="true"
    >
      <div className={styles.innhold}>
        {/* Graf-ikon */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          className={styles.ikon}
          aria-hidden="true"
        >
          <rect x="6" y="28" width="8" height="14" rx="2" fill="currentColor" opacity="0.3" />
          <rect x="20" y="18" width="8" height="24" rx="2" fill="currentColor" opacity="0.4" />
          <rect x="34" y="8" width="8" height="34" rx="2" fill="currentColor" opacity="0.5" />
        </svg>
        <div className={styles.label}>Graf under produksjon</div>
        <div className={styles.tittel}>{tittel}</div>
        {beskrivelse && (
          <div className={styles.beskrivelse}>{beskrivelse}</div>
        )}
      </div>
    </figure>
  );
}
