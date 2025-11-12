import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Galería - Momentos Mágicos en Nuestra Ludoteca",
    description: "Descubre los momentos especiales de nuestros niños disfrutando de las actividades, talleres y fiestas en Somriures & Colors.",
    keywords: ["galería ludoteca", "fotos actividades", "imágenes talleres", "fotos fiestas infantiles"],
    openGraph: {
        title: "Galería - Somriures & Colors",
        description: "Momentos mágicos de nuestros niños disfrutando de nuestras actividades.",
        url: "/galeria",
        type: "website",
        images: [
            {
                url: "/logo.png",
                width: 1200,
                height: 630,
                alt: "Galería - Somriures & Colors",
            },
        ],
    },
    alternates: {
        canonical: "/galeria",
    },
};

export default function GaleriaLayout({ children }: { children: React.ReactNode }) {
    return children;
}


