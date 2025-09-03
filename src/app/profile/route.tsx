import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
    const { userId, name } = await req.json()

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name },
    })

    return NextResponse.json({ user: updatedUser })
}
