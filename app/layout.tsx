import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import './editorial.css';

export const metadata: Metadata = {
  title: 'Noticias | Tu lectura diaria',
  description: 'Actualidad de ABC, El País, Ideal, Granada Hoy y Xataka en un solo lugar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="site-header" style={{ margin: 0, textAlign: 'left' }}>
          <div className="site-header-inner">
            <Link className="site-brand" href="/"><span aria-hidden="true" className="site-brand-mark">N</span>Noticias<span style={{ color: 'var(--green)' }}>.</span></Link>
            <nav className="site-links" aria-label="Fuentes">
              <Link href="/">Portada</Link>
              <Link href="/abc">ABC</Link>
              <Link href="/elpais">El País</Link>
              <Link href="/ideal">Ideal</Link>
              <Link href="/granadahoy">Granada Hoy</Link>
              <Link href="/xataka">Xataka</Link>
            </nav>
          </div>
          <div className="site-topics-wrap">
            <nav className="site-topics" aria-label="Temas">
              <span className="site-topics-label">Explorar</span>
              <Link href="/category/espana">España</Link>
              <Link href="/category/internacional">Internacional</Link>
              <Link href="/category/economia">Economía</Link>
              <Link href="/category/deportes">Deportes</Link>
              <Link href="/category/tecnologia">Tecnología</Link>
              <Link href="/category/cultura">Cultura</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
