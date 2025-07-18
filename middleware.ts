import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Role-based access control
    if (path.startsWith('/admin') && !token?.roles?.includes('ADMIN')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (path.startsWith('/professor') && !token?.roles?.includes('PROFESSOR')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (path.startsWith('/secretary') && !token?.roles?.includes('SECRETARY')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/professor/:path*',
    '/secretary/:path*',
    '/topics/:path*',
    '/applications/:path*',
    '/achievements/:path*',
    '/profile/:path*',
  ],
}