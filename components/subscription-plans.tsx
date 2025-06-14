"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, Star } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useSubscription } from "@/components/subscription-provider"
import { useToast } from "@/hooks/use-toast"
import { SUBSCRIPTION_TIERS, formatStorage } from "@/lib/subscription-utils"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51RY4OzRXZuRhWYZh02PJSWOUTPmqoM0E4FQOMxsNDgh0TN2ebUruRmOtjdvAFknlX3Gd4KS2u657rpsopZf22Rvh00e52ttVIa",
)

interface SubscriptionPlansProps {
  showCurrentPlan?: boolean
}

export function SubscriptionPlans({ showCurrentPlan = true }: SubscriptionPlansProps) {
  const { user } = useAuth()
  const { subscription } = useSubscription()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (priceId: string, tierName: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to upgrade your subscription.",
        variant: "destructive",
      })
      return
    }

    setLoading(priceId)

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      const stripe = await stripePromise
      if (!stripe) {
        throw new Error("Stripe failed to load")
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      name: "Free",
      tier: "free" as const,
      icon: <Star className="h-6 w-6" />,
      description: "Perfect for getting started",
      features: [
        `${SUBSCRIPTION_TIERS.free.maxClients} clients`,
        `${SUBSCRIPTION_TIERS.free.maxProjects} projects`,
        `${formatStorage(SUBSCRIPTION_TIERS.free.maxStorageMB)} storage`,
        "Basic audio streaming",
        "Project sharing",
        "Comment system",
      ],
      price: "Free",
      priceId: null,
      popular: false,
    },
    {
      name: "Pro",
      tier: "pro" as const,
      icon: <Zap className="h-6 w-6" />,
      description: "For growing businesses",
      features: [
        `${SUBSCRIPTION_TIERS.pro.maxClients} clients`,
        `${SUBSCRIPTION_TIERS.pro.maxProjects} projects`,
        `${formatStorage(SUBSCRIPTION_TIERS.pro.maxStorageMB)} storage`,
        "Advanced audio streaming",
        "Priority support",
        "Project analytics",
        "Custom branding",
      ],
      price: "€24/month",
      priceId: SUBSCRIPTION_TIERS.pro.priceId,
      popular: true,
    },
    {
      name: "Enterprise",
      tier: "enterprise" as const,
      icon: <Crown className="h-6 w-6" />,
      description: "For large organizations",
      features: [
        "Unlimited clients",
        "Unlimited projects",
        "Unlimited storage",
        "Premium audio quality",
        "24/7 priority support",
        "Advanced analytics",
        "White-label solution",
        "API access",
      ],
      price: "€49.95/month",
      priceId: SUBSCRIPTION_TIERS.enterprise.priceId,
      popular: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrentPlan = subscription.tier === plan.tier
        const isDowngrade = subscription.tier === "enterprise" && plan.tier !== "enterprise"
        const canUpgrade = plan.priceId && !isCurrentPlan && !isDowngrade

        return (
          <Card
            key={plan.name}
            className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""} ${
              isCurrentPlan ? "ring-2 ring-primary" : ""
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">Most Popular</Badge>
            )}
            {isCurrentPlan && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600">Current Plan</Badge>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className={`p-3 rounded-full ${plan.popular ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {plan.icon}
                </div>
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="text-3xl font-bold mt-4">{plan.price}</div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                {isCurrentPlan ? (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                ) : canUpgrade ? (
                  <Button
                    onClick={() => handleUpgrade(plan.priceId!, plan.name)}
                    disabled={loading === plan.priceId}
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {loading === plan.priceId ? "Processing..." : `Upgrade to ${plan.name}`}
                  </Button>
                ) : plan.tier === "free" ? (
                  <Button disabled className="w-full" variant="outline">
                    Downgrade (Contact Support)
                  </Button>
                ) : (
                  <Button disabled className="w-full" variant="outline">
                    Contact Sales
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
