"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AudioPlayer } from "@/components/audio-player"
import { useToast } from "@/hooks/use-toast"
import {
  Music,
  Calendar,
  User,
  MessageSquare,
  Send,
  Clock,
  FileAudio,
  Building2,
  ChevronRight,
  Play,
  Pause,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Project, Song, SongVersion } from "@/components/projects-grid"
import type { Comment } from "@/lib/share-utils"

interface SharedProjectPageProps {
  params: {
    projectId: string
    token: string
  }
}

export default function SharedProjectPage({ params }: SharedProjectPageProps) {
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [expandedSongs, setExpandedSongs] = useState<Record<string, boolean>>({})
  const [playingSong, setPlayingSong] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [newComment, setNewComment] = useState({
    author: "",
    email: "",
    content: "",
    songId: "",
    versionId: "",
  })

  useEffect(() => {
    // Validate share link and load project data
    const validateAndLoadProject = () => {
      try {
        console.log("Validating share link:", params.projectId, params.token)

        // Get all shared projects from localStorage
        const sharedProjects = JSON.parse(localStorage.getItem("sharedProjects") || "[]")
        console.log("Shared projects:", sharedProjects)

        const shareData = sharedProjects.find(
          (share: any) => share.projectId === params.projectId && share.token === params.token && share.isActive,
        )

        console.log("Share data found:", shareData)

        if (!shareData) {
          console.log("No valid share data found")
          setIsValid(false)
          setIsLoading(false)
          return
        }

        // Check if link has expired
        if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
          console.log("Share link expired")
          setIsValid(false)
          setIsLoading(false)
          return
        }

        // Find the project data
        let foundProject = null
        let foundSongs: Song[] = []

        // Search through all user data to find the project
        const allKeys = Object.keys(localStorage)

        for (const key of allKeys) {
          if (key.includes("_projects")) {
            try {
              const projects = JSON.parse(localStorage.getItem(key) || "[]")
              const project = projects.find((p: Project) => p.id === params.projectId)
              if (project) {
                console.log("Found project:", project)
                foundProject = project
                break
              }
            } catch (error) {
              console.error("Error parsing projects:", error)
              continue
            }
          }
        }

        if (!foundProject) {
          console.log("Project not found")
          setIsValid(false)
          setIsLoading(false)
          return
        }

        // Find songs for this project
        for (const key of allKeys) {
          if (key.includes("_songs")) {
            try {
              const allSongs = JSON.parse(localStorage.getItem(key) || "[]")
              const projectSongs = allSongs.filter((s: Song) => s.projectId === params.projectId)
              if (projectSongs.length > 0) {
                console.log("Found songs:", projectSongs)
                foundSongs = projectSongs
                break
              }
            } catch (error) {
              console.error("Error parsing songs:", error)
              continue
            }
          }
        }

        setProject(foundProject)
        setSongs(foundSongs)
        setIsValid(true)

        // Initialize all songs as expanded
        const expanded: Record<string, boolean> = {}
        foundSongs.forEach((song) => {
          expanded[song.id] = true
        })
        setExpandedSongs(expanded)

        // Load comments
        const savedComments = localStorage.getItem(`comments_${params.projectId}`)
        if (savedComments) {
          setComments(JSON.parse(savedComments))
        }
      } catch (error) {
        console.error("Error loading shared project:", error)
        setIsValid(false)
      } finally {
        setIsLoading(false)
      }
    }

    validateAndLoadProject()
  }, [params.projectId, params.token])

  const handlePlayPause = (versionId: string) => {
    if (playingSong === versionId) {
      setPlayingSong(null)
    } else {
      setPlayingSong(versionId)
    }
  }

  const toggleSongExpand = (songId: string) => {
    setExpandedSongs((prev) => ({
      ...prev,
      [songId]: !prev[songId],
    }))
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.author || !newComment.email || !newComment.content || !newComment.songId || !newComment.versionId) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select a song version.",
        variant: "destructive",
      })
      return
    }

    const comment: Comment = {
      id: Date.now().toString(),
      projectId: params.projectId,
      songId: newComment.songId,
      versionId: newComment.versionId,
      author: newComment.author,
      email: newComment.email,
      content: newComment.content,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    }

    const updatedComments = [...comments, comment]
    setComments(updatedComments)

    // Save comments to localStorage
    try {
      localStorage.setItem(`comments_${params.projectId}`, JSON.stringify(updatedComments))
    } catch (error) {
      console.error("Error saving comments:", error)
    }

    setNewComment({
      author: "",
      email: "",
      content: "",
      songId: "",
      versionId: "",
    })

    toast({
      title: "Success",
      description: "Comment added successfully!",
    })
  }

  const sortVersionsByDate = (versions: SongVersion[]) => {
    return [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const getVersionComments = (versionId: string) => {
    return comments.filter((comment) => comment.versionId === versionId)
  }

  const getSongAndVersionName = (songId: string, versionId: string) => {
    const song = songs.find((s) => s.id === songId)
    const version = song?.versions.find((v) => v.id === versionId)
    return song && version ? `${song.name} - v${version.version}` : "Unknown"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isValid || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Share Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">This share link is invalid, expired, or has been deactivated.</p>
            <p className="text-sm text-muted-foreground">Please contact the project owner for a new link.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {project.clientName}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Started {new Date(project.startDate).toLocaleDateString()}
                </div>
                <Badge
                  variant="secondary"
                  className={
                    project.status === "active"
                      ? "bg-green-100 text-green-800"
                      : project.status === "completed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {project.status === "on-hold"
                    ? "On Hold"
                    : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
          {project.description && <p className="mt-4 text-muted-foreground">{project.description}</p>}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Songs Section */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Songs & Versions ({songs.length})</h2>
              {songs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No songs available for this project yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {songs.map((song) => {
                    const sortedVersions = sortVersionsByDate(song.versions)
                    return (
                      <Card key={song.id}>
                        <Collapsible open={expandedSongs[song.id]} onOpenChange={() => toggleSongExpand(song.id)}>
                          <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <ChevronRight
                                    className={`h-4 w-4 transition-transform ${
                                      expandedSongs[song.id] ? "rotate-90" : ""
                                    }`}
                                  />
                                  <Music className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <CardTitle className="text-lg">{song.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                      {song.versions.length} version{song.versions.length !== 1 ? "s" : ""} • Latest: v
                                      {sortedVersions[0]?.version} •{new Date(song.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                {sortedVersions[0]?.fileUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePlayPause(sortedVersions[0].id)
                                    }}
                                  >
                                    {playingSong === sortedVersions[0].id ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <div className="space-y-4">
                                {sortedVersions.map((version, index) => (
                                  <div
                                    key={version.id}
                                    className={`p-4 rounded-lg border ${
                                      index === 0 ? "bg-green-50 border-green-200" : "bg-background"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                          <Badge variant={index === 0 ? "default" : "secondary"}>
                                            v{version.version}
                                          </Badge>
                                          {index === 0 && (
                                            <Badge variant="outline" className="text-green-700 border-green-300">
                                              Latest
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(version.createdAt).toLocaleDateString()}
                                          </div>
                                          {version.fileUrl && (
                                            <div className="flex items-center gap-1">
                                              <FileAudio className="h-3 w-3" />
                                              Audio file
                                            </div>
                                          )}
                                          <div className="flex items-center gap-1">
                                            <MessageSquare className="h-3 w-3" />
                                            {getVersionComments(version.id).length} comments
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Audio Player */}
                                    {version.fileUrl && (
                                      <div className="mb-3">
                                        <AudioPlayer
                                          src={version.fileUrl}
                                          isPlaying={playingSong === version.id}
                                          onPlayPause={() => handlePlayPause(version.id)}
                                        />
                                      </div>
                                    )}

                                    {/* Notes */}
                                    {version.notes && (
                                      <div className="mb-3 p-3 bg-muted/50 rounded text-sm">
                                        <strong>Notes:</strong> {version.notes}
                                      </div>
                                    )}

                                    {/* Comments for this version */}
                                    <div className="space-y-3">
                                      {getVersionComments(version.id).map((comment) => (
                                        <div key={comment.id} className="bg-white p-3 rounded border">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="font-medium text-sm">{comment.author}</div>
                                            <div className="text-xs text-muted-foreground">
                                              {new Date(comment.createdAt).toLocaleString()}
                                            </div>
                                          </div>
                                          <p className="text-sm">{comment.content}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Comment Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Add Comment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="author">Name *</Label>
                      <Input
                        id="author"
                        value={newComment.author}
                        onChange={(e) => setNewComment((prev) => ({ ...prev, author: e.target.value }))}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newComment.email}
                        onChange={(e) => setNewComment((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Song Version *</Label>
                    <select
                      id="version"
                      value={`${newComment.songId}|${newComment.versionId}`}
                      onChange={(e) => {
                        const [songId, versionId] = e.target.value.split("|")
                        setNewComment((prev) => ({ ...prev, songId, versionId }))
                      }}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm"
                      required
                    >
                      <option value="">Select a song version...</option>
                      {songs.map((song) =>
                        song.versions.map((version) => (
                          <option key={`${song.id}|${version.id}`} value={`${song.id}|${version.id}`}>
                            {song.name} - v{version.version}
                          </option>
                        )),
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Comment *</Label>
                    <Textarea
                      id="content"
                      value={newComment.content}
                      onChange={(e) => setNewComment((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="Share your feedback..."
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
