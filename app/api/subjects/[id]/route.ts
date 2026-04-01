import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  // @ts-ignore
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { id } = await params
    
    // Verify ownership
    const subject = await prisma.subject.findUnique({
      where: { id }
    })

    if (!subject) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // @ts-ignore
    if (subject.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    await prisma.subject.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
