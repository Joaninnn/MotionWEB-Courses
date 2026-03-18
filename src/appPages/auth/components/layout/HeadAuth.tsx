"use client";

import Head from "next/head";

interface HeadAuthProps {
    title?: string;
}

export default function HeadAuth({ title = "Вход в систему" }: HeadAuthProps) {
    return (
        <Head>
            <title>{title}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <meta name="format-detection" content="telephone=no" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="mobile-web-app-capable" content="yes" />
        </Head>
    );
}
