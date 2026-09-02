'use client'

import { useState } from 'react'
import { updateUserRoleAction } from '@/app/catedra/actions'
import { IconUsers, IconBook, IconDocument, IconCheck } from '@/components/icons'

interface RoleSwitcherPillProps {
  currentRole: 'student' | 'professor' | 'dean' | 'admin'
}

export default function RoleSwitcherPill({
  currentRole: initialRole,
}: RoleSwitcherPillProps) {
  const [role, setRole] = useState(initialRole)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleSelectRole = async (newRole: 'student' | 'professor' | 'dean') => {
    setLoading(true)
    try {
      await updateUserRoleAction(newRole)
      setRole(newRole)
      setShowModal(false)
      window.location.reload()
    } catch {
      alert('No se pudo cambiar el rol.')
    } finally {
      setLoading(false)
    }
  }

  const roleLabels: Record<string, { label: string; bg: string; text: string; icon: string }> = {
    student: {
      label: 'Estudiante',
      bg: 'bg-indigo-500/20 border-indigo-500/30',
      text: 'text-indigo-300',
      icon: '🎓',
    },
    professor: {
      label: 'Profesor de Cátedra',
      bg: 'bg-purple-500/20 border-purple-500/30',
      text: 'text-purple-300',
      icon: '👨‍🏫',
    },
    dean: {
      label: 'Decanato / Autoridad',
      bg: 'bg-sky-500/20 border-sky-500/30',
      text: 'text-sky-300',
      icon: '👑',
    },
    admin: {
      label: 'Administrador',
      bg: 'bg-emerald-500/20 border-emerald-500/30',
      text: 'text-emerald-300',
      icon: '⚙️',
    },
  }

  const currentInfo = roleLabels[role] || roleLabels.student

  return (
    <div className="relative inline-block">
      {/* Botón Píldora de Rol Activo */}
      <button
        type="button"
        onClick={() => setShowModal(!showModal)}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border transition-all cursor-pointer shadow-2xs hover:brightness-110 ${currentInfo.bg} ${currentInfo.text}`}
        title="Clic para alternar rol en Modo Demo"
      >
        <span>{currentInfo.icon}</span>
        <span>Rol: {currentInfo.label}</span>
        <span className="text-[10px] text-slate-400 font-mono">▾</span>
      </button>

      {/* Modal Desplegable de Selección de Rol */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in zoom-in-95 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Control de Acceso RBAC
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Alternar Rol de Usuario (Modo Demo)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Seleccioná un rol para simular cómo cambia la interfaz, los permisos y las rutas de la plataforma para cada perfil:
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Opción 1: Estudiante */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSelectRole('student')}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  role === 'student'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xl shrink-0">
                    🎓
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                      Estudiante Universitario
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Acceso a materias, tutor socrático, calendario y racha Pomodoro.
                    </span>
                  </div>
                </div>
                {role === 'student' && <IconCheck className="w-5 h-5 text-indigo-600 shrink-0" />}
              </button>

              {/* Opción 2: Profesor */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSelectRole('professor')}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  role === 'professor'
                    ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-xl shrink-0">
                    👨‍🏫
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                      Profesor / JTP de Cátedra
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Gestión de comisiones, mapa de calor de dudas y generador de exámenes.
                    </span>
                  </div>
                </div>
                {role === 'professor' && <IconCheck className="w-5 h-5 text-purple-600 shrink-0" />}
              </button>

              {/* Opción 3: Decanato */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSelectRole('dean')}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  role === 'dean' || role === 'admin'
                    ? 'border-sky-600 bg-sky-50/60 ring-2 ring-sky-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-xl shrink-0">
                    👑
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                      Decanato & Secretaría Académica
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Semáforo de retención por materia y exportación de informes CONEAU.
                    </span>
                  </div>
                </div>
                {(role === 'dean' || role === 'admin') && (
                  <IconCheck className="w-5 h-5 text-sky-600 shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
