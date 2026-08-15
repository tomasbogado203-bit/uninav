import { createClient } from '@/lib/supabase/server'

export interface StudyStreakInfo {
  user_id: string
  current_streak: number
  longest_streak: number
  last_activity_date: string
  is_active_today: boolean
}

export async function getOrUpdateStudyStreak(userId: string): Promise<StudyStreakInfo> {
  const supabase = await createClient()

  const todayStr = new Date().toISOString().split('T')[0]

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  try {
    const { data: streakRow } = await supabase
      .from('study_streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!streakRow) {
      // Primera actividad registrada para el estudiante
      const newStreak = {
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: todayStr,
      }

      await supabase.from('study_streaks').upsert(newStreak)

      return {
        ...newStreak,
        is_active_today: true,
      }
    }

    const { last_activity_date, current_streak, longest_streak } = streakRow

    if (last_activity_date === todayStr) {
      // Ya se registró actividad en el día de hoy
      return {
        user_id: userId,
        current_streak,
        longest_streak,
        last_activity_date: todayStr,
        is_active_today: true,
      }
    }

    let nextCurrent = current_streak
    if (last_activity_date === yesterdayStr) {
      // Día consecutivo: se incrementa la racha actual
      nextCurrent += 1
    } else {
      // Hubo una pausa de 2+ días: se reinicia a 1
      nextCurrent = 1
    }

    const nextLongest = Math.max(nextCurrent, longest_streak)

    const updatedStreak = {
      user_id: userId,
      current_streak: nextCurrent,
      longest_streak: nextLongest,
      last_activity_date: todayStr,
      updated_at: new Date().toISOString(),
    }

    await supabase.from('study_streaks').upsert(updatedStreak)

    return {
      ...updatedStreak,
      is_active_today: true,
    }
  } catch (err) {
    console.error('Error calculando racha de estudio:', err)
    return {
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: todayStr,
      is_active_today: true,
    }
  }
}
