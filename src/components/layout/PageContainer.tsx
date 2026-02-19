import styles from "./PageContainer.module.css";

interface PageContainerProps {
  children: React.ReactNode;
}

export default function PageContainer({ children }: PageContainerProps) {
  return <div className={styles.container}>{children}</div>;
}
