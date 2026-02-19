interface LoadingStateProps {
  tekst?: string;
}

export default function LoadingState({ tekst = "Laster data…" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "var(--space-8)",
        color: "var(--tekst-sekundaer)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--tekst-base)",
      }}
    >
      <span>{tekst}</span>
    </div>
  );
}
