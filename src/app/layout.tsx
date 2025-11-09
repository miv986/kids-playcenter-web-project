import type { Metadata } from "next";
import Providers from "./providers";
import "../index.css";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
    title: "Ludoteca Somriures & Colors",
    description: "Aplicación web para ludoteca",
    icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <body className="min-h-screen bg-gradient-to-b from-pink-50 via-green-50 to-yellow-50">
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
