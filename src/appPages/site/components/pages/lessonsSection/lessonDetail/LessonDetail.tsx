"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState, useMemo } from "react";
import style from "./lessonDetail.module.scss";
import { useGetVideosDetailQuery } from "@/redux/api/video";
import { useGetMentorVideoDetailQuery, useGetCategoryLessonListQuery } from "@/redux/api/mentor";
import { useGetCourseVideosQuery, useGetLessonDetailQuery } from "@/redux/api/lessons";
import { useAppSelector } from "@/redux/hooks";

function LessonDetailContent() {
    const router = useRouter();
    const currentUser = useAppSelector((state) => state.user);
    const { id } = useParams();
    const [visibleCount, setVisibleCount] = useState(6);

    const isMentor = currentUser?.status === "mentor";

    const { data: categories = [] } = useGetCategoryLessonListQuery();

    const getCategoryName = (category: { ct_lesson_name?: string } | number | undefined) => {
        if (typeof category === 'object' && category?.ct_lesson_name) {
            return category.ct_lesson_name;
        }
        
        if (typeof category === 'number') {
            const foundCategory = categories.find(cat => cat.id === category);
            if (foundCategory) {
                return foundCategory.ct_lesson_name;
            }
            return `Категория ID: ${category}`;
        }
        
        return 'Не указана';
    };

    const studentVideoQuery = useGetVideosDetailQuery(Number(id), {
        skip: !id || isMentor, 
    });

    const mentorVideoQuery = useGetMentorVideoDetailQuery(Number(id), {
        skip: !id || !isMentor,
    });

    const videoDetail = isMentor ? mentorVideoQuery.data : studentVideoQuery.data;
    const isVideoLoading = isMentor ? mentorVideoQuery.isLoading : studentVideoQuery.isLoading;
    const videoError = isMentor ? mentorVideoQuery.error : studentVideoQuery.error;

    const { 
        data: courseDetail, 
        isLoading: isCourseLoading 
    } = useGetLessonDetailQuery(
        videoDetail?.course || 0,
        {
            skip: !videoDetail?.course,
        }
    );

    const { data: courseVideos = [] } = useGetCourseVideosQuery(
        {
            course_id: currentUser?.course?.toString() || "",
        },
        {
            skip: !currentUser?.course || !videoDetail || isMentor, 
        }
    );

    const videoRef = useRef<HTMLVideoElement | null>(null);

    const hasAccess = isMentor ? 
        !!videoDetail : 
        (videoDetail && videoDetail.course === currentUser?.course);

    

    const allNextLessons = useMemo(() => {
        if (isMentor) return []; 
        
        return courseVideos
            .filter((video) => {
                const categoryId = typeof videoDetail?.category_lesson === 'object' 
                    ? videoDetail.category_lesson?.id 
                    : videoDetail?.category_lesson;
                
                const videoCategoryId = typeof video.category_lesson === 'object' 
                    ? video.category_lesson?.id 
                    : video.category_lesson;
                
                const sameCategory = categoryId && videoCategoryId && categoryId === videoCategoryId;
                const notCurrent = video.id !== Number(id);
                const isNext = videoDetail && 
                    video.lesson_number > videoDetail.lesson_number;
                
                return sameCategory && notCurrent && isNext;
            })
            .sort((a, b) => a.lesson_number - b.lesson_number);
    }, [courseVideos, videoDetail, id, isMentor]);

    const nextLessons = allNextLessons.slice(0, visibleCount);
    
    const hasMore = allNextLessons.length > visibleCount;

    const handleVideoClick = (video: LESSONS.VideoListItem): void => {
        router.push(`/lessons/${video.id}`);
    };

    const handleShowMore = () => {
        setVisibleCount(prev => prev + 6);
    };

    useEffect(() => {
        const disableKeys = (e: KeyboardEvent) => {
            if (
                (e.ctrlKey && ["s", "u"].includes(e.key.toLowerCase())) ||
                (e.ctrlKey &&
                    e.shiftKey &&
                    ["i", "j"].includes(e.key.toLowerCase()))
            ) {
                e.preventDefault();
            }
        };

        document.addEventListener("keydown", disableKeys);
        return () => document.removeEventListener("keydown", disableKeys);
    }, []);

    if (isVideoLoading || isCourseLoading) {
        return (
            <div className={style.empty}>
                <p>Загрузка...</p>
            </div>
        );
    }

    if (videoError) {
        return (
                <div className={style.empty}>
                    <h1>Ошибка загрузки</h1>
                    <p>Не удалось загрузить видео. Попробуйте позже.</p>
                    <button 
                        className={style.backButton}
                        onClick={() => router.push("/lessons")}
                    >
                        Вернуться к урокам
                    </button>
                </div>
            );
    }

    if (!videoDetail) {
        return (
                <div className={style.empty}>
                    <h1>Видео не найдено</h1>
                    <p>Запрашиваемое видео не существует 😕</p>
                    <button 
                        className={style.backButton}
                        onClick={() => router.push("/lessons")}
                    >
                        Вернуться к урокам
                    </button>
                </div>
        );
    }

    // Если нет доступа
    if (!hasAccess) {
        return (
                <div className={style.empty}>
                    <h1>Доступ запрещен</h1>
                    <p>
                        У вас нет доступа к этому видео. 
                        <br />
                        Видео курса ID: {videoDetail.course}
                        <br />
                        Ваш курс ID: {currentUser?.course || 'не назначен'}
                    </p>
                    <button 
                        className={style.backButton}
                        onClick={() => router.push("/lessons")}
                    >
                        Вернуться к моим урокам
                    </button>
                </div>
        );
    }

    return (
        <section className={style.LessonDetail}>
            <div className="container">
                <div className={style.content}>
                    <div className={style.detailContent}>
                        {videoDetail.video && (
                            <video
                                ref={videoRef}
                                className={style.lessonVideo}
                                src={videoDetail.video}
                                controls
                                autoPlay={false}
                                loop={false}
                                controlsList="nodownload noplaybackrate"
                                disablePictureInPicture
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                                playsInline
                            >
                                Ваш браузер не поддерживает видео тег.
                            </video>
                        )}

                        <div className={style.lessonInfo}>
                            <h2 className={style.title}>
                                {getCategoryName(videoDetail.category_lesson)}
                            </h2>
                            <div className={style.hr}></div>

                            {courseDetail && (
                                <>
                                    <div className={style.themeBlock}>
                                        <h2 className={style.themeTitle}>Курс:</h2>
                                        <h2 className={style.theme}>
                                            {courseDetail.course_name}
                                        </h2>
                                    </div>

                                 
                                </>
                            )}

                            <div className={style.numberBlock}>
                                <h2 className={style.numberTitle}>
                                    Урок по счету:
                                </h2>
                                <h2 className={style.number}>
                                    {videoDetail.lesson_number}
                                </h2>
                            </div>

                            <div className={style.hr}></div>

                            <div className={style.descBlock}>
                                <h2 className={style.desctitle}>ОПИСАНИЕ</h2>
                                <p className={style.desc}>
                                    {videoDetail.description || 'Описание отсутствует'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {allNextLessons.length > 0 && (
                        <div className={style.table}>
                            <h2 className={style.title}>
                                СЛЕДУЮЩИЕ УРОКИ ПО ТЕМЕ: {getCategoryName(videoDetail.category_lesson)}
                            </h2>
                            <div className={style.cards}>
                                {nextLessons.map((video) => (
                                    <div
                                        key={video.id}
                                        className={style.card}
                                        onClick={() => handleVideoClick(video)}
                                    >
                                        <h3 className={style.cardTitle}>
                                            {getCategoryName(video.category_lesson)}
                                        </h3>
                                        <p className={style.cardNumber}>
                                            Номер урока: {video.lesson_number}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {hasMore && (
                                <div className={style.showMoreContainer}>
                                    <button 
                                        className={style.showMoreButton}
                                        onClick={handleShowMore}
                                    >
                                        Показать больше ({allNextLessons.length - visibleCount} осталось)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function LessonDetail() {
    const { id } = useParams();
    
    return <LessonDetailContent key={id as string} />;
}

export default LessonDetail;