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
                            <h1 className={style.title1}>MOTION WEB</h1>
                            <h1 className={style.title2}>ACADEMY</h1>
                        </div>
                        <span className={style.titleInfo}>
                            Изучай современную веб-разработку с нуля до
                            профессионала. Структурированная программа обучения
                            с реальными проектами.
                        </span>
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
