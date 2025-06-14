"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, Music, X } from "lucide-react"

interface SongFormProps {
  songName?: string
  isNewVersion?: boolean
  onSubmit: (song: {
    name: string
    version: string
    fileUrl?: string
    notes?: string
  }) => void
}

export function SongForm({ songName = "", isNewVersion = false, onSubmit }: SongFormProps) {
  const [formData, setFormData] = useState({
    name: songName,
    version: isNewVersion ? "" : "1.0",
    fileUrl: "",
    notes: "",
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.version) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    let fileUrl = formData.fileUrl

    if (audioFile) {
      // Create a blob URL for the audio file instead of base64
      fileUrl = URL.createObjectURL(audioFile)
    }

    onSubmit({
      ...formData,
      fileUrl: fileUrl || undefined,
      notes: formData.notes || undefined,
    })

    setFormData({ name: "", version: "1.0", fileUrl: "", notes: "" })
    setAudioFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit for blob URLs
        toast({
          title: "Error",
          description: "Audio file size should be less than 50MB.",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Error",
          description: "Please select an audio file.",
          variant: "destructive",
        })
        return
      }

      setAudioFile(file)
    }
  }

  const clearFile = () => {
    setAudioFile(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Song Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter song name"
          required
          disabled={isNewVersion}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="version">Version *</Label>
        <Input
          id="version"
          name="version"
          value={formData.version}
          onChange={handleChange}
          placeholder={isNewVersion ? "e.g., 2.0, v3.1, final" : "e.g., 1.0, v1.1, demo"}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Audio File</Label>
        <div className="space-y-2">
          {audioFile ? (
            <div className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate max-w-[200px]">{audioFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={clearFile} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div>
              <Input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" id="audio-upload" />
              <Label htmlFor="audio-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground">
                  <Upload className="h-4 w-4" />
                  Upload audio file
                </div>
              </Label>
            </div>
          )}
          <div className="text-sm text-muted-foreground text-center">or</div>
          <Input
            placeholder="Enter audio file URL"
            name="fileUrl"
            value={formData.fileUrl}
            onChange={handleChange}
            disabled={!!audioFile}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any notes about this version"
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isUploading}>
        {isUploading ? "Processing..." : isNewVersion ? "Add Version" : "Add Song"}
      </Button>
    </form>
  )
}
