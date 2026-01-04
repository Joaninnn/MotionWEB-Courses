"use client";

import "./global.scss";
import LayoutClient from "./components/LayoutClient";
import { Provider } from "react-redux";
import { store } from "../src/redux/store";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <title>MOTION WEB ACADEMY</title>
                <meta
                    name="description"
                    content="Изучайте Python, Django, JavaScript и React с Motion Web Academy. Структурированные видеоуроки, групповые чаты и персональная поддержка."
                />
                <link
                    rel="icon"
                    type="image/svg"
                    sizes="32x32"
                    href="/Logo.svg"
                />
            </head>

            <body>
                <Provider store={store}>
                    <LayoutClient>{children}</LayoutClient>
                </Provider>
            </body>
        </html>
    );
}
