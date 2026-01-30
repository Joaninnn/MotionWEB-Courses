import { Metadata, Viewport } from "next";
import "./global.scss";
import StoreProvider from "@/redux/storeProvider";

export const metadata: Metadata = {
    title: "MOTION WEB ACADEMY",
    description:
        "Изучайте Python, Django, JavaScript и React с Motion Web Academy. Структурированные видеоуроки, групповые чаты и персональная поддержка.",
    robots: "index, follow",
    keywords: ["Python", "Django", "JavaScript", "React", "веб-разработка", "программирование", "курсы", "обучение"],
    authors: [{ name: "Motion Web Academy" }],
    openGraph: {
        title: "MOTION WEB ACADEMY",
        description: "Изучайте Python, Django, JavaScript и React с Motion Web Academy",
        type: "website",
        locale: "ru_RU",
    },
    twitter: {
        card: "summary_large_image",
        title: "MOTION WEB ACADEMY",
        description: "Изучайте Python, Django, JavaScript и React с Motion Web Academy",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru">
            <head>
                <link
                    rel="icon"
                    type="image/svg"
                    sizes="32x32"
                    href="/Logo.svg"
                />
            </head>
            <body>
                <StoreProvider>{children}</StoreProvider>
            </body>
        </html>
    );
}
