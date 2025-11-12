import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://somriurescolors.es';
    const now = new Date();
    
    return [
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 1.0,
            alternates: {
                languages: {
                    es: baseUrl,
                    ca: baseUrl,
                },
            },
        },
        {
            url: `${baseUrl}/servicios`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.9,
            alternates: {
                languages: {
                    es: `${baseUrl}/servicios`,
                    ca: `${baseUrl}/servicios`,
                },
            },
        },
        {
            url: `${baseUrl}/nosotros`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.8,
            alternates: {
                languages: {
                    es: `${baseUrl}/nosotros`,
                    ca: `${baseUrl}/nosotros`,
                },
            },
        },
        {
            url: `${baseUrl}/precios`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.9,
            alternates: {
                languages: {
                    es: `${baseUrl}/precios`,
                    ca: `${baseUrl}/precios`,
                },
            },
        },
        {
            url: `${baseUrl}/galeria`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.7,
            alternates: {
                languages: {
                    es: `${baseUrl}/galeria`,
                    ca: `${baseUrl}/galeria`,
                },
            },
        },
        {
            url: `${baseUrl}/calendario`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.8,
            alternates: {
                languages: {
                    es: `${baseUrl}/calendario`,
                    ca: `${baseUrl}/calendario`,
                },
            },
        },
    ];
}



