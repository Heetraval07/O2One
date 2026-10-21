import svgSource from '../../assets/business-consultation-hero-report-card.svg?raw';
import styles from './HeroReportCard.module.css';

/**
 * Hero visual for Business Consultation: the supplied report-card SVG, placed inline so it picks up the
 * site's own Inter and Cormorant Garamond (an <img> can't load the page fonts). Only three things are
 * adjusted from the file: the XML header and its Google Fonts <style> are dropped (the site already ships
 * these fonts), the fixed width/height are removed so CSS can size it, and the filter id is made unique.
 */
const markup = svgSource
  .replace(/<\?xml[^>]*\?>\s*/, '')
  .replace(/<style>[\s\S]*?<\/style>\s*/, '')
  .replace('width="640" height="480" ', '')
  .replace(/id="shadow"/, 'id="bc-report-shadow"')
  .replace('url(#shadow)', 'url(#bc-report-shadow)');

export default function HeroReportCard() {
  return <div className={styles.card} dangerouslySetInnerHTML={{ __html: markup }} />;
}
