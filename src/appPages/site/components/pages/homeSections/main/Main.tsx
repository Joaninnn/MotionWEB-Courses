"use client";

import React from "react";
import style from "./Main.module.scss";
import { useRouter } from "next/navigation";

export default function Main() {
    const router = useRouter();

    const handleBookClick = (): void => {
        router.push(`/lessons/`);
    };
    return (
        <section className={style.Main}>
            <div className="container">
                <div className={style.content}>
                    <div className={style.hero}>
                        <div className={style.titleBlock}>
                            <h1 className={style.title1}>
                                MOTION WEB <span className={style.visuallyHidden}>| Online Course Motion Web | Онлайн Курс Моушн Веб</span>
                            </h1>
                            <h2 className={style.title2}>ACADEMY</h2>
                        </div>
                        <p className={style.titleInfo}>
                            Online course Motion Web - изучай современную веб-разработку
                            с нуля до профессионала. Онлайн курс Моушн Веб - структурированная
                            программа обучения Python, Django, JavaScript, React с реальными
                            проектами и менторами в Кыргызстане.
                        </p>
                        <button
                            onClick={handleBookClick}
                            className={style.heroButton}
                        >
                            СМОТРЕТЬ УРОКИ
                        </button>
                    </div>
                   
                </div>
            </div>
        </section>
    );
}
