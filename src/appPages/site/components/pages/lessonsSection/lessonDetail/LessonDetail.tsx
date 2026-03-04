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

    // Определяем роль пользователя
    const isMentor = currentUser?.status === "mentor";

    // Получаем список категорий для менторов
    const { data: categories = [] } = useGetCategoryLessonListQuery();

    // Вспомогательная функция для безопасного получения названия категории
    const getCategoryName = (category: { ct_lesson_name?: string } | number | undefined) => {
        if (typeof category === 'object' && category?.ct_lesson_name) {
            return category.ct_lesson_name;
        }
        
        // Если category это число, найдем название по ID из списка категорий
        if (typeof category === 'number') {
            const foundCategory = categories.find(cat => cat.id === category);
            if (foundCategory) {
                return foundCategory.ct_lesson_name;
            }
            return `Категория ID: ${category}`;
        }
        
        return 'Не указана';
    };

    // Получаем детали текущего видео
    const studentVideoQuery = useGetVideosDetailQuery(Number(id), {
        skip: !id || isMentor, // Пропускаем если ментор
    });

    const mentorVideoQuery = useGetMentorVideoDetailQuery(Number(id), {
        skip: !id || !isMentor, // Пропускаем если не ментор
    });

    // Выбираем нужные данные в зависимости от роли
    const videoDetail = isMentor ? mentorVideoQuery.data : studentVideoQuery.data;
    const isVideoLoading = isMentor ? mentorVideoQuery.isLoading : studentVideoQuery.isLoading;
    const videoError = isMentor ? mentorVideoQuery.error : studentVideoQuery.error;

    // Получаем детали курса, к которому принадлежит видео
    const { 
        data: courseDetail, 
        isLoading: isCourseLoading 
    } = useGetLessonDetailQuery(
        videoDetail?.course || 0,
        {
            skip: !videoDetail?.course,
        }
    );

    // Получаем список других видео того же курса для "Следующие уроки"
    const { data: courseVideos = [] } = useGetCourseVideosQuery(
        {
            course_id: currentUser?.course?.toString() || "",
        },
        {
            skip: !currentUser?.course || !videoDetail || isMentor, // Для менторов не показываем следующие уроки
        }
    );

    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Проверка доступа - для менторов доступ ко всем своим видео, для студентов только к видео своего курса
    const hasAccess = isMentor ? 
        !!videoDetail : // Ментор имеет доступ к своим видео
        (videoDetail && videoDetail.course === currentUser?.course); // Студент только к видео своего курса

    console.log("🔍 [LESSON_DETAIL] User role:", isMentor ? "mentor" : "student");
    console.log("🔍 [LESSON_DETAIL] User course ID:", currentUser?.course);
    console.log("🔍 [LESSON_DETAIL] Video course ID:", videoDetail?.course);
    console.log("🔍 [LESSON_DETAIL] Video ID:", id);
    console.log("🔍 [LESSON_DETAIL] Has access:", hasAccess);

    // Фильтруем видео с использованием useMemo для оптимизации
    const allNextLessons = useMemo(() => {
        if (isMentor) return []; // Для менторов не показываем следующие уроки
        
        return courseVideos
            .filter((video) => {
                // Безопасно получаем ID категории
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

    // Видимые уроки
    const nextLessons = allNextLessons.slice(0, visibleCount);
    
    // Есть ли еще уроки для показа
    const hasMore = allNextLessons.length > visibleCount;

    console.log("🔍 [NEXT_LESSONS] Current category:", videoDetail?.category_lesson);
    console.log("🔍 [NEXT_LESSONS] Current lesson number:", videoDetail?.lesson_number);
    console.log("🔍 [NEXT_LESSONS] All next lessons:", allNextLessons.length);
    console.log("🔍 [NEXT_LESSONS] Visible lessons:", nextLessons.length);

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

    // Обработка состояния загрузки
    if (isVideoLoading || isCourseLoading) {
        return (
            <div className={style.empty}>
                <p>Загрузка...</p>
            </div>
        );
    }

    // Обработка ошибки
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

    // Если видео не найдено
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

// Обертка с ключом для сброса состояния при изменении ID
function LessonDetail() {
    const { id } = useParams();
    
    // Используем id как ключ - это заставит React пересоздать компонент при изменении id
    return <LessonDetailContent key={id as string} />;
}

export default LessonDetail;