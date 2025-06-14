"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Edit, Mail, Phone, Palette, User } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Client } from "@/app/(auth)/clients/page"

interface ClientsGridProps {
  clients: Client[]
  onEdit: (client: Client) => void
}

export function ClientsGrid({ clients, onEdit }: ClientsGridProps) {
  const router = useRouter()

  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Clients Yet</CardTitle>
          <CardDescription>Start by adding your first client to the system.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const handleCardClick = (clientId: string) => {
    router.push(`/projects?client=${clientId}`)
  }

  const handleEditClick = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation()
    onEdit(client)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {clients.map((client) => (
        <Card
          key={client.id}
          className="cursor-pointer hover:shadow-md transition-shadow duration-200 aspect-square flex flex-col"
          onClick={() => handleCardClick(client.id)}
        >
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="flex items-center justify-between">
              <Avatar className="h-12 w-12">
                <AvatarImage src={client.imageUrl || "/placeholder.svg"} alt={client.name} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={(e) => handleEditClick(e, client)} className="h-8 w-8 p-0">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg leading-tight">{client.name}</CardTitle>
              {client.artistname && (
                <div className="flex items-center gap-1">
                  <Palette className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{client.artistname}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pt-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{client.phone}</span>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t">
              <Badge variant="secondary" className="text-xs">
                Added {new Date(client.createdAt).toLocaleDateString()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
