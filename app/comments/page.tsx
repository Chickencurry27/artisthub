"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Search, Filter, Calendar, Music, ExternalLink } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardWrapper } from "@/components/dashboard-wrapper"
import type { Comment } from "@/lib/share-utils"
import type { Project, Song } from "@/components/projects-grid"

function CommentsPageContent() {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBy, setFilterBy] = useState<"all" | "recent" | "project">("all")
  const [selectedProject, setSelectedProject] = useState<string>("all")

  useEffect(() => {
    if (!user) return

    // Load user's projects and songs
    const userKey = `user_${user.id}`
    const savedProjects = localStorage.getItem(`${userKey}_projects`)
    const savedSongs = localStorage.getItem(`${userKey}_songs`)

    if (savedProjects) {
      setProjects(JSON.parse(savedProjects))
    }
    if (savedSongs) {
      setSongs(JSON.parse(savedSongs))
    }

    // Load all comments for user's projects
    const allComments: Comment[] = []
    const projectIds = savedProjects ? JSON.parse(savedProjects).map((p: Project) => p.id) : []

    projectIds.forEach((projectId: string) => {
      const projectComments = localStorage.getItem(`comments_${projectId}`)
      if (projectComments) {
        allComments.push(...JSON.parse(projectComments))
      }
    })

    // Sort comments by newest first
    allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setComments(allComments)
  }, [user])

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || "Unknown Project"
  }

  const getSongName = (songId: string) => {
    return songs.find((s) => s.id === songId)?.name || "Unknown Song"
  }

  const getVersionName = (songId: string, versionId: string) => {
    const song = songs.find((s) => s.id === songId)
    const version = song?.versions.find((v) => v.id === versionId)
    return version ? `v${version.version}` : "Unknown Version"
  }

  const filteredComments = comments.filter((comment) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        comment.author.toLowerCase().includes(query) ||
        comment.content.toLowerCase().includes(query) ||
        comment.email.toLowerCase().includes(query) ||
        getProjectName(comment.projectId).toLowerCase().includes(query) ||
        getSongName(comment.songId).toLowerCase().includes(query)

      if (!matchesSearch) return false
    }

    // Project filter
    if (selectedProject !== "all" && comment.projectId !== selectedProject) {
      return false
    }

    // Date filter
    if (filterBy === "recent") {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(comment.createdAt) > weekAgo
    }

    return true
  })

  const getShareLink = (projectId: string) => {
    const sharedProjects = JSON.parse(localStorage.getItem("sharedProjects") || "[]")
    const shareData = sharedProjects.find((share: any) => share.projectId === projectId && share.isActive)
    if (shareData) {
      return `${window.location.origin}/share/${projectId}/${shareData.token}`
    }
    return null
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Comments</h1>
        </div>
      </header>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Project Comments</h2>
            <p className="text-muted-foreground">Feedback and comments from shared project links.</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search comments, authors, or projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="recent">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {filteredComments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No comments yet</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No comments match your search criteria."
                    : "Share project links to start receiving feedback."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredComments.map((comment) => {
              const shareLink = getShareLink(comment.projectId)
              return (
                <Card key={comment.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{comment.author}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {comment.email}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(comment.createdAt).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            {getSongName(comment.songId)} - {getVersionName(comment.songId, comment.versionId)}
                          </div>
                        </div>
                      </div>
                      {shareLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(shareLink, "_blank")}
                          className="h-8"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Project:</span>
                        <Badge variant="secondary">{getProjectName(comment.projectId)}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Results Summary */}
        {comments.length > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredComments.length} of {comments.length} comments
          </div>
        )}
      </div>
    </div>
  )
}

export default function CommentsPage() {
  return (
    <DashboardWrapper>
      <AuthGuard>
        <CommentsPageContent />
      </AuthGuard>
    </DashboardWrapper>
  )
}
