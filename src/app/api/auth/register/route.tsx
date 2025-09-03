import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabaseClient'
import { PrismaClient } from '@prisma/client'


const prisma = new PrismaClient()

export async function POST(req: Request) {
    const { name, email, password } = await req.json()

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // Guardar en Prisma
    const user = await prisma.user.create({
        data: {
            id: authData.user?.id!,
            email,
            name,
        },
    })

    return NextResponse.json({ user })
}
