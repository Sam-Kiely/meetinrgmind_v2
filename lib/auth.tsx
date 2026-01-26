'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('meetingmind_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('meetingmind_user')
      }
    }
    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // For demo purposes, accept any email/password
    // In production, this would validate against Supabase
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0]
    }

    setUser(user)
    localStorage.setItem('meetingmind_user', JSON.stringify(user))
    router.push('/dashboard')
  }

  const signUp = async (email: string, password: string) => {
    // For demo purposes, create user with any email/password
    // In production, this would create user in Supabase
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0]
    }

    setUser(user)
    localStorage.setItem('meetingmind_user', JSON.stringify(user))
    router.push('/dashboard')
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('meetingmind_user')
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// HOC for protected routes
export function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function ProtectedComponent(props: T) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/auth/signin')
      }
    }, [user, isLoading, router])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      )
    }

    if (!user) {
      return null
    }

    return <Component {...props} />
  }
}