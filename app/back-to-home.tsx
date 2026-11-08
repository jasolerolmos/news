'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// The homepage has no masthead. Keep a simple way back on legacy views.
export default function BackToHome() {
  const pathname = usePathname();
  if (pathname === '/' || pathname === '/article') return null;
  return <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 1.5rem 0' }}><Link className="news-item-action" href="/">← Noticias</Link></div>;
}
