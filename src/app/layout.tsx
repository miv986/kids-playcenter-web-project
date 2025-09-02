import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Ludoteca Arcoiris',
    description: 'Aplicación web para ludoteca',
    icons:{
        icon:"/vite.svg",
    }
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <div id="root">{children}</div>
            </body>
        </html>
    )
}