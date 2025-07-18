import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Role } from '@prisma/client'

// Define role requirements for each route
const roleRequirements: Record<string, Role[]> = {
  '/admin': ['ADMIN'],
  '/secretary': ['SECRETARY'],
  '/professor': ['PROFESSOR'],
  '/student': ['STUDENT'],
}

export default withAuth(
  function middleware(req: NextRequest) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Check if user has required role for the route
    for (const [route, requiredRoles] of Object.entries(roleRequirements)) {
      if (pathname.startsWith(route)) {
        const userRoles = (token?.roles || []) as Role[]
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role))
        
        if (!hasRequiredRole) {
          // Redirect to appropriate dashboard based on user's actual role
          const redirectPath = getRedirectPath(userRoles)
          return NextResponse.redirect(new URL(redirectPath, req.url))
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

function getRedirectPath(roles: Role[]): string {
  if (roles.includes('ADMIN')) return '/admin'
  if (roles.includes('SECRETARY')) return '/secretary'
  if (roles.includes('PROFESSOR')) return '/professor'
  if (roles.includes('STUDENT')) return '/student'
  return '/login'
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/secretary/:path*',
    '/professor/:path*',
    '/student/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/topics',
    '/topics/:path*',
    '/achievements',
    '/achievements/:path*',
    '/projects',
    '/projects/:path*',
    '/progress',
    '/progress/:path*',
    '/evaluations',
    '/evaluations/:path*',
  ],
}