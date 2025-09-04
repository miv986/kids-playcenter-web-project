import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Dashboard } from '../components/Dashboard/Dashboard';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Si no está logueado, redirige a la home
    useEffect(() => {
        if (!user) router.push('/');
    }, [user]);

    if (!user) return null; // Mientras redirige

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 via-green-50 to-yellow-50">
            <Header />
            <main>
                <Dashboard />
            </main>
            <Footer />
        </div>
    );
}
