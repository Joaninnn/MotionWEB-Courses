import Lessons from "@/appPages/site/components/pages/Lessons";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Уроки | Online Course Motion Web - Онлайн Курс Моушн Веб",
    description: "Уроки и курсы Python, Django, JavaScript, React от Motion Web Academy. Онлайн курс Моушн Веб - структурированное обучение программированию с видеоуроками и менторами.",
    keywords: ["уроки motion web", "курсы программирования", "Python уроки", "JavaScript обучение", "React курсы", "онлайн курс моушн веб"],
    openGraph: {
        title: "Уроки | Online Course Motion Web",
        description: "Уроки и курсы Python, Django, JavaScript, React от Motion Web Academy",
    },
};

function page() {
    return (
        <div>
            <Lessons />
        </div>
    );
}

export default page;
