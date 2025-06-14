"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter } from "lucide-react"
import { ClientForm } from "@/components/client-form"
import { ClientsGrid } from "@/components/clients-grid"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardWrapper } from "@/components/dashboard-wrapper"
import { useSubscription } from "@/components/subscription-provider"
import { checkLimits, calculateStorageUsage } from "@/lib/subscription-utils"

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  artistname: string
  imageUrl?: string
  createdAt: string
}

type SortOption = "last-added" | "alphabetical" | "artist-name" | "oldest-first"

function ClientsPageContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("last-added")
  const { subscription } = useSubscription()

  useEffect(() => {
    if (!user) return

    try {
      const userKey = `user_${user.id}`
      const savedClients = localStorage.getItem(`${userKey}_clients`)
      if (savedClients) {
        setClients(JSON.parse(savedClients))
      }
    } catch (error) {
      console.error("Error loading clients:", error)
    }
  }, [user])

  const saveClients = (updatedClients: Client[]) => {
    if (!user) return
    try {
      const userKey = `user_${user.id}`
      setClients(updatedClients)
      localStorage.setItem(`${userKey}_clients`, JSON.stringify(updatedClients))
    } catch (error) {
      console.error("Error saving clients:", error)
      toast({
        title: "Error",
        description: "Failed to save client data.",
        variant: "destructive",
      })
    }
  }

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          (client.artistname && client.artistname.toLowerCase().includes(query)) ||
          (client.phone && client.phone.includes(query)),
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "alphabetical":
          return a.name.localeCompare(b.name)
        case "artist-name":
          const artistA = a.artistname || ""
          const artistB = b.artistname || ""
          if (artistA === artistB) {
            return a.name.localeCompare(b.name)
          }
          return artistA.localeCompare(artistB)
        case "oldest-first":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "last-added":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return sorted
  }, [clients, searchQuery, sortBy])

  const handleAddClient = (client: Omit<Client, "id" | "createdAt">) => {
    try {
      // Check subscription limits
      const songs = JSON.parse(localStorage.getItem(`user_${user.id}_songs`) || "[]")
      const projects = JSON.parse(localStorage.getItem(`user_${user.id}_projects`) || "[]")
      const storageUsed = calculateStorageUsage(songs)
      const limits = checkLimits(subscription.tier, clients.length, projects.length, storageUsed)

      if (!limits.canAddClient) {
        toast({
          title: "Limit Reached",
          description: `You've reached the maximum number of clients for your ${subscription.tier} plan. Please upgrade to add more clients.`,
          variant: "destructive",
        })
        return
      }

      const newClient: Client = {
        ...client,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }
      const updatedClients = [...clients, newClient]
      saveClients(updatedClients)
      setIsDialogOpen(false)

      toast({
        title: "Success",
        description: "Client added successfully!",
      })
    } catch (error) {
      console.error("Error adding client:", error)
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setIsEditDialogOpen(true)
  }

  const handleUpdateClient = (updatedClientData: Omit<Client, "id" | "createdAt">) => {
    if (!editingClient) return

    try {
      const updatedClient: Client = {
        ...editingClient,
        ...updatedClientData,
      }

      const updatedClients = clients.map((client) => (client.id === editingClient.id ? updatedClient : client))
      saveClients(updatedClients)
      setIsEditDialogOpen(false)
      setEditingClient(null)

      toast({
        title: "Success",
        description: "Client updated successfully!",
      })
    } catch (error) {
      console.error("Error updating client:", error)
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClient = (id: string) => {
    try {
      const updatedClients = clients.filter((client) => client.id !== id)
      saveClients(updatedClients)

      // Also remove projects for this client
      if (user) {
        const userKey = `user_${user.id}`
        const projects = JSON.parse(localStorage.getItem(`${userKey}_projects`) || "[]")
        const updatedProjects = projects.filter((project: any) => project.clientId !== id)
        localStorage.setItem(`${userKey}_projects`, JSON.stringify(updatedProjects))

        // Also remove songs for projects of this client
        const songs = JSON.parse(localStorage.getItem(`${userKey}_songs`) || "[]")
        const projectIds = projects.filter((p: any) => p.clientId === id).map((p: any) => p.id)
        const updatedSongs = songs.filter((song: any) => !projectIds.includes(song.projectId))
        localStorage.setItem(`${userKey}_songs`, JSON.stringify(updatedSongs))
      }

      setIsEditDialogOpen(false)
      setEditingClient(null)

      toast({
        title: "Success",
        description: "Client deleted successfully!",
      })
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      })
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center justify-between w-full">
          <h1 className="text-lg font-semibold">My Clients</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <ClientForm onSubmit={handleAddClient} />
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Client Management</h2>
            <p className="text-muted-foreground">Click on a client card to view their projects.</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, email, artist name, or phone..."
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
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-added">Last Added</SelectItem>
                <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
                <SelectItem value="artist-name">Artist Name (A-Z)</SelectItem>
                <SelectItem value="oldest-first">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {searchQuery
              ? `Showing ${filteredAndSortedClients.length} of ${clients.length} clients`
              : `${clients.length} total clients`}
          </span>
          {searchQuery && (
            <Button variant="ghost" size="sm" onClick={clearSearch} className="h-auto p-0 text-sm">
              Clear search
            </Button>
          )}
        </div>

        {/* Clients Grid */}
        {filteredAndSortedClients.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <div>
                <h3 className="text-lg font-medium mb-2">No clients found</h3>
                <p className="text-muted-foreground mb-4">
                  No clients match your search for "{searchQuery}". Try adjusting your search terms.
                </p>
                <Button variant="outline" onClick={clearSearch}>
                  Clear search
                </Button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-2">No clients yet</h3>
                <p className="text-muted-foreground">Start by adding your first client to the system.</p>
              </div>
            )}
          </div>
        ) : (
          <ClientsGrid clients={filteredAndSortedClients} onEdit={handleEditClient} />
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <ClientForm
            editingClient={editingClient || undefined}
            onSubmit={handleUpdateClient}
            onDelete={handleDeleteClient}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ClientsPage() {
  return (
    <DashboardWrapper>
      <AuthGuard>
        <ClientsPageContent />
      </AuthGuard>
    </DashboardWrapper>
  )
}
