import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.andreshenao.com.au';

    const routes = [
        '',
        '/war-room',
        '/legal',
        '/privacy',
        '/terms',
        '/cookies',
    ];

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : route === '/war-room' ? 0.9 : 0.5,
    }));
}
