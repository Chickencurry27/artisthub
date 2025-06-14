"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"
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
import type { Client } from "@/app/(auth)/clients/page"
import type { Project } from "@/components/projects-grid"

interface ProjectFormProps {
  clients: Client[]
  editingProject?: Project
  preSelectedClientId?: string
  onSubmit: (project: {
    name: string
    description: string
    clientId: string
    status: "active" | "completed" | "on-hold"
    budget: number
    startDate: string
    endDate?: string
  }) => void
  onDelete?: (projectId: string) => void
}

export function ProjectForm({ clients, editingProject, preSelectedClientId, onSubmit, onDelete }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientId: preSelectedClientId || "",
    status: "active" as const,
    budget: "",
    startDate: "",
    endDate: "",
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (editingProject) {
      setFormData({
        name: editingProject.name,
        description: editingProject.description,
        clientId: editingProject.clientId,
        status: editingProject.status,
        budget: editingProject.budget.toString(),
        startDate: editingProject.startDate,
        endDate: editingProject.endDate || "",
      })
    }
  }, [editingProject])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.clientId || !formData.startDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    onSubmit({
      ...formData,
      budget: Number.parseFloat(formData.budget) || 0,
      endDate: formData.endDate || undefined,
    })

    if (!editingProject) {
      setFormData({
        name: "",
        description: "",
        clientId: preSelectedClientId || "",
        status: "active",
        budget: "",
        startDate: "",
        endDate: "",
      })
    }

    toast({
      title: "Success",
      description: editingProject ? "Project updated successfully!" : "Project added successfully!",
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleDelete = () => {
    if (editingProject && onDelete) {
      onDelete(editingProject.id)
      setShowDeleteDialog(false)
      toast({
        title: "Success",
        description: "Project deleted successfully!",
      })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter project name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientId">Client *</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, clientId: value }))}
              disabled={!!preSelectedClientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.artistname ? `(${client.artistname})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter project description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget ($)</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              value={formData.budget}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            {editingProject ? "Update Project" : "Add Project"}
          </Button>
          {editingProject && onDelete && (
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
              This action cannot be undone. This will permanently delete the project and all associated songs.
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
