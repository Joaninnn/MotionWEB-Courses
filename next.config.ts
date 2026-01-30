/** @type {import('next').NextConfig} */
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig = {
    experimental: {
        webpackBuildWorker: false,
    },

    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "13.53.67.23",
                port: "",
                pathname: "/media/**",
            } as const,
        ],
        minimumCacheTTL: 60 * 60 * 24 * 30, // 30 дней
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },

    // Temporary fix for Vercel deployment
    typescript: {
        ignoreBuildErrors: true,
    },

    // Кеширование статических файлов
    async headers() {
        return [
            {
                source: '/_next/static/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/images/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/favicon.ico',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=86400',
                    },
                ],
            },
            {
                source: '/robots.txt',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=86400',
                    },
                ],
            },
            {
                source: '/sitemap.xml',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=86400',
                    },
                ],
            },
        ];
    },

    // Сжатие для продакшена
    compress: true,

    // Оптимизация сборки
    swcMinify: true,
    
    // Проверка экспериментальных фич
    logging: {
        fetches: {
            fullUrl: false,
        },
    },
};

export default withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
})(nextConfig);
