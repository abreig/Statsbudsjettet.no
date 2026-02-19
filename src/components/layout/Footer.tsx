import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.info}>
          <p>Statsbudsjettet.no</p>
          <p>Kilde: Finansdepartementet &ndash; Gul bok</p>
        </div>
        <nav aria-label="Bunnnavigasjon">
          <ul className={styles.lenker}>
            <li>
              <a href="https://www.regjeringen.no" target="_blank" rel="noopener noreferrer">
                Regjeringen.no
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
