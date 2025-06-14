import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type User = Database['public']['Tables']['users']['Row']

export function useCurrentUser() {
  const { userId, isLoaded } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!userId) {
      setUser(null)
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    async function fetchUser() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', userId!)
          .single()

        if (error) throw error
        setUser(data)
      } catch (err) {
        console.error('Error fetching user:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [userId, isLoaded])

  return { user, isLoading, error }
}