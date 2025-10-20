import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: req,
          })
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

  // Protect /dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      const redirectUrl = new URL('/auth', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect to dashboard if already logged in and trying to access auth page
  if (req.nextUrl.pathname === '/auth' && user) {
    const redirectUrl = new URL('/dashboard', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect root to auth or dashboard based on user
  if (req.nextUrl.pathname === '/') {
    if (user) {
      const redirectUrl = new URL('/dashboard', req.url)
      return NextResponse.redirect(redirectUrl)
    }
    const redirectUrl = new URL('/auth', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/', '/auth', '/dashboard/:path*'],
}
