'use client'

import { useState } from 'react'
import StudentTutorialModal from '@/components/StudentTutorialModal'
import { IconSparkles } from '@/components/icons'

interface StudentTutorialTriggerProps {
  label?: string
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'pill'
}

export default function StudentTutorialTrigger({
  label = 'Ver Tutorial Interactivo',
  className = '',
  variant = 'primary',
}: StudentTutorialTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const variantStyles = {
    primary:
      'bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 text-xs transition-all cursor-pointer',
    secondary:
      'bg-[#1E1B4B] hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 text-xs transition-all cursor-pointer border border-slate-800',
    outline:
      'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2 rounded-xl shadow-2xs inline-flex items-center gap-1.5 text-xs transition-all cursor-pointer',
    pill:
      'border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-700 font-bold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer',
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${variantStyles[variant]} ${className}`}
        title="Abrir guía interactiva paso a paso"
      >
        <IconSparkles className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>

      {isOpen && (
        <StudentTutorialModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          autoTriggerOnFirstVisit={false}
        />
      )}
    </>
  )
}
