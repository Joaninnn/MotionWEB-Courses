import { Metadata, Viewport } from "next";
import "./global.scss";
import StoreProvider from "@/redux/storeProvider";

// Определяем базовые URL и константы для SEO
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://online-course.motion.kg';
const SITE_NAME = 'Motion Web Academy - Online Course Motion Web';

export const metadata: Metadata = {
    title: {
        default: 'Online Course Motion Web | Motion Web Academy - Онлайн Курс Моушн Веб',
        template: `%s | Online Course Motion Web - Онлайн Курс Моушн Веб`
    },
    description: "Online course Motion Web - изучайте Python, Django, JavaScript, React с Motion Web Academy. Онлайн курс Моушн Веб - структурированные видеоуроки, менторы, чаты. Лучший онлайн курс программирования в Кыргызстане!",
    robots: "index, follow",
    keywords: [
        "online course motion web",
        "онлайн курс моушн веб",
        "motion web academy",
        "моушн веб академия",
        "online course",
        "онлайн курс",
        "Python",
        "Python курсы",
        "Django",
        "JavaScript",
        "React",
        "веб-разработка",
        "веб разработка курсы",
        "программирование",
        "курсы программирования",
        "обучение программированию",
        "ментор программирование",
        "онлайн-образование",
        "онлайн образование кыргызстан",
        "IT-курсы",
        "айти курсы",
        "курсы айти бишкек",
        "программирование бишкек",
        "разработчик курсы",
        "frontend курсы",
        "backend курсы",
        "fullstack курсы",
        "обучение Python",
        "обучение JavaScript",
        "курсы React",
        "веб программирование"
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
        title: 'Online Course Motion Web | Онлайн Курс Моушн Веб - Motion Web Academy',
        description: "Online course Motion Web - лучшие курсы Python, Django, JavaScript, React. Онлайн курс Моушн Веб - обучение программированию с менторами в Кыргызстане. Структурированные видеоуроки и чаты.",
        type: 'website',
        locale: 'ru_RU',
        url: SITE_URL,
        siteName: SITE_NAME,
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Online Course Motion Web - Онлайн Курс Моушн Веб'
            }
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Online Course Motion Web | Motion Web Academy',
        description: "Онлайн курс Моушн Веб - обучение программированию Python, Django, JavaScript, React в Кыргызстане",
        images: ['/og-image.png']
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
                {/* Additional SEO Meta Tags */}
                <meta name="author" content="Motion Web Academy" />
                <meta name="copyright" content="Motion Web Academy" />
                <meta name="language" content="Russian" />
                <meta name="distribution" content="global" />
                <meta name="revisit-after" content="1 days" />
                <meta name="rating" content="general" />
                <meta name="target" content="all" />
                <meta name="audience" content="all" />
                <meta name="coverage" content="Worldwide" />
                <meta name="HandheldFriendly" content="True" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="format-detection" content="telephone=no" />
                <meta name="msapplication-TileColor" content="#000000" />
                <meta name="msapplication-config" content="/browserconfig.xml" />

                {/* Google Site Verification - НЕ УДАЛЯТЬ */}
                <meta name="google-site-verification" content="Gl9_VbWYuYd_-41RfSLrAcF92EkKOEnTDw4prwKSVdE" />

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
                
                {/* Structured Data для SEO - Educational Organization */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "EducationalOrganization",
                            "name": "Motion Web Academy - Online Course Motion Web",
                            "alternateName": "Онлайн Курс Моушн Веб",
                            "url": SITE_URL,
                            "description": "Online course Motion Web - лучшие курсы Python, Django, JavaScript, React. Онлайн курс Моушн Веб - обучение программированию с менторами в Кыргызстане.",
                            "foundingDate": "2024",
                            "areaServed": {
                                "@type": "Country",
                                "name": "Kyrgyzstan"
                            },
                            "sameAs": [
                                "https://instagram.com/motionwebacademy",
                                "https://telegram.org/motionwebacademy"
                            ],
                            "offers": {
                                "@type": "Offer",
                                "category": "Educational Services",
                                "name": "Онлайн-курсы программирования Python, Django, JavaScript, React",
                                "description": "Курсы веб-разработки, обучение программированию с менторами"
                            },
                            "hasCourse": [
                                {
                                    "@type": "Course",
                                    "name": "Python Programming",
                                    "description": "Курс Python программирования с нуля"
                                },
                                {
                                    "@type": "Course",
                                    "name": "Django Framework",
                                    "description": "Backend разработка на Django"
                                },
                                {
                                    "@type": "Course",
                                    "name": "JavaScript",
                                    "description": "Frontend разработка на JavaScript"
                                },
                                {
                                    "@type": "Course",
                                    "name": "React",
                                    "description": "Современная frontend разработка на React"
                                }
                            ]
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
