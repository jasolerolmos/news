import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Agregador de Noticias',
    description: 'ABC y El País en un solo lugar',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&display=swap" rel="stylesheet" />
            </head>
            <body className={inter.className}>
                <nav style={{ 
                    background: 'var(--card-bg)', 
                    borderBottom: '1px solid var(--border-color)', 
                    padding: '1rem', 
                    display: 'flex', 
                    gap: '1.5rem', 
                    justifyContent: 'center', 
                    flexWrap: 'wrap',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <Link href="/" style={{ fontWeight: 'bold', marginRight: '1rem', color: 'var(--text-primary)', textDecoration: 'none' }}>Portada</Link>
                    <Link href="/category/espana" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>España</Link>
                    <Link href="/category/internacional" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Internacional</Link>
                    <Link href="/category/economia" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Economía</Link>
                    <Link href="/category/deportes" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Deportes</Link>
                    <Link href="/category/tecnologia" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Tecnología</Link>
                    <Link href="/category/cultura" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Cultura</Link>
                </nav>
                {children}
            </body>
        </html>
    )
}
