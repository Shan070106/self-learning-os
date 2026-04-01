import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  // @ts-ignore - session.user.id is injected via callbacks
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const subjects = await prisma.subject.findMany({
      where: {
        // @ts-ignore
        userId: session.user.id
      },
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json(subjects)
  } catch (error) {
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
    const { name, description } = body

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        description,
        // @ts-ignore
        userId: session.user.id
      }
    })

    return NextResponse.json(subject)
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
