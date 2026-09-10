import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Helper genérico para limitar el tiempo de espera de promesas en Edge Middleware
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer))
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const pathname = request.nextUrl.pathname

  // Ignorar rutas públicas, estáticas, APIs o recursos
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return supabaseResponse
  }

  const isAuthRoute = pathname.startsWith('/login')
  const isOnboardingRoute = pathname.startsWith('/onboarding')

  try {
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

    // Timeout de 1.2 segundos para getUser() para evitar 504 MIDDLEWARE_INVOCATION_TIMEOUT en Vercel
    const authResult = await withTimeout(
      supabase.auth.getUser(),
      1200,
      { data: { user: null }, error: null } as any
    )

    const user = authResult.data?.user

    // 1. Sin sesión -> Redirigir a login (salvo si ya está en login)
    if (!user) {
      if (!isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // 2. Con sesión -> Si está en /login, mandar al Dashboard principal
    if (user && isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // 3. Verificación de Onboarding con timeout seguro de 800ms
    if (user && (isOnboardingRoute || pathname === '/')) {
      const profilePromise = Promise.resolve(
        supabase
          .from('profiles')
          .select('career_id')
          .eq('id', user.id)
          .maybeSingle()
      )

      const profileResult = await withTimeout<{ data: { career_id?: string | null } | null; error: any }>(
        profilePromise as any,
        800,
        { data: null, error: null }
      )

      const careerId = profileResult.data?.career_id

      if (careerId && isOnboardingRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      if (!careerId && !isOnboardingRoute && profileResult.data !== null) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  } catch (err) {
    console.error('Middleware non-blocking error:', err)
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
  ],
}
