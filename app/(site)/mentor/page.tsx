import { Metadata } from "next";
import MentorClient from "./MentorClient";

export const metadata: Metadata = {
    title: "Ментор | Online Course Motion Web - Онлайн Курс Моушн Веб",
    description: "Панель ментора Motion Web Academy. Управление курсами Python, Django, JavaScript, React. Онлайн курс Моушн Веб - обучение программированию.",
    keywords: ["ментор motion web", "преподаватель программирование", "курсы python", "менторство it", "онлайн курс моушн веб"],
};

export default function Page() {
    return <MentorClient />;
}
