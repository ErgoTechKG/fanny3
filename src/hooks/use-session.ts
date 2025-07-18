import { useSession as useNextAuthSession } from 'next-auth/react'
import type { Role } from '@prisma/client'

export function useSession() {
  const { data: session, status } = useNextAuthSession()
  
  const hasRole = (role: Role) => {
    return session?.user?.roles?.includes(role) ?? false
  }
  
  const hasAnyRole = (roles: Role[]) => {
    return roles.some(role => hasRole(role))
  }
  
  const hasAllRoles = (roles: Role[]) => {
    return roles.every(role => hasRole(role))
  }
  
  return {
    session,
    status,
    user: session?.user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    hasRole,
    hasAnyRole,
    hasAllRoles,
  }
}