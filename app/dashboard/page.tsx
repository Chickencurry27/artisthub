"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { FolderOpen, Users, TrendingUp, DollarSign } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardWrapper } from "@/components/dashboard-wrapper"

function DashboardPageContent() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalClients: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    onHoldProjects: 0,
    totalBudget: 0,
    activeBudget: 0,
    completedBudget: 0,
  })
  const [monthlyData, setMonthlyData] = useState<{ name: string; clients: number; projects: number; budget: number }[]>(
    [],
  )

  useEffect(() => {
    if (!user) return

    // Load user-specific stats from localStorage
    const userKey = `user_${user.id}`
    const clients = JSON.parse(localStorage.getItem(`${userKey}_clients`) || "[]")
    const projects = JSON.parse(localStorage.getItem(`${userKey}_projects`) || "[]")

    const activeProjects = projects.filter((p: any) => p.status === "active")
    const completedProjects = projects.filter((p: any) => p.status === "completed")
    const onHoldProjects = projects.filter((p: any) => p.status === "on-hold")

    const totalBudget = projects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0)
    const activeBudget = activeProjects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0)
    const completedBudget = completedProjects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0)

    setStats({
      totalClients: clients.length,
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      onHoldProjects: onHoldProjects.length,
      totalBudget,
      activeBudget,
      completedBudget,
    })

    // Generate monthly data for the last 6 months
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString("en-US", { month: "short" })

      // Filter data by month (simplified - in real app you'd use actual creation dates)
      const monthClients = Math.floor(clients.length * (0.1 + (5 - i) * 0.18))
      const monthProjects = Math.floor(projects.length * (0.1 + (5 - i) * 0.18))
      const monthBudget = Math.floor(totalBudget * (0.1 + (5 - i) * 0.18))

      months.push({
        name: monthName,
        clients: monthClients,
        projects: monthProjects,
        budget: monthBudget,
      })
    }
    setMonthlyData(months)
  }, [user])

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
      </header>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h2>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">Your registered clients</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">All your projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalBudget.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all projects</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <DashboardWrapper>
      <AuthGuard>
        <DashboardPageContent />
      </AuthGuard>
    </DashboardWrapper>
  )
}
