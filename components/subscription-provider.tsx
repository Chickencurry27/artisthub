"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/components/auth-provider"
import type { UserSubscription } from "@/lib/subscription-utils"

interface SubscriptionContextType {
  subscription: UserSubscription
  updateSubscription: (subscription: UserSubscription) => void
  isLoading: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<UserSubscription>({
    tier: "free",
    status: "active",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    // Load user subscription
    const userKey = `user_${user.id}`
    const savedSubscription = localStorage.getItem(`${userKey}_subscription`)

    if (savedSubscription) {
      try {
        setSubscription(JSON.parse(savedSubscription))
      } catch (error) {
        console.error("Failed to parse subscription data:", error)
      }
    }

    setIsLoading(false)
  }, [user])

  const updateSubscription = (newSubscription: UserSubscription) => {
    if (!user) return

    setSubscription(newSubscription)
    const userKey = `user_${user.id}`
    localStorage.setItem(`${userKey}_subscription`, JSON.stringify(newSubscription))
  }

  return (
    <SubscriptionContext.Provider value={{ subscription, updateSubscription, isLoading }}>
      {children}
    </SubscriptionContext.Provider>
  )
}
