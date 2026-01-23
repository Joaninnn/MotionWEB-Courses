"use client";

import React, { useState } from "react";
import style from "./lessonsTable.module.scss";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGetLessonsQuery } from "@/redux/api/lessons";
import { useGetCourseVideosQuery } from "@/redux/api/video";
import { useAppSelector } from "@/redux/hooks";

function LessonsTable() {
    const [search, setSearch] = useState("");
    const [date, setDate] = useState("");
    const router = useRouter();
    const currentUser = useAppSelector((state) => state.user);

    const { data: courses = [] } = useGetLessonsQuery();
    
    // Получаем видео курса пользователя
    const { data: videos = [], isLoading: videosLoading } = useGetCourseVideosQuery(
        {
            course_id: currentUser?.course?.toString() || "1",
        },
        {
            skip: !currentUser?.course,
        }
    );

    // Определяем, что показывать: видео или курсы
    const showVideos = currentUser?.status === "mentor";

    const filteredCourses: LESSONS.GetLessonsResponse = courses.filter((item) => {
        const matchesName = item.course_name
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesDate = date ? item.created_at === date : true;

        return matchesName && matchesDate;
    });

    const filteredVideos: VIDEO.GetVideoListResponse = videos.filter((video) => {
        const matchesName = video.category_lesson.ct_lesson_name
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesLesson = search
            ? video.lesson_number.toString() === search
            : true;

        return matchesName && matchesLesson;
    });

    const handleCourseClick = (item: LESSONS.LessonItem): void => {
        router.push(`/lessons/${item.id}`);
    };

    const handleVideoClick = (video: VIDEO.VideoListItem): void => {
        router.push(`/mentor/video/${video.id}`);
    };

    return (
        <section className={style.LessonsTable}>
            <div className="container">
                <div className={style.content}>
                    <div className={style.title}>
                        <h2 className={style.cardsTitle}>
                            {showVideos ? "ВИДЕОУРОКИ" : "БИБЛИОТЕКА УРОКОВ"}
                        </h2>
                        <div className={style.filters}>
                            <input
                                type="text"
                                placeholder={showVideos ? "Поиск по категории..." : "Поиск по названию..."}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={style.input}
                            />

                            {showVideos ? (
                                <input
                                    type="text"
                                    placeholder="Номер урока..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className={style.input}
                                />
                            ) : (
                                <input
                                    type="date"
                                    placeholder="none"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className={style.input}
                                />
                            )}
                        </div>{" "}
                    </div>
                    <div className={style.cards}>
                        {showVideos ? (
                            filteredVideos.length > 0 ? (
                                filteredVideos.map((video) => (
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
                                <p className={style.empty}>
                                    {videosLoading
                                        ? "Загрузка..."
                                        : "Ничего не найдено 😕"}
                                </p>
                            )
                        ) : (
                            filteredCourses.length > 0 ? (
                                filteredCourses.map((item) => (
                                    <div
                                        key={item.id}
                                        className={style.card}
                                        onClick={() => handleCourseClick(item)}
                                    >
                                        <Image
                                            width={300}
                                            height={200}
                                            src={item.course_image}
                                            alt={item.course_name}
                                            className={style.image}
                                        />

                                        <div className={style.cardInfo}>
                                            <h3>{item.course_name}</h3>
                                            <p>{item.description}</p>
                                            <span className={style.date}>
                                                {item.created_at}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className={style.empty}>Ничего не найдено 😕</p>
                            )
                        )}
                    </div>{" "}
                </div>
            </div>
        </section>
    );
}

export default LessonsTable;
