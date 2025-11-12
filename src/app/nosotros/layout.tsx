import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Nosotros - Conoce Nuestra Ludoteca",
    description: "Somos un equipo apasionado dedicado a crear experiencias mágicas para los niños. Nuestra ludoteca es más que un lugar de juegos: es un espacio donde la imaginación y el aprendizaje van de la mano.",
    keywords: ["sobre nosotros", "equipo ludoteca", "misión ludoteca", "visión ludoteca", "educadores infantiles"],
    openGraph: {
        title: "Nosotros - Somriures & Colors",
        description: "Conoce nuestro equipo y nuestra misión de crear experiencias mágicas para los niños.",
        url: "/nosotros",
        type: "website",
        images: [
            {
                url: "/logo.png",
                width: 1200,
                height: 630,
                alt: "Nosotros - Somriures & Colors",
            },
        ],
    },
    alternates: {
        canonical: "/nosotros",
    },
};

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
    return children;
}


