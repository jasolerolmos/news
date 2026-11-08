import type { Metadata } from 'next';
import BackToHome from './back-to-home';
import './globals.css';
import './editorial.css';
import './compact.css';

export const metadata: Metadata = {
  title: 'Noticias',
  description: 'Actualidad de ABC, El País, Ideal, Granada Hoy y Xataka.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <BackToHome />
        {children}
      </body>
    </html>
  );
}
