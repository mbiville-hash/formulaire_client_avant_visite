import type { Metadata } from 'next'
import { Bodoni_Moda, Montserrat } from 'next/font/google'
import './globals.css'

const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-bodoni',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fortisrenovation.fr'),
  title: 'Préparation RDV salle de bain | Fortis Rénovation',
  description:
    'Formulaire de préparation pour une visite de qualification de rénovation de salle de bain avec Fortis Rénovation.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${bodoni.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  )
}
