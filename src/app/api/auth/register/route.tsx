import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabaseClient'



export async function POST(req: Request) {
    const { name, email, password } = await req.json()

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    return NextResponse.json({ user: authData.user })
}
