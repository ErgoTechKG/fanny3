import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number, locale = 'zh-CN'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string | number, locale = 'zh-CN'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function getRoleColor(role: string): string {
  const roleColors: Record<string, string> = {
    STUDENT: 'text-blue-600 bg-blue-100',
    PROFESSOR: 'text-purple-600 bg-purple-100',
    SECRETARY: 'text-green-600 bg-green-100',
    ADMIN: 'text-red-600 bg-red-100',
  }
  return roleColors[role] || 'text-gray-600 bg-gray-100'
}

export function getRoleLabel(role: string): string {
  const roleLabels: Record<string, string> = {
    STUDENT: '学生',
    PROFESSOR: '导师',
    SECRETARY: '科研秘书',
    ADMIN: '管理员',
  }
  return roleLabels[role] || role
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    PENDING: 'text-yellow-600 bg-yellow-100',
    REVIEWING: 'text-blue-600 bg-blue-100',
    ACCEPTED: 'text-green-600 bg-green-100',
    REJECTED: 'text-red-600 bg-red-100',
    ACTIVE: 'text-green-600 bg-green-100',
    COMPLETED: 'text-gray-600 bg-gray-100',
    DRAFT: 'text-gray-600 bg-gray-100',
    RECRUITING: 'text-blue-600 bg-blue-100',
    IN_PROGRESS: 'text-purple-600 bg-purple-100',
  }
  return statusColors[status] || 'text-gray-600 bg-gray-100'
}

export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    PENDING: '待审核',
    REVIEWING: '审核中',
    ACCEPTED: '已通过',
    REJECTED: '已拒绝',
    ACTIVE: '进行中',
    COMPLETED: '已完成',
    DRAFT: '草稿',
    RECRUITING: '招募中',
    IN_PROGRESS: '进行中',
    PAUSED: '已暂停',
    ABANDONED: '已放弃',
    SUBMITTED: '已提交',
    REVIEWED: '已批阅',
    APPROVED: '已通过',
  }
  return statusLabels[status] || status
}