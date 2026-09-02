'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import RoleSwitcherPill from '@/components/RoleSwitcherPill'
import {
  IconHome,
  IconBook,
  IconDocument,
  IconChat,
  IconQuiz,
  IconCalendar,
  IconCamera,
  IconFlame,
  IconSettings,
  IconLogOut,
  IconSparkles,
  IconChevronDown,
  IconChevronRight,
  IconChevronLeft,
  IconPlus,
  IconArrowsExchange,
  IconUsers,
  IconBuilding,
} from '@/components/icons'

export interface SubjectItem {
  id: string
  name: string
  color?: string
}

interface UnifiedAppSidebarProps {
  userName?: string
  careerName?: string | null
  universityName?: string
  userRole?: 'student' | 'professor' | 'dean' | 'admin'
  streakDays?: number
  subjects?: SubjectItem[]
}

export default function UnifiedAppSidebar({
  userName = 'Estudiante',
  careerName,
  universityName,
  userRole = 'student',
  streakDays = 1,
  subjects = [],
}: UnifiedAppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [materiasListOpen, setMateriasListOpen] = useState(true)

  // Ocultar en páginas públicas
  if (pathname === '/login' || pathname.startsWith('/onboarding')) {
    return null
  }

  // Detectar si estamos dentro de una materia específica (/materias/[subjectId]/...)
  const match = pathname.match(/^\/materias\/([a-zA-Z0-9_-]+)/)
  const activeSubjectId = match && match[1] !== 'new' ? match[1] : null
  const activeSubject = subjects.find((s) => s.id === activeSubjectId)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isNavActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  // Enlaces de Navegación Global
  const globalNavItems = [
    { label: 'Inicio', icon: IconHome, href: '/', exact: true, show: true },
    { label: 'Mis Materias', icon: IconBook, href: '/materias', exact: true, show: userRole === 'student' },
    { label: 'Banco Comunitario', icon: IconUsers, href: '/comunidad', exact: false, show: true },
    { label: 'Recursos & Glosario', icon: IconSparkles, href: '/recursos', exact: false, show: userRole === 'student' },
    { label: 'Panel de Cátedra', icon: IconBook, href: '/catedra', exact: false, show: userRole === 'professor' || userRole === 'dean' || userRole === 'admin' },
    { label: 'Centro de Retención', icon: IconBuilding, href: '/institucional', exact: false, show: userRole === 'dean' || userRole === 'admin' },
  ].filter((item) => item.show)

  // Herramientas del Workspace de la Materia Activa
  const subjectTools = activeSubjectId
    ? [
        { label: 'Apuntes', icon: IconDocument, href: `/materias/${activeSubjectId}`, exact: true },
        { label: 'Chat Socrático (RAG)', icon: IconChat, href: `/materias/${activeSubjectId}/temas`, exact: false },
        { label: 'Simulador de Parcial', icon: IconQuiz, href: `/materias/${activeSubjectId}/simulador`, exact: false },
        { label: 'Tarjetas Didácticas', icon: IconSparkles, href: `/materias/${activeSubjectId}/tarjetas`, exact: false },
        { label: 'Calendario de Materia', icon: IconCalendar, href: `/materias/${activeSubjectId}/calendario`, exact: false },
        { label: 'Pizarra de Clase', icon: IconCamera, href: `/materias/${activeSubjectId}/pizarra`, exact: false },
      ]
    : []

  const formattedActiveName = activeSubject
    ? activeSubject.name.charAt(0).toUpperCase() + activeSubject.name.slice(1)
    : 'Materia'

  return (
    <aside
      className={`sticky top-0 h-screen flex flex-col border-r border-slate-200/90 bg-white text-slate-800 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60 xl:w-64'
      } shrink-0 z-30 select-none overflow-hidden`}
    >
      {/* Botón de Colapsar / Expandir Sidebar con SVG */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer"
        title={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
      >
        {collapsed ? (
          <IconChevronRight className="w-3.5 h-3.5" />
        ) : (
          <IconChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Header Fijo: Logo Marca UniNav */}
      <div className="flex items-center justify-between border-b border-slate-100 p-3.5 shrink-0">
        {!collapsed ? (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm shadow-xs group-hover:bg-indigo-700 transition-colors">
              U
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm tracking-tight block leading-none">
                UniNav
              </span>
              <span className="text-[9px] font-semibold text-indigo-600">
                AI + Socrático
              </span>
            </div>
          </Link>
        ) : (
          <Link
            href="/"
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm shadow-xs"
            title="UniNav Inicio"
          >
            U
          </Link>
        )}
      </div>

      {/* Contenedor Scrollable de Navegación */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col scrollbar-none">
        {/* 1. Navegación Principal Global */}
        <div className="p-2.5 border-b border-slate-100 flex flex-col gap-0.5 shrink-0">
          {!collapsed && (
            <span className="px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 block">
              Navegación
            </span>
          )}

          {globalNavItems.map((gItem) => {
            const Icon = gItem.icon
            const active = isNavActive(gItem.href, gItem.exact)
            return (
              <Link
                key={gItem.href}
                href={gItem.href}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? gItem.label : undefined}
              >
                <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                {!collapsed && <span className="truncate">{gItem.label}</span>}
              </Link>
            )
          })}
        </div>

        {/* 2. Si hay una materia activa: Mostrar menú de herramientas de la materia */}
        {activeSubjectId && activeSubject && (
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-1">
            {!collapsed ? (
              <div className="flex items-center justify-between px-1 mb-1">
                <div className="flex flex-col gap-0.5 truncate">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    Materia Actual
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate" title={formattedActiveName}>
                    {formattedActiveName}
                  </span>
                </div>
                <Link
                  href="/materias"
                  className="text-[10px] text-slate-400 hover:text-slate-700 font-semibold p-1 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shrink-0"
                  title="Cambiar de materia"
                >
                  <IconArrowsExchange className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="mx-auto my-1" title={formattedActiveName}>
                <IconBook className="w-4 h-4 text-indigo-600" />
              </div>
            )}

            {/* Lista de Herramientas de la Materia */}
            <div className="flex flex-col gap-0.5">
              {subjectTools.map((tool) => {
                const Icon = tool.icon
                const active = isNavActive(tool.href, tool.exact)

                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-slate-900 text-white font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                    title={collapsed ? tool.label : undefined}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {!collapsed && <span className="truncate">{tool.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* 3. Lista de Todas las Materias (Tus Materias) */}
        {userRole === 'student' && subjects.length > 0 && (
          <div className="p-2.5 flex flex-col gap-1">
            {!collapsed && (
              <div className="flex items-center justify-between px-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                <span>Tus Materias ({subjects.length})</span>
                <Link
                  href="/materias"
                  className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors flex items-center gap-0.5"
                  title="Agregar nueva materia"
                >
                  <IconPlus className="w-2.5 h-2.5" />
                  <span>Nueva</span>
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              {subjects.map((sub) => {
                const isSelected = activeSubjectId === sub.id
                const formattedName = sub.name.charAt(0).toUpperCase() + sub.name.slice(1)

                return (
                  <Link
                    key={sub.id}
                    href={`/materias/${sub.id}`}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100/80 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                    title={sub.name}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                    {!collapsed && <span className="truncate">{formattedName}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Fijo con Racha, Perfil y Selector de Rol */}
      <div className="border-t border-slate-100 p-2.5 bg-slate-50/50 flex flex-col gap-2 shrink-0 mt-auto">
        {/* Racha Activa */}
        {userRole === 'student' && (
          <>
            {!collapsed ? (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200/80 rounded-xl px-2.5 py-1 text-amber-800 text-xs shadow-2xs">
                <span className="flex items-center gap-1.5 font-bold text-[11px]">
                  <IconFlame className="w-3.5 h-3.5 text-amber-500" />
                  Racha: {streakDays} {streakDays === 1 ? 'día' : 'días'}
                </span>
                <span className="text-[9px] text-amber-700 font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                  ACTIVO
                </span>
              </div>
            ) : (
              <div
                className="mx-auto flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
                title={`Racha: ${streakDays} días`}
              >
                <IconFlame className="w-4 h-4" />
              </div>
            )}
          </>
        )}

        {/* Tarjeta de Perfil y Botón de Configuración */}
        <div className="flex items-center justify-between gap-2">
          {!collapsed ? (
            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0 shadow-2xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate leading-none">
                  {userName}
                </span>
                {careerName && (
                  <span
                    className="text-[9px] text-slate-500 truncate block mt-0.5"
                    title={careerName}
                  >
                    {careerName}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div
              className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs"
              title={userName}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          )}

          {!collapsed && (
            <button
              type="button"
              onClick={() => setShowConfigModal(!showConfigModal)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
              title="Configuración de usuario"
            >
              <IconSettings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Modal de Ajustes / Cambiar Rol / Cerrar Sesión */}
        {showConfigModal && !collapsed && (
          <div className="mt-1 rounded-2xl border border-slate-200 bg-white p-2.5 flex flex-col gap-2 text-xs shadow-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ajustes de Perfil
              </span>
              <RoleSwitcherPill currentRole={userRole} />
            </div>

            <Link
              href="/onboarding"
              className="px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs"
            >
              <span>Cambiar Carrera</span>
              <IconChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-between font-semibold cursor-pointer text-xs"
            >
              <span className="flex items-center gap-1.5">
                <IconLogOut className="w-3 h-3" />
                Cerrar Sesión
              </span>
              <IconChevronRight className="w-3.5 h-3.5 text-rose-400" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
