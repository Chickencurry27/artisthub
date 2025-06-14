"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { X, User, Lock, Save, Camera, CreditCard } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardWrapper } from "@/components/dashboard-wrapper"
import { useSubscription } from "@/components/subscription-provider"
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-utils"

interface UserProfile {
  id: string
  email: string
  name: string
  company?: string
  phone?: string
  bio?: string
  avatarUrl?: string
  createdAt: string
}

function ProfilePageContent() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const { subscription } = useSubscription()

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    bio: "",
    avatarUrl: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (!user) return

    // Load user profile data
    const userKey = `user_${user.id}`
    const savedProfile = localStorage.getItem(`${userKey}_profile`)

    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile)
        setProfileData({
          name: profile.name || user.name,
          email: profile.email || user.email,
          company: profile.company || "",
          phone: profile.phone || "",
          bio: profile.bio || "",
          avatarUrl: profile.avatarUrl || "",
        })
        setAvatarPreview(profile.avatarUrl || "")
      } catch (error) {
        console.error("Failed to parse profile data:", error)
      }
    } else {
      // Initialize with user data
      setProfileData({
        name: user.name,
        email: user.email,
        company: "",
        phone: "",
        bio: "",
        avatarUrl: "",
      })
    }
  }, [user])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB.",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setAvatarPreview(result)
        setProfileData((prev) => ({ ...prev, avatarUrl: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setProfileData((prev) => ({ ...prev, avatarUrl: url }))
    setAvatarPreview(url)
  }

  const clearAvatar = () => {
    setAvatarPreview("")
    setProfileData((prev) => ({ ...prev, avatarUrl: "" }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      const userKey = `user_${user.id}`

      // Update profile in localStorage
      const updatedProfile = {
        ...profileData,
        id: user.id,
        createdAt: user.createdAt,
      }

      localStorage.setItem(`${userKey}_profile`, JSON.stringify(updatedProfile))

      // Update user data in users list
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = users.map((u: any) => {
        if (u.id === user.id) {
          return {
            ...u,
            name: profileData.name,
            email: profileData.email,
          }
        }
        return u
      })
      localStorage.setItem("users", JSON.stringify(updatedUsers))

      // Update current user session
      const updatedUser = {
        ...user,
        name: profileData.name,
        email: profileData.email,
      }
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Verify current password
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const currentUser = users.find((u: any) => u.id === user.id)

      if (!currentUser || currentUser.password !== passwordData.currentPassword) {
        toast({
          title: "Error",
          description: "Current password is incorrect.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Update password
      const updatedUsers = users.map((u: any) => {
        if (u.id === user.id) {
          return {
            ...u,
            password: passwordData.newPassword,
          }
        }
        return u
      })
      localStorage.setItem("users", JSON.stringify(updatedUsers))

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Success",
        description: "Password updated successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    try {
      // Remove user from users list
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = users.filter((u: any) => u.id !== user.id)
      localStorage.setItem("users", JSON.stringify(updatedUsers))

      // Remove all user data
      const userKey = `user_${user.id}`
      localStorage.removeItem(`${userKey}_profile`)
      localStorage.removeItem(`${userKey}_clients`)
      localStorage.removeItem(`${userKey}_projects`)
      localStorage.removeItem(`${userKey}_songs`)
      localStorage.removeItem("currentUser")

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      })

      // Logout user
      logout()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Profile Settings</h1>
        </div>
      </header>

      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information and profile picture.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Avatar Section */}
                <div className="space-y-4">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarPreview || "/placeholder.svg"} alt="Profile" />
                      <AvatarFallback className="text-lg">
                        {profileData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2">
                        <div>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            id="avatar-upload"
                          />
                          <Label htmlFor="avatar-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground">
                              <Camera className="h-4 w-4" />
                              Upload Photo
                            </div>
                          </Label>
                        </div>
                        {avatarPreview && (
                          <Button type="button" variant="outline" onClick={clearAvatar}>
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">or</div>
                      <Input
                        placeholder="Enter image URL"
                        value={profileData.avatarUrl}
                        onChange={handleAvatarUrlChange}
                      />
                      <p className="text-sm text-muted-foreground">
                        Upload a photo or provide a URL. Recommended size: 400x400px
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" value={profileData.name} onChange={handleProfileChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      value={profileData.company}
                      onChange={handleProfileChange}
                      placeholder="Your company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="Your phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Subscription Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>Manage your subscription and billing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      Current Plan: {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {SUBSCRIPTION_TIERS[subscription.tier].price === 0
                        ? "Free plan"
                        : `€${SUBSCRIPTION_TIERS[subscription.tier].price}/month`}
                    </div>
                  </div>
                  {subscription.tier !== "enterprise" && (
                    <Button asChild>
                      <a href="/usage">Upgrade Plan</a>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Clients</div>
                    <div className="text-muted-foreground">
                      {SUBSCRIPTION_TIERS[subscription.tier].maxClients === -1
                        ? "Unlimited"
                        : `Up to ${SUBSCRIPTION_TIERS[subscription.tier].maxClients}`}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Projects</div>
                    <div className="text-muted-foreground">
                      {SUBSCRIPTION_TIERS[subscription.tier].maxProjects === -1
                        ? "Unlimited"
                        : `Up to ${SUBSCRIPTION_TIERS[subscription.tier].maxProjects}`}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Storage</div>
                    <div className="text-muted-foreground">
                      {SUBSCRIPTION_TIERS[subscription.tier].maxStorageMB === -1
                        ? "Unlimited"
                        : `${SUBSCRIPTION_TIERS[subscription.tier].maxStorageMB} MB`}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  <Lock className="h-4 w-4 mr-2" />
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data
                      including clients, projects, and songs from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <DashboardWrapper>
      <AuthGuard>
        <ProfilePageContent />
      </AuthGuard>
    </DashboardWrapper>
  )
}
