
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient()

export async function GET() {
  try {
    const conversations = await prisma.conversations.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json()

    const conversation = await prisma.conversations.create({
      data: {
        id: uuidv4(),
        title: title || 'Nova Conversa',
        updated_at: new Date()
      }
    })

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}
