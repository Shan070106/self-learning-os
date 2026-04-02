import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  // @ts-ignore
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const params = await context.params
    const topicId = params.id

    // Find the topic to check ownership
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { subject: true }
    })

    if (!topic) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // @ts-ignore
    if (topic.subject.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    await prisma.topic.delete({
      where: { id: topicId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
