'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js'

interface CustomerProfile {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
  loyalty_tier: string
  loyalty_points_balance: number
}

interface StaffProfile {
  id: string
  first_name: string
  last_name: string
  role: 'admin' | 'manager' | 'staff'
  is_active: boolean
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [staff, setStaff] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session and profile
    const getInitialSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Try to get customer profile
        const { data: customerData } = await supabase
          .from('customers')
          .select('id, first_name, last_name, phone, email, loyalty_tier, loyalty_points_balance')
          .eq('auth_user_id', user.id)
          .single()

        if (customerData) {
          setCustomer(customerData)
        }

        // Try to get staff profile (for admin access)
        const { data: staffData } = await supabase
          .from('staff')
          .select('id, first_name, last_name, role, is_active')
          .eq('auth_user_id', user.id)
          .single()

        if (staffData) {
          setStaff(staffData)
        }
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          // Get customer profile
          const { data: customerData } = await supabase
            .from('customers')
            .select('id, first_name, last_name, phone, email, loyalty_tier, loyalty_points_balance')
            .eq('auth_user_id', session.user.id)
            .single()

          setCustomer(customerData)

          // Get staff profile
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, first_name, last_name, role, is_active')
            .eq('auth_user_id', session.user.id)
            .single()

          setStaff(staffData)
        } else {
          setCustomer(null)
          setStaff(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  // Computed properties for backwards compatibility
  const fullName = customer
    ? [customer.first_name, customer.last_name].filter(Boolean).join(' ')
    : staff
      ? [staff.first_name, staff.last_name].filter(Boolean).join(' ')
      : null

  return {
    user,
    customer,
    staff,
    // Legacy profile shape for backwards compatibility
    profile: customer ? {
      id: customer.id,
      full_name: fullName,
      phone: customer.phone,
      loyalty_points: customer.loyalty_points_balance,
      loyalty_tier: customer.loyalty_tier,
      role: staff?.role || 'customer',
    } : null,
    loading,
    isAuthenticated: !!user,
    isAdmin: staff?.role === 'admin',
    isStaff: !!staff && staff.is_active,
    signOut,
  }
}
