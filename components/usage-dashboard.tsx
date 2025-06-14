"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Users, FolderOpen, HardDrive, Crown } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useSubscription } from "@/components/subscription-provider"
import { SUBSCRIPTION_TIERS, calculateStorageUsage, checkLimits, formatStorage } from "@/lib/subscription-utils"

export function UsageDashboard() {
  const { user } = useAuth()
  const { subscription } = useSubscription()
  const [usage, setUsage] = useState({
    clients: 0,
    projects: 0,
    storageMB: 0,
  })

  useEffect(() => {
    if (!user) return

    const userKey = `user_${user.id}`
    const clients = JSON.parse(localStorage.getItem(`${userKey}_clients`) || "[]")
    const projects = JSON.parse(localStorage.getItem(`${userKey}_projects`) || "[]")
    const songs = JSON.parse(localStorage.getItem(`${userKey}_songs`) || "[]")

    const storageMB = calculateStorageUsage(songs)

    setUsage({
      clients: clients.length,
      projects: projects.length,
      storageMB,
    })
  }, [user])

  const limits = checkLimits(subscription.tier, usage.clients, usage.projects, usage.storageMB)
  const tierInfo = SUBSCRIPTION_TIERS[subscription.tier]

  const getProgressColor = (used: number, max: number) => {
    if (max === -1) return "bg-green-500" // Unlimited
    const percentage = (used / max) * 100
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const formatLimit = (limit: number) => {
    return limit === -1 ? "Unlimited" : limit.toString()
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {subscription.tier === "enterprise" && <Crown className="h-5 w-5 text-yellow-500" />}
              Current Plan: {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
            </CardTitle>
            <Badge variant={subscription.tier === "free" ? "secondary" : "default"}>
              {tierInfo.price === 0 ? "Free" : `€${tierInfo.price}/month`}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Clients Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.clients} / {formatLimit(tierInfo.maxClients)}
            </div>
            {tierInfo.maxClients !== -1 && (
              <div className="mt-2">
                <Progress value={(usage.clients / tierInfo.maxClients) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((usage.clients / tierInfo.maxClients) * 100)}% used
                </p>
              </div>
            )}
            {!limits.canAddClient && (
              <Badge variant="destructive" className="mt-2 text-xs">
                Limit reached
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Projects Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.projects} / {formatLimit(tierInfo.maxProjects)}
            </div>
            {tierInfo.maxProjects !== -1 && (
              <div className="mt-2">
                <Progress value={(usage.projects / tierInfo.maxProjects) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((usage.projects / tierInfo.maxProjects) * 100)}% used
                </p>
              </div>
            )}
            {!limits.canAddProject && (
              <Badge variant="destructive" className="mt-2 text-xs">
                Limit reached
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatStorage(usage.storageMB)} / {formatStorage(tierInfo.maxStorageMB)}
            </div>
            {tierInfo.maxStorageMB !== -1 && (
              <div className="mt-2">
                <Progress value={(usage.storageMB / tierInfo.maxStorageMB) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((usage.storageMB / tierInfo.maxStorageMB) * 100)}% used
                </p>
              </div>
            )}
            {!limits.hasStorageSpace && (
              <Badge variant="destructive" className="mt-2 text-xs">
                Storage full
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
