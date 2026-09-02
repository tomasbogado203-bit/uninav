'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import RoleSwitcherPill from '@/components/RoleSwitcherPill'
import {
  IconBook,
  IconUsers,
  IconDocument,
  IconLightbulb,
  IconSparkles,
} from '@/components/icons'

interface GlobalNavbarProps {
  userRole?: 'student' | 'professor' | 'dean' | 'admin'
  userName?: string
  universityName?: string
}

export default function GlobalNavbar({
  userRole = 'student',
  userName,
  universityName,
}: GlobalNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  // Ocultar Navbar en páginas de autenticación/onboarding
  const isAuthPage = pathname === '/login' || pathname.startsWith('/onboarding')

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Atajo de teclado Ctrl + K / Cmd + K para el buscador global
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchModal((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (isAuthPage) return null

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Enlaces de navegación según el rol
  const navLinks = [
    { href: '/', label: 'Inicio', roles: ['student', 'professor', 'dean', 'admin'] },
    { href: '/materias', label: 'Mis Materias', roles: ['student'] },
    { href: '/catedra', label: 'Panel Cátedra', roles: ['professor', 'dean', 'admin'] },
    { href: '/institucional', label: 'Decanato & Retención', roles: ['dean', 'admin'] },
    { href: '/comunidad', label: 'Banco Comunitario', roles: ['student', 'professor', 'dean', 'admin'] },
    { href: '/recursos', label: 'Software & Glosario', roles: ['student'] },
  ]

  const visibleLinks = navLinks.filter((link) => link.roles.includes(userRole))

  const searchItems = [
    { title: 'Análisis Matemático I', href: '/materias', type: 'Materia' },
    { title: 'Álgebra y Geometría Analítica', href: '/materias', type: 'Materia' },
    { title: 'Física I (Mecánica)', href: '/materias', type: 'Materia' },
    { title: 'Chat Tutor Socrático', href: '/materias', type: 'Herramienta RAG' },
    { title: 'Simulador de Parciales', href: '/materias', type: 'Evaluaciones' },
    { title: 'Radar de Cátedra & Mapa de Calor', href: '/catedra', type: 'Docente' },
    { title: 'Centro de Retención Institucional', href: '/institucional', type: 'Decanato' },
    { title: 'Banco Comunitario de Exámenes', href: '/comunidad', type: 'Recursos' },
    { title: 'Glosario y Software por Carrera', href: '/recursos', type: 'Guías' },
  ]

  const filteredSearch = searchItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 border-b select-none ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-md border-slate-200/80 shadow-2xs'
            : 'bg-white/80 backdrop-blur-xs border-slate-200/60'
        }`}
      >
        <div className="mx-auto max-w-[96rem] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Marca UniNav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-black text-base shadow-sm group-hover:scale-105 transition-transform">
                U
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  UniNav
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest -mt-1">
                  AI + IoT
                </span>
              </div>
            </Link>

            {/* Pestañas de Navegación Principal */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-black'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Acciones del Lado Derecho: Buscador, Selector de Rol y Perfil */}
          <div className="flex items-center gap-2.5">
            {/* Botón de Buscador Rápido Command Palette */}
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 px-3 py-1.5 text-xs text-slate-500 font-medium transition-all shadow-2xs cursor-pointer"
            >
              <span>Buscar materias o herramientas...</span>
              <kbd className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 shadow-2xs">
                Ctrl K
              </kbd>
            </button>

            {/* Selector de Rol (Modo Demo) */}
            <RoleSwitcherPill currentRole={userRole} />

            {/* Botón Cerrar Sesión */}
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-all shadow-2xs cursor-pointer"
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Búsqueda Rápida Command Palette (Ctrl + K) */}
      {showSearchModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-900/60 backdrop-blur-2xs p-4 pt-20 animate-in fade-in"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white p-4 sm:p-5 shadow-2xl border border-slate-200 flex flex-col gap-3 animate-in zoom-in-95 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="text-slate-400 text-lg">🔍</span>
              <input
                type="text"
                autoFocus
                placeholder="Escribí para buscar materias, apuntes, herramientas o funciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 text-xs font-bold font-mono"
              >
                ESC
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto flex flex-col gap-1">
              {filteredSearch.length > 0 ? (
                filteredSearch.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setShowSearchModal(false)}
                    className="p-2.5 rounded-xl hover:bg-indigo-50/70 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-400 group-hover:text-indigo-600 font-bold text-xs">
                        →
                      </span>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 group-hover:bg-indigo-100 group-hover:text-indigo-700 px-2 py-0.5 rounded-md">
                      {item.type}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No se encontraron resultados para &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>Navegá rápidamente por toda la plataforma UniNav</span>
              <span>Presioná ESC para cerrar</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
