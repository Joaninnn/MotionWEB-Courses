import Login from "@/appPages/auth/components/pages/login/login";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Вход | Online Course Motion Web - Онлайн Курс Моушн Веб",
    description: "Войдите в Motion Web Academy. Онлайн курс Моушн Веб - изучайте Python, Django, JavaScript, React с лучшими менторами.",
    robots: "noindex, follow", // Login page should not be indexed
};

function page() {
    return (
        <div>
            <Login />
        </div>
    );
}

export default page;
