import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { StudyTimerProvider } from '@/context/StudyTimerContext'
import StudyTimerCapsule from '@/components/StudyTimerCapsule'
import AppShellServer from '@/components/AppShellServer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'UniNav — Acompañamiento Universitario Socrático',
  description: 'Plataforma para estudiantes universitarios con tutor socrático RAG e inteligencia artificial.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        <StudyTimerProvider>
          {/* Cápsula Flotante y Arrastrable de Productividad Pomodoro / IoT */}
          <StudyTimerCapsule />
          {/* App Shell con Barra Lateral Persistente y Cero Saltos */}
          <AppShellServer>{children}</AppShellServer>
        </StudyTimerProvider>
      </body>
    </html>
  )
}
