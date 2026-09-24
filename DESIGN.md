# DESIGN.md — UniNav Design System & UI Principles

Este documento es la especificación de diseño visual, arquitectura de interfaz y estándares de calidad para UniNav (en colaboración con INCADE). Todo agente y desarrollador debe seguir estas directrices para evitar el "AI slop" y mantener una interfaz académica de clase mundial.

---

## 1. Principios Fundamentales

1. **Claridad Académica y Foco Cognitivo**:
   - La interfaz debe transmitir rigor, orden y serenidad.
   - Evitar saturación visual, decoraciones innecesarias o animaciones distractoras.
   - El contenido pedagógico (apuntes, citas, preguntas socráticas) es el protagonista absoluto.

2. **Cero Emojis Informales — 100% SVG Vectorial**:
   - Prohibido el uso de emojis Unicode como sustitutos de íconos (`✏️`, `⭐`, `🎉`, etc.).
   - Utilizar exclusivamente los componentes SVG tipados de `@/components/icons`.

3. **Grilla y Espaciado Armónico (Multiplos de 4px / 8px)**:
   - Contenedores principales: `max-w-5xl` o `max-w-7xl` con `mx-auto px-4 sm:px-6`.
   - Gaps y paddings estandarizados: `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px).
   - Padding interno en tarjetas: `p-4 sm:p-6` para tarjetas estándar, `p-6 sm:p-8` para banners y vistas principales.

4. **Contraste Accesible (WCAG AA Estricto)**:
   - Todo texto sobre fondo oscuro debe tener contraste superior a 4.5:1 (usar `text-white`, `text-slate-100` o `text-indigo-200`).
   - Todo texto sobre fondo claro debe ser al menos `text-slate-700` o `text-slate-900`.
   - Jamás superponer clases conflictivas (ej: `text-white` junto a `text-slate-900` o fondos transparentes no testeados).

---

## 2. Paleta de Colores y Tokens

| Rol | Token Tailwind / Hex | Uso Principal |
| :--- | :--- | :--- |
| **Brand Primario** | `#1E1B4B` (Navy Institucional) | Encabezados de cátedra, banners INCADE, botones principales oscuros. |
| **Brand Acento** | `indigo-600` / `indigo-700` | Botones de acción, enlaces activos, badges de materias, foco RAG. |
| **Superficie Base** | `slate-50` / `white` | Fondos de página y tarjetas contenedoras. |
| **Bordes** | `border-slate-200/80` | Delimitación sutil y limpia de tarjetas e inputs. |
| **Éxito / Dominado** | `emerald-600` / `emerald-50` | Respuestas correctas, citas verificadas, tarjetas dominadas, estado de descanso. |
| **Atención / Foco** | `amber-500` / `amber-50` | Alertas pedagógicas, preguntas socráticas de reflexión, transición Pomodoro. |
| **Crítico / Alerta** | `rose-600` / `rose-50` | Materias en riesgo de abandono, semanas críticas, botón de eliminar. |
| **Analítica / Decanato**| `sky-600` / `sky-50` | Métricas de retención, telemetría de cátedra, acreditación CONEAU. |

---

## 3. Jerarquía Tipográfica

- **Display / Títulos de Módulo**: `text-2xl sm:text-3xl font-black text-slate-900 tracking-tight`
- **Títulos de Sección / Tarjeta**: `text-base sm:text-lg font-bold text-slate-900 tracking-tight`
- **Subtítulos y Descriptores**: `text-xs sm:text-sm text-slate-500 font-medium leading-relaxed`
- **Cuerpo de Texto / Párrafos**: `text-xs sm:text-sm text-slate-700 leading-relaxed`
- **Badges / Micro-labels**: `text-[10px] font-bold uppercase tracking-wider`
- **Citas / Números de Página / Metadatos**: `font-mono text-[10px] sm:text-[11px] font-bold`

---

## 4. Anatomía de Componentes

### A. Tarjetas (Cards)
```tsx
<div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200">
  {/* Header con badge y acción */}
  {/* Contenido principal */}
  {/* Footer con metadatos y botones */}
</div>
```

### B. Botones de Acción Primarios
```tsx
<button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 text-xs shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0">
  <IconSparkles className="w-3.5 h-3.5 shrink-0" />
  <span>Texto de Acción</span>
</button>
```

### C. Botones Secundarios / Outline
```tsx
<button className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 text-xs shadow-2xs transition-all cursor-pointer shrink-0">
  <span>Acción Secundaria</span>
</button>
```

### D. Badges y Pills
```tsx
<span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700">
  Etiqueta
</span>
```

### E. Citas Bibliográficas RAG
```tsx
<span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md shadow-2xs">
  [Pág. 14]
</span>
```

---

## 5. Check-list Anti-Slop (Auditoría previa a cada commit)

- [ ] ¿Hay suficiente contraste en todos los textos y botones?
- [ ] ¿Los botones tienen padding simétrico y esquinas redondeadas consistentes (`rounded-xl` o `rounded-2xl`)?
- [ ] ¿Se eliminaron todos los emojis crudos en textos, badges, dropdowns y modales?
- [ ] ¿Los estados interactivos (`hover:`, `active:`, `disabled:`) están implementados y lucen fluidos?
- [ ] ¿La interfaz se adapta naturalmente a pantallas móviles (360px) y escritorios (1440px)?
- [ ] ¿Los íconos tienen `shrink-0` para no deformarse en layouts flex?
