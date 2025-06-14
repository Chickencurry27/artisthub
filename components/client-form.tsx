"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Upload, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Client } from "@/app/(auth)/clients/page"

interface ClientFormProps {
  editingClient?: Client
  onSubmit: (client: {
    name: string
    email: string
    phone: string
    artistname: string
    imageUrl?: string
  }) => void
  onDelete?: (clientId: string) => void
}

export function ClientForm({ editingClient, onSubmit, onDelete }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    artistname: "",
    imageUrl: "",
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name,
        email: editingClient.email,
        phone: editingClient.phone || "",
        artistname: editingClient.artistname || "",
        imageUrl: editingClient.imageUrl || "",
      })
      setImagePreview(editingClient.imageUrl || "")
    }
  }, [editingClient])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    onSubmit({
      ...formData,
      imageUrl: imagePreview || undefined,
    })

    if (!editingClient) {
      setFormData({ name: "", email: "", phone: "", artistname: "", imageUrl: "" })
      setImagePreview("")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setImagePreview(result)
        setFormData((prev) => ({ ...prev, imageUrl: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setFormData((prev) => ({ ...prev, imageUrl: url }))
    setImagePreview(url)
  }

  const clearImage = () => {
    setImagePreview("")
    setFormData((prev) => ({ ...prev, imageUrl: "" }))
  }

  const handleDelete = () => {
    if (editingClient && onDelete) {
      onDelete(editingClient.id)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="artistname">Artist Name</Label>
          <Input
            id="artistname"
            name="artistname"
            value={formData.artistname}
            onChange={handleChange}
            placeholder="Enter artist name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Contact Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter contact name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Profile Image</Label>
          <div className="flex items-center gap-4">
            {imagePreview && (
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={imagePreview || "/placeholder.svg"} alt="Preview" />
                  <AvatarFallback>IMG</AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={clearImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div>
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground">
                    <Upload className="h-4 w-4" />
                    Upload from computer
                  </div>
                </Label>
              </div>
              <div className="text-sm text-muted-foreground text-center">or</div>
              <Input placeholder="Enter image URL" value={formData.imageUrl} onChange={handleUrlChange} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            {editingClient ? "Update Client" : "Add Client"}
          </Button>
          {editingClient && onDelete && (
            <Button type="button" variant="destructive" onClick={() => setShowDeleteDialog(true)} className="px-3">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client and all associated projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
