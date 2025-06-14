"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AudioPlayer } from "@/components/audio-player"
import {
  Edit,
  Calendar,
  DollarSign,
  Music,
  User,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Plus,
  ChevronRight,
  FileAudio,
  Clock,
  MessageSquare,
  Share,
} from "lucide-react"

// Define the types directly in this file to avoid import issues
export interface Project {
  id: string
  name: string
  description: string
  clientId: string
  clientName: string
  status: "active" | "completed" | "on-hold"
  budget: number
  startDate: string
  endDate?: string
  createdAt: string
}

export interface Song {
  id: string
  name: string
  projectId: string
  versions: SongVersion[]
  createdAt: string
}

export interface SongVersion {
  id: string
  version: string
  fileUrl?: string
  notes?: string
  createdAt: string
}

interface ProjectsGridProps {
  projects: Project[]
  songs: Song[]
  onEdit: (project: Project) => void
  onAddSong: (projectId: string, projectName: string) => void
  onAddVersion: (songId: string, songName: string) => void
  onShare?: (project: Project) => void
}

const statusColors = {
  active: "bg-green-100 text-green-800 hover:bg-green-100",
  completed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  "on-hold": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
}

export function ProjectsGrid({ projects, songs, onEdit, onAddSong, onAddVersion, onShare }: ProjectsGridProps) {
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})
  const [expandedSongs, setExpandedSongs] = useState<Record<string, boolean>>({})
  const [playingSong, setPlayingSong] = useState<string | null>(null)

  useEffect(() => {
    // Initialize all projects as expanded
    const expanded: Record<string, boolean> = {}
    projects.forEach((project) => {
      expanded[project.id] = true
    })
    setExpandedProjects(expanded)
  }, [projects])

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Projects Yet</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  const toggleExpand = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }))
  }

  const toggleSongExpand = (songId: string) => {
    setExpandedSongs((prev) => ({
      ...prev,
      [songId]: !prev[songId],
    }))
  }

  const handleEditClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation()
    onEdit(project)
  }

  const handleAddSongClick = (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation()
    onAddSong(projectId, projectName)
  }

  const handleAddVersionClick = (e: React.MouseEvent, songId: string, songName: string) => {
    e.stopPropagation()
    onAddVersion(songId, songName)
  }

  const handlePlayPause = (versionId: string) => {
    if (playingSong === versionId) {
      setPlayingSong(null)
    } else {
      setPlayingSong(versionId)
    }
  }

  const sortVersionsByDate = (versions: SongVersion[]) => {
    return [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const getLatestVersion = (versions: SongVersion[]) => {
    return sortVersionsByDate(versions)[0]
  }

  const handleShareClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation()
    if (onShare) {
      onShare(project)
    }
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const projectSongs = songs.filter((song) => song.projectId === project.id)
        return (
          <Card key={project.id} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={statusColors[project.status]}>
                    {project.status === "on-hold"
                      ? "On Hold"
                      : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(project.id)}
                    className="h-8 w-8 p-0 ml-2"
                  >
                    {expandedProjects[project.id] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleShareClick(e, project)}
                    className="h-8 w-8 p-0"
                  >
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleEditClick(e, project)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">{project.name}</CardTitle>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{project.clientName}</span>
                </div>
              </div>
            </CardHeader>
            {expandedProjects[project.id] && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>
                          Started: {new Date(project.startDate).toLocaleDateString()}
                          {project.endDate && ` • Due: ${new Date(project.endDate).toLocaleDateString()}`}
                        </span>
                      </div>
                      {project.budget > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span>${project.budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => handleAddSongClick(e, project.id, project.name)}
                    >
                      <Music className="h-4 w-4 mr-2" />
                      Add Song
                    </Button>
                  </div>
                </div>

                {/* Full-width Songs & Versions Section */}
                {projectSongs.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold">Songs & Versions ({projectSongs.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {projectSongs.map((song) => {
                        const sortedVersions = sortVersionsByDate(song.versions)
                        const latestVersion = sortedVersions[0]
                        return (
                          <Card key={song.id} className="bg-muted/20">
                            <Collapsible open={expandedSongs[song.id]} onOpenChange={() => toggleSongExpand(song.id)}>
                              <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <ChevronRight
                                        className={`h-4 w-4 transition-transform ${
                                          expandedSongs[song.id] ? "rotate-90" : ""
                                        }`}
                                      />
                                      <Music className="h-5 w-5 text-muted-foreground" />
                                      <div>
                                        <h5 className="font-medium text-base">{song.name}</h5>
                                        <div className="text-sm text-muted-foreground">
                                          {song.versions.length} version{song.versions.length !== 1 ? "s" : ""} •
                                          Latest: v{latestVersion.version} •
                                          {new Date(song.createdAt).toLocaleDateString()}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {latestVersion.fileUrl && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handlePlayPause(latestVersion.id)
                                          }}
                                        >
                                          {playingSong === latestVersion.id ? (
                                            <Pause className="h-4 w-4" />
                                          ) : (
                                            <Play className="h-4 w-4" />
                                          )}
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => handleAddVersionClick(e, song.id, song.name)}
                                      >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Version
                                      </Button>
                                    </div>
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
                                              {version.notes && (
                                                <div className="flex items-center gap-1">
                                                  <MessageSquare className="h-3 w-3" />
                                                  Has notes
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          {version.fileUrl && !playingSong && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0"
                                              onClick={() => handlePlayPause(version.id)}
                                            >
                                              <Play className="h-4 w-4" />
                                            </Button>
                                          )}
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
                                          <div className="p-3 bg-muted/50 rounded text-sm">
                                            <strong>Notes:</strong> {version.notes}
                                          </div>
                                        )}
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
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
