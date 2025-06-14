"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, Filter, Copy, Check } from "lucide-react"
import { ProjectForm } from "@/components/project-form"
import { ProjectsGrid } from "@/components/projects-grid"
import { SongForm } from "@/components/song-form"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardWrapper } from "@/components/dashboard-wrapper"
import { generateShareToken, createShareLink } from "@/lib/share-utils"
import type { Project, Song } from "@/components/projects-grid"
import type { Client } from "@/app/(auth)/clients/page"
import { useSubscription } from "@/components/subscription-provider"
import { checkLimits, calculateStorageUsage } from "@/lib/subscription-utils"

type SortOption = "last-added" | "alphabetical" | "status" | "client" | "oldest-first"

// Define types (replace with your actual types)
interface SharedProject {
  id: string
  projectId: string
  token: string
  createdAt: string
  isActive: boolean
}

// Mock functions (replace with your actual implementations)
const setShareLink = (link: string) => {
  // This is a mock function. Replace with your actual implementation.
  console.log("Share link:", link)
}

const setSharingProject = (project: Project) => {
  // This is a mock function. Replace with your actual implementation.
  console.log("Sharing project:", project)
}

const setIsShareDialogOpen = (isOpen: boolean) => {
  // This is a mock function. Replace with your actual implementation.
  console.log("Share dialog open:", isOpen)
}

function ProjectsPageContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const clientFilter = searchParams.get("client")
  const { subscription } = useSubscription()

  const [projects, setProjects] = useState<Project[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSongDialogOpen, setIsSongDialogOpen] = useState(false)
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProjectForSong, setSelectedProjectForSong] = useState<{ id: string; name: string } | null>(null)
  const [selectedSongForVersion, setSelectedSongForVersion] = useState<{ id: string; name: string } | null>(null)
  const [sharingProject, setSharingProject] = useState<Project | null>(null)
  const [shareLink, setShareLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("last-added")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "on-hold">("all")

  useEffect(() => {
    if (!user) return

    try {
      const userKey = `user_${user.id}`
      const savedProjects = localStorage.getItem(`${userKey}_projects`)
      const savedSongs = localStorage.getItem(`${userKey}_songs`)
      const savedClients = localStorage.getItem(`${userKey}_clients`)

      if (savedProjects) {
        setProjects(JSON.parse(savedProjects))
      }
      if (savedSongs) {
        setSongs(JSON.parse(savedSongs))
      }
      if (savedClients) {
        setClients(JSON.parse(savedClients))
      }
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }, [user])

  const saveProjects = (updatedProjects: Project[]) => {
    if (!user) return
    try {
      const userKey = `user_${user.id}`
      setProjects(updatedProjects)
      localStorage.setItem(`${userKey}_projects`, JSON.stringify(updatedProjects))
    } catch (error) {
      console.error("Error saving projects:", error)
      toast({
        title: "Error",
        description: "Failed to save project data.",
        variant: "destructive",
      })
    }
  }

  const saveSongs = (updatedSongs: Song[]) => {
    if (!user) return
    try {
      const userKey = `user_${user.id}`
      setSongs(updatedSongs)
      localStorage.setItem(`${userKey}_songs`, JSON.stringify(updatedSongs))
    } catch (error) {
      console.error("Error saving songs:", error)
      toast({
        title: "Error",
        description: "Failed to save song data.",
        variant: "destructive",
      })
    }
  }

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects

    // Apply client filter from URL
    if (clientFilter) {
      filtered = projects.filter((project) => project.clientId === clientFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.description.toLowerCase().includes(query) ||
          project.clientName.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((project) => project.status === statusFilter)
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "alphabetical":
          return a.name.localeCompare(b.name)
        case "status":
          return a.status.localeCompare(b.status)
        case "client":
          return a.clientName.localeCompare(b.clientName)
        case "oldest-first":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "last-added":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return sorted
  }, [projects, clientFilter, searchQuery, statusFilter, sortBy])

  const handleAddProject = (projectData: Omit<Project, "id" | "createdAt" | "clientName">) => {
    try {
      // Check subscription limits
      const storageUsed = calculateStorageUsage(songs)
      const limits = checkLimits(subscription.tier, clients.length, projects.length, storageUsed)

      if (!limits.canAddProject) {
        toast({
          title: "Limit Reached",
          description: `You've reached the maximum number of projects for your ${subscription.tier} plan. Please upgrade to add more projects.`,
          variant: "destructive",
        })
        return
      }

      const client = clients.find((c) => c.id === projectData.clientId)
      if (!client) {
        toast({
          title: "Error",
          description: "Selected client not found.",
          variant: "destructive",
        })
        return
      }

      const newProject: Project = {
        ...projectData,
        id: Date.now().toString(),
        clientName: client.name,
        createdAt: new Date().toISOString(),
      }

      const updatedProjects = [...projects, newProject]
      saveProjects(updatedProjects)
      setIsDialogOpen(false)

      toast({
        title: "Success",
        description: "Project added successfully!",
      })
    } catch (error) {
      console.error("Error adding project:", error)
      toast({
        title: "Error",
        description: "Failed to add project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setIsEditDialogOpen(true)
  }

  const handleUpdateProject = (updatedProjectData: Omit<Project, "id" | "createdAt" | "clientName">) => {
    if (!editingProject) return

    try {
      const client = clients.find((c) => c.id === updatedProjectData.clientId)
      if (!client) {
        toast({
          title: "Error",
          description: "Selected client not found.",
          variant: "destructive",
        })
        return
      }

      const updatedProject: Project = {
        ...editingProject,
        ...updatedProjectData,
        clientName: client.name,
      }

      const updatedProjects = projects.map((project) => (project.id === editingProject.id ? updatedProject : project))
      saveProjects(updatedProjects)
      setIsEditDialogOpen(false)
      setEditingProject(null)

      toast({
        title: "Success",
        description: "Project updated successfully!",
      })
    } catch (error) {
      console.error("Error updating project:", error)
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProject = (id: string) => {
    try {
      const updatedProjects = projects.filter((project) => project.id !== id)
      saveProjects(updatedProjects)

      // Also remove songs for this project
      const updatedSongs = songs.filter((song) => song.projectId !== id)
      saveSongs(updatedSongs)

      setIsEditDialogOpen(false)
      setEditingProject(null)

      toast({
        title: "Success",
        description: "Project deleted successfully!",
      })
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddSong = (projectId: string, projectName: string) => {
    setSelectedProjectForSong({ id: projectId, name: projectName })
    setIsSongDialogOpen(true)
  }

  const handleSongSubmit = (songData: { name: string; version: string; fileUrl?: string; notes?: string }) => {
    if (!selectedProjectForSong) return

    try {
      const newVersion = {
        id: Date.now().toString(),
        version: songData.version,
        fileUrl: songData.fileUrl,
        notes: songData.notes,
        createdAt: new Date().toISOString(),
      }

      const newSong: Song = {
        id: (Date.now() + 1).toString(),
        name: songData.name,
        projectId: selectedProjectForSong.id,
        versions: [newVersion],
        createdAt: new Date().toISOString(),
      }

      const updatedSongs = [...songs, newSong]
      saveSongs(updatedSongs)
      setIsSongDialogOpen(false)
      setSelectedProjectForSong(null)

      toast({
        title: "Success",
        description: "Song added successfully!",
      })
    } catch (error) {
      console.error("Error adding song:", error)
      toast({
        title: "Error",
        description: "Failed to add song. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddVersion = (songId: string, songName: string) => {
    setSelectedSongForVersion({ id: songId, name: songName })
    setIsVersionDialogOpen(true)
  }

  const handleVersionSubmit = (versionData: { name: string; version: string; fileUrl?: string; notes?: string }) => {
    if (!selectedSongForVersion) return

    try {
      const newVersion = {
        id: Date.now().toString(),
        version: versionData.version,
        fileUrl: versionData.fileUrl,
        notes: versionData.notes,
        createdAt: new Date().toISOString(),
      }

      const updatedSongs = songs.map((song) =>
        song.id === selectedSongForVersion.id ? { ...song, versions: [...song.versions, newVersion] } : song,
      )

      saveSongs(updatedSongs)
      setIsVersionDialogOpen(false)
      setSelectedSongForVersion(null)

      toast({
        title: "Success",
        description: "Version added successfully!",
      })
    } catch (error) {
      console.error("Error adding version:", error)
      toast({
        title: "Error",
        description: "Failed to add version. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShareProject = (project: Project) => {
    try {
      // Generate a new share token
      const token = generateShareToken()
      const shareData = {
        id: Date.now().toString(),
        projectId: project.id,
        token,
        createdAt: new Date().toISOString(),
        isActive: true,
      }

      // Save to shared projects
      const existingShares = JSON.parse(localStorage.getItem("sharedProjects") || "[]")

      // Deactivate any existing shares for this project
      const updatedShares = existingShares.map((share: any) =>
        share.projectId === project.id ? { ...share, isActive: false } : share,
      )

      // Add new share
      updatedShares.push(shareData)
      localStorage.setItem("sharedProjects", JSON.stringify(updatedShares))

      // Create the share link
      const link = `${window.location.origin}${createShareLink(project.id, token)}`
      setShareLink(link)
      setSharingProject(project)
      setIsShareDialogOpen(true)

      toast({
        title: "Success",
        description: "Share link generated successfully!",
      })
    } catch (error) {
      console.error("Error creating share link:", error)
      toast({
        title: "Error",
        description: "Failed to create share link. Please try again.",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      })
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const getFilteredClientName = () => {
    if (!clientFilter) return null
    const client = clients.find((c) => c.id === clientFilter)
    return client ? client.name : null
  }

  const filteredClientName = getFilteredClientName()

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center justify-between w-full">
          <h1 className="text-lg font-semibold">
            {filteredClientName ? `${filteredClientName}'s Projects` : "My Projects"}
          </h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Project</DialogTitle>
              </DialogHeader>
              <ProjectForm
                clients={clients}
                preSelectedClientId={clientFilter || undefined}
                onSubmit={handleAddProject}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Project Management</h2>
            <p className="text-muted-foreground">
              {filteredClientName
                ? `Manage projects for ${filteredClientName}.`
                : "Manage your projects, songs, and versions."}
            </p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects by name, description, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              >
                ×
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-added">Last Added</SelectItem>
                <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="client">Client Name</SelectItem>
                <SelectItem value="oldest-first">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {searchQuery || statusFilter !== "all" || filteredClientName
              ? `Showing ${filteredAndSortedProjects.length} of ${projects.length} projects`
              : `${projects.length} total projects`}
          </span>
          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearSearch()
                setStatusFilter("all")
              }}
              className="h-auto p-0 text-sm"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Projects Grid */}
        {filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery || statusFilter !== "all" ? (
              <div>
                <h3 className="text-lg font-medium mb-2">No projects found</h3>
                <p className="text-muted-foreground mb-4">
                  No projects match your current filters. Try adjusting your search or filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    clearSearch()
                    setStatusFilter("all")
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                <p className="text-muted-foreground">
                  {filteredClientName
                    ? `Start by adding a project for ${filteredClientName}.`
                    : "Start by adding your first project to the system."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <ProjectsGrid
            projects={filteredAndSortedProjects}
            songs={songs}
            onEdit={handleEditProject}
            onAddSong={handleAddSong}
            onAddVersion={handleAddVersion}
            onShare={handleShareProject}
          />
        )}
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <ProjectForm
            clients={clients}
            editingProject={editingProject || undefined}
            onSubmit={handleUpdateProject}
            onDelete={handleDeleteProject}
          />
        </DialogContent>
      </Dialog>

      {/* Add Song Dialog */}
      <Dialog open={isSongDialogOpen} onOpenChange={setIsSongDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Song to {selectedProjectForSong?.name}</DialogTitle>
          </DialogHeader>
          <SongForm onSubmit={handleSongSubmit} />
        </DialogContent>
      </Dialog>

      {/* Add Version Dialog */}
      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Version to {selectedSongForVersion?.name}</DialogTitle>
          </DialogHeader>
          <SongForm songName={selectedSongForVersion?.name} isNewVersion={true} onSubmit={handleVersionSubmit} />
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Project: {sharingProject?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with your client to let them view the project, listen to songs, and leave comments.
            </p>
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="flex-1" />
              <Button onClick={copyToClipboard} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This link will remain active until you generate a new one for this project.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <DashboardWrapper>
      <AuthGuard>
        <ProjectsPageContent />
      </AuthGuard>
    </DashboardWrapper>
  )
}
