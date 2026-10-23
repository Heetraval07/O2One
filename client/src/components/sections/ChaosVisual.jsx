import { useEffect, useState } from 'react';
import FlowVisual from './FlowVisual';
import FlowPhone from './FlowPhone';

// The supplied phone animation takes over at 719px and below; tablets and desktops keep the existing one.
const PHONE = '(max-width: 719px)';

/** "Tally, Excel, and WhatsApp" illustration: the phone animation on phones, the existing one everywhere else. */
export default function ChaosVisual() {
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(PHONE).matches);

  useEffect(() => {
    const mq = window.matchMedia(PHONE);
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  return phone ? <FlowPhone /> : <FlowVisual />;
}
