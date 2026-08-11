import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Noticias',
    description: 'ABC, El País e Ideal en un solo lugar',
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
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Fuentes */}
                    <div style={{
                        display: 'flex', 
                        gap: '1rem', 
                        justifyContent: 'center', 
                        flexWrap: 'wrap',
                        padding: '1rem',
                        borderBottom: '1px solid var(--bg-color)'
                    }}>
                        <Link href="/" style={{ fontWeight: '800', color: 'var(--text-primary)', textDecoration: 'none' }}>Portada</Link>
                        <span style={{ color: 'var(--border-color)' }}>|</span>
                        <Link href="/abc" style={{ fontWeight: '700', color: 'var(--text-primary)', textDecoration: 'none' }}>ABC</Link>
                        <Link href="/elpais" style={{ fontWeight: '700', color: 'var(--text-primary)', textDecoration: 'none' }}>El País</Link>
                        <Link href="/ideal" style={{ fontWeight: '700', color: 'var(--text-primary)', textDecoration: 'none' }}>Ideal</Link>
                    </div>
                    {/* Categorías Principales */}
                    <div style={{
                        display: 'flex', 
                        gap: '1.25rem', 
                        justifyContent: 'center', 
                        flexWrap: 'wrap',
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-color)',
                        fontSize: '0.85rem'
                    }}>
                        <Link href="/category/espana" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>España</Link>
                        <Link href="/category/internacional" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Internacional</Link>
                        <Link href="/category/economia" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Economía</Link>
                        <Link href="/category/deportes" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Deportes</Link>
                        <Link href="/category/tecnologia" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Tecnología</Link>
                        <Link href="/category/cultura" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Cultura</Link>
                    </div>
                </nav>
                {children}
            </body>
        </html>
    )
}
