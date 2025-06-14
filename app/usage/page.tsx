"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { UsageDashboard } from "@/components/usage-dashboard"
import { SubscriptionPlans } from "@/components/subscription-plans"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardWrapper } from "@/components/dashboard-wrapper"

function UsagePageContent() {
  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Usage & Billing</h1>
        </div>
      </header>

      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usage & Billing</h2>
          <p className="text-muted-foreground">Monitor your usage and manage your subscription.</p>
        </div>

        {/* Current Usage */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Current Usage</h3>
          <UsageDashboard />
        </div>

        {/* Subscription Plans */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Subscription Plans</h3>
          <SubscriptionPlans />
        </div>
      </div>
    </div>
  )
}

export default function UsagePage() {
  return (
    <DashboardWrapper>
      <AuthGuard>
        <UsagePageContent />
      </AuthGuard>
    </DashboardWrapper>
  )
}
