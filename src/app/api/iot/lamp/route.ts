import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Estado en memoria para respuesta ultra rápida a microcontroladores
let globalLampState = {
  state: 'IDLE',
  color: 'BLUE',
  hex: '#6366F1',
  r: 99,
  g: 102,
  b: 241,
  brightness: 100,
  time_remaining_seconds: 1800,
  is_active: false,
  updated_at: new Date().toISOString(),
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  // Si hay userId y Supabase configurado, intentar consultar la base de datos
  if (userId) {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('study_lamp_states')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (data) {
        return NextResponse.json({
          state: data.state.toUpperCase(),
          color: data.state === 'study' ? 'RED' : data.state === 'warning' ? 'YELLOW' : data.state === 'break' ? 'GREEN' : 'BLUE',
          hex: data.color_hex,
          r: data.r,
          g: data.g,
          b: data.b,
          brightness: 100,
          time_remaining_seconds: data.time_remaining_seconds,
          is_active: data.is_active,
          updated_at: data.updated_at,
        })
      }
    } catch {
      // Fallback al estado en memoria
    }
  }

  return NextResponse.json(globalLampState)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Si viene acción física desde el botón del ESP32 (ej: { action: "toggle" })
    if (body.action) {
      if (body.action === 'toggle' || body.action === 'start') {
        globalLampState.is_active = !globalLampState.is_active
        if (globalLampState.is_active) {
          globalLampState.state = 'STUDY'
          globalLampState.color = 'RED'
          globalLampState.hex = '#EF4444'
          globalLampState.r = 239
          globalLampState.g = 68
          globalLampState.b = 68
        } else {
          globalLampState.state = 'IDLE'
          globalLampState.color = 'BLUE'
          globalLampState.hex = '#6366F1'
          globalLampState.r = 99
          globalLampState.g = 102
          globalLampState.b = 241
        }
      }
      globalLampState.updated_at = new Date().toISOString()
      return NextResponse.json({ success: true, state: globalLampState })
    }

    // Actualización de estado enviada desde la web
    globalLampState = {
      state: body.state || globalLampState.state,
      color: body.color || globalLampState.color,
      hex: body.hex || globalLampState.hex,
      r: body.r ?? globalLampState.r,
      g: body.g ?? globalLampState.g,
      b: body.b ?? globalLampState.b,
      brightness: body.brightness ?? 100,
      time_remaining_seconds: body.time_remaining_seconds ?? globalLampState.time_remaining_seconds,
      is_active: body.is_active ?? globalLampState.is_active,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, state: globalLampState })
  } catch (error) {
    return NextResponse.json({ error: 'Error procesando payload IoT' }, { status: 400 })
  }
}
