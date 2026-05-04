import MotionChat from "@/appPages/site/components/pages/MotionChat";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Чат | Online Course Motion Web - Онлайн Курс Моушн Веб",
    description: "Общайтесь с менторами и студентами Motion Web Academy. Онлайн курс Моушн Веб - чат для обсуждения уроков Python, Django, JavaScript, React.",
    keywords: ["чат motion web", "менторы программирование", "обсуждение курсов", "помощь python", "онлайн курс моушн веб"],
    openGraph: {
        title: "Чат | Online Course Motion Web",
        description: "Общайтесь с менторами и студентами Motion Web Academy",
    },
};

function page() {
    return (
        <div>
            <MotionChat />
        </div>
    );
}

export default page;
