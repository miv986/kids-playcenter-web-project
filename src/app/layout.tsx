import type { Metadata } from "next";
import Providers from "./providers";
import "../index.css";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://somriuresicolors.es"),
    title: {
        default: "Ludoteca Somriures & Colors - Diversión y Aprendizaje para Niños",
        template: "%s | Somriures & Colors"
    },
    description: "Ludoteca especializada en actividades educativas y recreativas para niños. Fiestas de cumpleaños, talleres de arte, música, cuentacuentos y guardería. Espacio seguro donde la imaginación y el aprendizaje van de la mano.",
    keywords: ["ludoteca", "guardería", "fiestas infantiles", "talleres niños", "actividades infantiles", "centro recreativo", "educación infantil", "juegos educativos"],
    authors: [{ name: "Somriures & Colors" }],
    creator: "Somriures & Colors",
    publisher: "Somriures & Colors",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    icons: {
        icon: "/logo.png",
        apple: "/logo.png",
    },
    manifest: "/manifest.json",
    openGraph: {
        type: "website",
        locale: "es_ES",
        alternateLocale: ["ca_ES"],
        url: "/",
        siteName: "Somriures & Colors",
        title: "Ludoteca Somriures & Colors - Diversión y Aprendizaje para Niños",
        description: "Ludoteca especializada en actividades educativas y recreativas para niños. Fiestas de cumpleaños, talleres de arte, música, cuentacuentos y guardería.",
        images: [
            {
                url: "/logo.png",
                width: 1200,
                height: 630,
                alt: "Somriures & Colors - Ludoteca",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Ludoteca Somriures & Colors",
        description: "Diversión y aprendizaje para niños. Fiestas, talleres, actividades educativas y guardería.",
        images: ["/logo.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: '/',
        languages: {
            'es-ES': '/',
            'ca-ES': '/',
        },
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Somriures & Colors",
        "description": "Ludoteca especializada en actividades educativas y recreativas para niños",
        "url": process.env.NEXT_PUBLIC_SITE_URL || "https://somriuresicolors.es",
        "telephone": "+34 627 64 42 12",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Avenida Blasco Ibañez, 37",
            "addressLocality": "Canals",
            "addressRegion": "Valencia",
            "postalCode": "46650",
            "addressCountry": "ES"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 38.962493690778544,
            "longitude": -0.5870103741332734
        },
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"],
                "opens": "17:00",
                "closes": "21:00"
            },
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Friday", "Saturday", "Sunday"],
                "opens": "10:00",
                "closes": "22:00"
            }
        ],
        "priceRange": "$$",
        "image": "/logo.png",
        "sameAs": [
            "https://www.instagram.com/somriuresicolors?igsh=MXZlZmdkYmRqejFzYw==",
            "https://wa.me/+34627644212",
        ]
    };

    return (
        <html lang="es">
            <body className="min-h-screen bg-gradient-to-b from-pink-50 via-green-50 to-yellow-50 transition-colors duration-300">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                <Providers>
                    <Header />
                    <main>{children}</main>
                    <Footer />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#fff',
                                color: '#363636',
                            },
                            success: {
                                duration: 3000,
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                duration: 4000,
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </Providers>
            </body>
        </html>
    );
}
