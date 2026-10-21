import odoo from '../../assets/heroes/02-odoo-services-hero.svg?raw';
import custom from '../../assets/heroes/03-custom-industry-solutions-hero.svg?raw';
import ai from '../../assets/heroes/04-ai-automation-hero.svg?raw';
import einvoicing from '../../assets/heroes/05-e-invoicing-hero.svg?raw';
import styles from './HeroReportCard.module.css';

/**
 * Hero illustrations for the service pages and the e-invoicing page, placed inline (like HeroReportCard) so their text uses the site's own
 * Inter and Cormorant Garamond. From each file only the XML header, the Google Fonts <style> and the fixed
 * width/height are dropped; the artwork itself is untouched.
 */
const clean = (svg) =>
  svg
    .replace(/<\?xml[^>]*\?>\s*/, '')
    .replace(/<style>[\s\S]*?<\/style>/, '')
    .replace(' width="640" height="480"', '');

const ART = {
  'odoo-services': clean(odoo),
  'custom-industry-solutions': clean(custom),
  'ai-automation': clean(ai),
  'e-invoicing': clean(einvoicing),
};

export const hasServiceHeroArt = (slug) => slug in ART;

export default function ServiceHeroArt({ slug }) {
  return <div className={styles.card} dangerouslySetInnerHTML={{ __html: ART[slug] }} />;
}
