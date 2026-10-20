import styles from './ChaosVisual.module.css';

/**
 * "Tally / Excel / WhatsApp chaos" — built in HTML/CSS rather than an image so it stays sharp.
 * Three disconnected tools, each holding a different version of the truth.
 */
export default function ChaosVisual() {
  return (
    <div className={styles.stage} role="img" aria-label="Orders on WhatsApp, stock in Excel and invoices in Tally, each showing different numbers.">
      <div className={`${styles.card} ${styles.wa}`}>
        <span className={styles.app}>WhatsApp</span>
        <p className={styles.bubble}>Send 40 cartons today pls</p>
        <p className={`${styles.bubble} ${styles.me}`}>Checking stock…</p>
        <p className={styles.bubble}>Any update??</p>
      </div>
      <div className={`${styles.card} ${styles.xl}`}>
        <span className={styles.app}>stock_FINAL_v7.xlsx</span>
        <table className={styles.sheet}>
          <tbody>
            <tr><td>Item</td><td>Qty</td></tr>
            <tr><td>Cartons</td><td className={styles.flag}>32</td></tr>
            <tr><td>Labels</td><td>1,200</td></tr>
            <tr><td>Tape</td><td>#REF!</td></tr>
          </tbody>
        </table>
      </div>
      <div className={`${styles.card} ${styles.tally}`}>
        <span className={styles.app}>Tally</span>
        <dl className={styles.ledger}>
          <div><dt>Cartons in stock</dt><dd className={styles.flag}>55</dd></div>
          <div><dt>Invoices pending</dt><dd>14</dd></div>
        </dl>
      </div>
      <span className={styles.q} aria-hidden="true">?</span>
    </div>
  );
}
