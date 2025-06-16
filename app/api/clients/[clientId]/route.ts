import { NextResponse } from 'next/server';
// Adjust import path as needed, similar to the other route file
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MOCK_USER_ID = "mock-user-id-123"; // Placeholder for actual user ID

interface Params {
  clientId: string;
}

// GET /api/clients/[clientId]
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { clientId } = params;
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: MOCK_USER_ID, // Ensure the client belongs to the mock user
      },
    });

    if (!client) {
      return NextResponse.json({ message: "Client not found or access denied" }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error) {
    console.error(`Error fetching client ${params.clientId}:`, error);
    return NextResponse.json({ message: "Error fetching client" }, { status: 500 });
  }
}

// PUT /api/clients/[clientId]
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { clientId } = params;
    const data = await request.json();

    // Basic validation for data
    if (!data.name) {
      return NextResponse.json({ message: "Name is required for update" }, { status: 400 });
    }

    const result = await prisma.client.updateMany({
      where: {
        id: clientId,
        userId: MOCK_USER_ID, // Ensure user owns the client
      },
      data: {
        name: data.name,
        // Add other fields to update as necessary
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ message: "Client not found or access denied for update" }, { status: 404 });
    }

    // Fetch the updated client to return it
    const updatedClient = await prisma.client.findUnique({
        where: { id: clientId }
    });
    return NextResponse.json(updatedClient);

  } catch (error) {
    console.error(`Error updating client ${params.clientId}:`, error);
    return NextResponse.json({ message: "Error updating client" }, { status: 500 });
  }
}

// DELETE /api/clients/[clientId]
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { clientId } = params;

    const result = await prisma.client.deleteMany({
      where: {
        id: clientId,
        userId: MOCK_USER_ID, // Ensure user owns the client
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ message: "Client not found or access denied for deletion" }, { status: 404 });
    }

    return NextResponse.json({ message: "Client deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting client ${params.clientId}:`, error);
    // Handle potential errors, e.g., if related records prevent deletion (foreign key constraints)
    // For now, a generic 500, but could be more specific.
    return NextResponse.json({ message: "Error deleting client" }, { status: 500 });
  }
}
