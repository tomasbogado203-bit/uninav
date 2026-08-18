'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  renameThreadAction,
  deleteThreadAction,
  createThread,
} from '@/app/materias/[subjectId]/temas/actions'
import {
  IconHome,
  IconBook,
  IconLightbulb,
  IconDocument,
  IconChat,
  IconQuiz,
  IconCalendar,
  IconCamera,
  IconFlame,
  IconSettings,
  IconLogOut,
  IconSparkles,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
  IconChevronLeft,
  IconEdit,
  IconCheck,
  IconPlus,
  IconArrowsExchange,
} from '@/components/icons'

interface ChatThread {
  id: string
  title: string
}

interface SubjectSidebarProps {
  subjectId: string
  subjectName: string
  chatThreads: ChatThread[]
  userName?: string
  careerName?: string | null
  streakDays?: number
}

export default function SubjectSidebar({
  subjectId,
  subjectName,
  chatThreads: initialThreads,
  userName = 'Estudiante',
  careerName,
  streakDays = 1,
}: SubjectSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads)

  // Acordeón de temas: abierto por defecto si estamos en la ruta de temas
  const isTemasActive = pathname.includes('/temas')
  const [temasMenuOpen, setTemasMenuOpen] = useState(isTemasActive)

  useEffect(() => {
    setThreads(initialThreads)
  }, [initialThreads])

  useEffect(() => {
    if (isTemasActive) {
      setTemasMenuOpen(true)
    }
  }, [isTemasActive])

  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editTitleInput, setEditTitleInput] = useState('')
  const [isCreatingThread, setIsCreatingThread] = useState(false)
  const [newThreadTitleInput, setNewThreadTitleInput] = useState('')

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleCreateNewThread = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newThreadTitleInput.trim()) return

    const title = newThreadTitleInput.trim()
    setNewThreadTitleInput('')
    setIsCreatingThread(false)

    const tempId = Date.now().toString()
    const updated = [{ id: tempId, title }, ...threads]
    setThreads(updated)

    try {
      const formData = new FormData()
      formData.append('title', title)
      const realId = await createThread(subjectId, formData)
      if (realId) {
        setThreads((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: realId } : t))
        )
      }
    } catch {
      // Fallback local
    }
  }

  const handleStartRename = (thread: ChatThread, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingThreadId(thread.id)
    setEditTitleInput(thread.title)
  }

  const handleSaveRename = async (threadId: string) => {
    if (!editTitleInput.trim()) {
      setEditingThreadId(null)
      return
    }

    const newTitle = editTitleInput.trim()
    setEditingThreadId(null)

    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, title: newTitle } : t))
    )

    try {
      await renameThreadAction(subjectId, threadId, newTitle)
    } catch {
      // Fallback local
    }
  }

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('¿Seguro que deseas eliminar este tema de conversación?')) return

    setThreads((prev) => prev.filter((t) => t.id !== threadId))

    try {
      await deleteThreadAction(subjectId, threadId)
    } catch {
      // Fallback local
    }
  }

  const globalNavItems = [
    {
      label: 'Inicio',
      icon: IconHome,
      href: '/',
      exact: true,
    },
    {
      label: 'Mis Materias',
      icon: IconBook,
      href: '/materias',
      exact: true,
    },
    {
      label: 'Recursos & Glosario',
      icon: IconLightbulb,
      href: '/recursos',
      exact: false,
    },
    {
      label: 'Calendario General',
      icon: IconCalendar,
      href: '/calendario',
      exact: true,
    },
  ]

  const navItems = [
    {
      label: 'Apuntes',
      icon: IconDocument,
      href: `/materias/${subjectId}`,
      exact: true,
    },
    {
      label: 'Temas (Chat RAG)',
      icon: IconChat,
      href: `/materias/${subjectId}/temas`,
      exact: false,
      hasSubmenu: true,
    },
    {
      label: 'Simulador',
      icon: IconQuiz,
      href: `/materias/${subjectId}/simulador`,
      exact: false,
    },
    {
      label: 'Tarjetas Didácticas',
      icon: IconSparkles,
      href: `/materias/${subjectId}/tarjetas`,
      exact: false,
    },
    {
      label: 'Calendario',
      icon: IconCalendar,
      href: `/materias/${subjectId}/calendario`,
      exact: false,
    },
    {
      label: 'Pizarra',
      icon: IconCamera,
      href: `/materias/${subjectId}/pizarra`,
      exact: false,
    },
  ]

  const isNavActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const formattedSubjectName =
    subjectName.charAt(0).toUpperCase() + subjectName.slice(1)

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800/80 bg-slate-950 text-slate-100 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } shrink-0 min-h-screen select-none`}
    >
      {/* Botón de Colapsar / Expandir Sidebar con SVG */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 shadow-md hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
        title={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
      >
        {collapsed ? (
          <IconChevronRight className="w-3.5 h-3.5" />
        ) : (
          <IconChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Header: Logo Marca UniNav */}
      <div className="flex items-center justify-between border-b border-slate-800/60 p-3.5">
        {!collapsed ? (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm shadow-xs group-hover:bg-indigo-500 transition-colors">
              U
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight block leading-none">
                UniNav
              </span>
              <span className="text-[9px] font-semibold text-indigo-400">
                AI Socrático
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

      {/* Sección 1: Navegación Global Compacta */}
      <div className="p-2.5 border-b border-slate-800/60 flex flex-col gap-0.5">
        {!collapsed && (
          <span className="px-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5 block">
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
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? 'bg-slate-800/90 text-indigo-400 border border-slate-700/80 shadow-2xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? gItem.label : undefined}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span className="truncate">{gItem.label}</span>}
            </Link>
          )
        })}
      </div>

      {/* Sección 2: Header del Workspace de la Materia */}
      <div className="flex items-center justify-between border-b border-slate-800/60 px-3 py-2.5 bg-slate-900/40">
        {!collapsed ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex flex-col gap-0.5 overflow-hidden">
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Materia Actual
              </span>
              <h2
                className="text-xs font-bold text-white truncate"
                title={formattedSubjectName}
              >
                {formattedSubjectName}
              </h2>
            </div>
            <Link
              href="/materias"
              className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold p-1 hover:bg-slate-800 rounded transition-colors shrink-0 flex items-center gap-1"
              title="Cambiar materia"
            >
              <IconArrowsExchange className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mx-auto" title={formattedSubjectName}>
            <IconBook className="w-4 h-4 text-indigo-400" />
          </div>
        )}
      </div>

      {/* Sección 3: Pestañas del Workspace con Acordeón Integrado */}
      <div className="flex-1 overflow-y-auto px-2 py-2.5 flex flex-col gap-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isNavActive(item.href, item.exact)

          return (
            <div key={item.href} className="flex flex-col gap-0.5">
              <div className="flex items-center">
                <Link
                  href={item.href}
                  className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  
                  {/* Flecha Chevron SVG limpia integrada en la misma pastilla */}
                  {!collapsed && item.hasSubmenu && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setTemasMenuOpen(!temasMenuOpen)
                      }}
                      className={`p-0.5 rounded transition-transform cursor-pointer ${
                        active ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title={temasMenuOpen ? 'Ocultar temas' : 'Mostrar temas'}
                    >
                      {temasMenuOpen ? (
                        <IconChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <IconChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </Link>
              </div>

              {/* Submenú Desplegable de Temas */}
              {!collapsed && item.hasSubmenu && temasMenuOpen && (
                <div className="ml-3 pl-2.5 border-l border-slate-800 flex flex-col gap-0.5 py-1 my-0.5 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between px-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Lista de Temas</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingThread(!isCreatingThread)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer flex items-center gap-0.5"
                      title="Crear nuevo tema"
                    >
                      <IconPlus className="w-2.5 h-2.5" />
                      <span>Tema</span>
                    </button>
                  </div>

                  {/* Formulario de creación rápida de Tema */}
                  {isCreatingThread && (
                    <form
                      onSubmit={handleCreateNewThread}
                      className="px-1 py-1 flex items-center gap-1 animate-in fade-in"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={newThreadTitleInput}
                        onChange={(e) => setNewThreadTitleInput(e.target.value)}
                        placeholder="Nombre del tema..."
                        className="w-full bg-slate-900 border border-indigo-500/50 rounded-md px-2 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white p-1 rounded-md hover:bg-indigo-500 cursor-pointer"
                        title="Guardar"
                      >
                        <IconCheck className="w-3 h-3" />
                      </button>
                    </form>
                  )}

                  {/* Lista de Temas */}
                  {threads.map((thread) => (
                    <div
                      key={thread.id}
                      className="group flex items-center justify-between px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                    >
                      {editingThreadId === thread.id ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            type="text"
                            autoFocus
                            value={editTitleInput}
                            onChange={(e) => setEditTitleInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(thread.id)
                              if (e.key === 'Escape') setEditingThreadId(null)
                            }}
                            className="w-full bg-slate-900 border border-indigo-500 rounded-md px-1.5 py-0.5 text-[11px] text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(thread.id)}
                            className="text-indigo-400 hover:text-indigo-300 p-0.5"
                            title="Guardar cambio"
                          >
                            <IconCheck className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Link
                            href={`/materias/${subjectId}/temas?threadId=${thread.id}`}
                            className="flex items-center gap-1.5 truncate flex-1 min-w-0"
                            title={thread.title}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            <span className="truncate">{thread.title}</span>
                          </Link>

                          {/* Acciones de Edición con Iconos SVG */}
                          <div className="hidden group-hover:flex items-center gap-1 text-slate-500">
                            <button
                              type="button"
                              onClick={(e) => handleStartRename(thread, e)}
                              className="hover:text-indigo-300 transition-colors p-0.5"
                              title="Renombrar tema"
                            >
                              <IconEdit className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteThread(thread.id, e)}
                              className="hover:text-rose-400 transition-colors p-0.5"
                              title="Eliminar tema"
                            >
                              <IconTrash className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {threads.length === 0 && !isCreatingThread && (
                    <span className="px-2 py-1 text-[10px] text-slate-600 italic">
                      Sin temas creados
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Sección 4: Footer Compacto con Racha y Perfil */}
      <div className="border-t border-slate-800/60 p-2.5 bg-slate-950 flex flex-col gap-2">
        {/* Pastilla de Racha en Footer con Icono SVG */}
        {!collapsed ? (
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1 text-amber-300 text-xs shadow-2xs">
            <span className="flex items-center gap-1.5 font-bold text-[11px]">
              <IconFlame className="w-3.5 h-3.5 text-amber-400" />
              Racha: {streakDays} {streakDays === 1 ? 'día' : 'días'}
            </span>
            <span className="text-[9px] text-amber-400 font-mono font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">
              ACTIVO
            </span>
          </div>
        ) : (
          <div
            className="mx-auto flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"
            title={`Racha: ${streakDays} días`}
          >
            <IconFlame className="w-4 h-4" />
          </div>
        )}

        {/* Tarjeta de Perfil y Botón de Configuración */}
        <div className="flex items-center justify-between gap-2">
          {!collapsed ? (
            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0 shadow-2xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate flex-1 min-w-0">
                <span className="text-xs font-bold text-white block truncate leading-none">
                  {userName}
                </span>
                {careerName && (
                  <span
                    className="text-[9px] text-slate-400 truncate block mt-0.5"
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
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors shrink-0 cursor-pointer"
              title="Configuración de usuario"
            >
              <IconSettings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Desplegable de Ajustes */}
        {showConfigModal && !collapsed && (
          <div className="mt-1 rounded-xl border border-slate-800 bg-slate-900 p-2 flex flex-col gap-1 text-xs shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Ajustes de Perfil
            </div>
            <Link
              href="/onboarding"
              className="px-2 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-between text-xs"
            >
              <span>Cambiar Carrera</span>
              <IconChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-2 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors flex items-center justify-between font-semibold cursor-pointer text-xs"
            >
              <span className="flex items-center gap-1.5">
                <IconLogOut className="w-3 h-3" />
                Cerrar Sesión
              </span>
              <IconChevronRight className="w-3.5 h-3.5 text-rose-400/60" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
