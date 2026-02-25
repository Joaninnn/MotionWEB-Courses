import { Metadata, Viewport } from "next";
import "./global.scss";
import StoreProvider from "@/redux/storeProvider";

// Определяем базовые URL и константы для SEO
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://motion-web-academy.com';
const SITE_NAME = 'MOTION WEB ACADEMY';

export const metadata: Metadata = {
    title: {
        default: SITE_NAME,
        template: `%s | ${SITE_NAME}`
    },
    description: "Изучайте Python, Django, JavaScript и React с Motion Web Academy. Структурированные видеоуроки, групповые чаты и персональная поддержка менторов.",
    robots: "index, follow",
    keywords: [
        "Python",
        "Django", 
        "JavaScript",
        "React",
        "веб-разработка",
        "программирование",
        "курсы",
        "обучение",
        "ментор",
        "онлайн-образование",
        "IT-курсы"
    ],
    authors: [{ name: "Motion Web Academy" }],
    creator: "Motion Web Academy",
    publisher: "Motion Web Academy",
    metadataBase: new URL(SITE_URL),
    alternates: {
        canonical: '/',
        languages: {
            'ru-RU': '/ru',
            'en-US': '/en'
        }
    },
    openGraph: {
        title: SITE_NAME,
        description: "Изучайте Python, Django, JavaScript и React с Motion Web Academy",
        type: 'website',
        locale: 'ru_RU',
        url: SITE_URL,
        siteName: SITE_NAME,
        images: [
            {
                url: '/Logo.svg',
                width: 1200,
                height: 630,
                alt: `${SITE_NAME} - Логотип`
            }
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: SITE_NAME,
        description: "Изучайте Python, Django, JavaScript и React с Motion Web Academy",
        images: ['/Logo.svg']
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
        yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION
    }
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: '#000000',
    colorScheme: 'dark'
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru" dir="ltr">
            <head>
                {/* Preconnect для улучшения производительности */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                
                {/* Favicon */}
                <link
                    rel="icon"
                    type="image/svg+xml"
                    sizes="32x32"
                    href="/Logo.svg"
                />
                <link
                    rel="apple-touch-icon"
                    sizes="180x180"
                    href="/Logo.svg"
                />
                
                {/* Manifest для PWA */}
                <link rel="manifest" href="/manifest.json" />
                
                {/* Structured Data для SEO */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "EducationalOrganization",
                            "name": SITE_NAME,
                            "url": SITE_URL,
                            "description": "Изучайте Python, Django, JavaScript и React с Motion Web Academy",
                            "sameAs": [
                                "https://twitter.com/motionwebacademy",
                                "https://github.com/motionwebacademy"
                            ],
                            "offers": {
                                "@type": "Offer",
                                "category": "Educational Services",
                                "name": "Онлайн-курсы программирования"
                            }
                        })
                    }}
                />
            </head>
            <body className="dark-theme">
                <StoreProvider>{children}</StoreProvider>
            </body>
        </html>
    );
}
