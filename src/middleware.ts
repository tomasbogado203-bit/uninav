import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  // Permitir endpoints de API (como /api/iot/lamp) sin redirección de página
  if (isApiRoute) {
    return supabaseResponse
  }

  // Sin sesión -> mandar a login (salvo que ya esté en login)
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Con sesión activa
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('career_id')
      .eq('id', user.id)
      .maybeSingle()

    // Si ya tiene carrera elegida y está en /login o /onboarding -> mandar directo al Dashboard /
    if (profile?.career_id && (isAuthRoute || isOnboardingRoute)) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Si NO tiene carrera elegida y no está en /onboarding -> mandar a onboarding
    if (!profile?.career_id && !isOnboardingRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
