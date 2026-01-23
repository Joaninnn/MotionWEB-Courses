"use client";

import React, { useState } from "react";
import style from "./lessonsTable.module.scss";
import { useRouter } from "next/navigation";
import { useGetCourseVideosQuery } from "@/redux/api/lessons";
import { useAppSelector } from "@/redux/hooks";

function LessonsTable() {
    const [search, setSearch] = useState("");
    const [lessonNumber, setLessonNumber] = useState("");
    const router = useRouter();
    
    const currentUser = useAppSelector((state) => state.user);

    // Получаем видео курса пользователя
    const { data: videos = [], isLoading } = useGetCourseVideosQuery(
        {
            course_id: currentUser?.course?.toString() || "",
            category_lesson: search || undefined,
            lesson_number: lessonNumber || undefined,
        },
        {
            skip: !currentUser?.course,
        }
    );

    const handleVideoClick = (video: LESSONS.VideoListItem): void => {
        router.push(`/lessons/${video.id}`);
    };

    return (
        <section className={style.LessonsTable}>
            <div className="container">
                <div className={style.content}>
                    <div className={style.title}>
                        <h2 className={style.cardsTitle}>
                            БИБЛИОТЕКА УРОКОВ
                        </h2>
                        <div className={style.filters}>
                            <input
                                type="text"
                                placeholder="Поиск по категории..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={style.input}
                            />
                            <input
                                type="text"
                                placeholder="Номер урока..."
                                value={lessonNumber}
                                onChange={(e) => setLessonNumber(e.target.value)}
                                className={style.input}
                            />
                        </div>
                    </div>
                    <div className={style.cards}>
                        {!currentUser?.course ? (
                            <p className={style.empty}>У вас нет назначенного курса</p>
                        ) : isLoading ? (
                            <p className={style.empty}>Загрузка...</p>
                        ) : videos.length > 0 ? (
                            videos.map((video) => (
                                <div
                                    key={video.id}
                                    className={style.card}
                                    onClick={() => handleVideoClick(video)}
                                >
                                    <div className={style.videoCard}>
                                        <div className={style.videoHeader}>
                                            <h3>Урок #{video.lesson_number}</h3>
                                            <span className={style.category}>
                                                {video.category_lesson.ct_lesson_name}
                                            </span>
                                        </div>
                                        <div className={style.videoInfo}>
                                            <p>ID видео: {video.id}</p>
                                            <p>Курс: {video.course}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={style.empty}>Ничего не найдено 😕</p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default LessonsTable;