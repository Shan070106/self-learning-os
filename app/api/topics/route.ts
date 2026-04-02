import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  // @ts-ignore
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const subjectId = searchParams.get("subjectId")

  if (!subjectId) {
    return new NextResponse("subjectId is required", { status: 400 })
  }

  try {
    // Verify user owns the subject
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        // @ts-ignore
        userId: session.user.id
      }
    })

    if (!subject) {
      return new NextResponse("Unauthorized or Subject not found", { status: 403 })
    }

    const topics = await prisma.topic.findMany({
      where: {
        subjectId
      },
      orderBy: { createdAt: "asc" }
    })
    
    return NextResponse.json(topics)
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  // @ts-ignore
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()
    const { title, description, subjectId, parentId } = body

    if (!title || !subjectId) {
      return new NextResponse("Title and subjectId are required", { status: 400 })
    }

    // Verify user owns the subject
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        // @ts-ignore
        userId: session.user.id
      }
    })

    if (!subject) {
      return new NextResponse("Unauthorized or Subject not found", { status: 403 })
    }

    if (parentId) {
      // Verify parent topic belongs to the same subject
      const parentTopic = await prisma.topic.findFirst({
        where: { id: parentId, subjectId }
      })
      if (!parentTopic) {
        return new NextResponse("Invalid parent topic", { status: 400 })
      }
    }

    const topic = await prisma.topic.create({
      data: {
        title,
        description,
        subjectId,
        parentId: parentId || null
      }
    })

    return NextResponse.json(topic)
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
