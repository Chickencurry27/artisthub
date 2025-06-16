import { NextResponse } from 'next/server';
// Adjust the import path according to your actual Prisma Client output location
// It should be '../lib/generated/prisma' as specified in schema.prisma
// but sometimes it's directly '@prisma/client' if a specific generation step was run.
// Let's assume the schema.prisma output path is correctly mapped by tsconfig
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MOCK_USER_ID = "mock-user-id-123"; // Placeholder for actual user ID from auth

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }
    const newClient = await prisma.client.create({
      data: {
        name: data.name,
        userId: MOCK_USER_ID,
      },
    });
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    // Consider more specific error messages based on error type
    return NextResponse.json({ message: "Error creating client" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: MOCK_USER_ID },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ message: "Error fetching clients" }, { status: 500 });
  }
}
