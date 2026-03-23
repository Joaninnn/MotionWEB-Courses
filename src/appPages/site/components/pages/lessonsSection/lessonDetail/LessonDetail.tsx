"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState, useMemo } from "react";
import style from "./lessonDetail.module.scss";
import { useGetVideosDetailQuery } from "@/redux/api/video";
import { useGetMentorVideoDetailQuery } from "@/redux/api/mentor";
import { useGetCourseVideosQuery, useGetLessonDetailQuery } from "@/redux/api/lessons";
import { useAppSelector } from "@/redux/hooks";

type VideoDetailType = MENTOR.VideoResponse | VIDEO.VideoDetailItem;

function LessonDetailContent() {
    const router = useRouter();
    const currentUser = useAppSelector((state) => state.user);
    const { id } = useParams();
    const [visibleCount, setVisibleCount] = useState(6);

    const isMentor = currentUser?.status === "mentor";

    const studentVideoQuery = useGetVideosDetailQuery(Number(id), {
        skip: !id || isMentor, 
    });

    const mentorVideoQuery = useGetMentorVideoDetailQuery(Number(id), {
        skip: !id || !isMentor,
    });

    const videoDetail: VideoDetailType | undefined = isMentor ? mentorVideoQuery.data : studentVideoQuery.data;
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

  

    const hasAccess = !!videoDetail;

    const allNextLessons = useMemo(() => {
        if (isMentor) return []; 
        
        return courseVideos
            .filter((video) => {
                const notCurrent = video.id !== Number(id);
                return notCurrent;
            })
            .sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateA - dateB;
            });
    }, [courseVideos, id, isMentor]);

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
                        Видео курса ID: {(videoDetail as VideoDetailType)?.course || 'неизвестен'}
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

    const getYouTubeEmbedUrl = (url: string) => {
        // Универсальное регулярное выражение для всех YouTube URL
        const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regExp);
        
        if (match && match[1]) {
            return `https://www.youtube.com/embed/${match[1]}`;
        }
        
        return url;
    };

    return (
        <section className={style.LessonDetail}>
            <div className="container">
                <div className={style.content}>
                    <div className={style.detailContent}>
                        <div className={style.videoInfoContainer}>
                            <div className={style.videoColumn}>
                                {videoDetail.video && (
                                    videoDetail.video?.includes('youtube.com') || videoDetail.video?.includes('youtu.be') ? (
                                        <iframe
                                            width="100%"
                                            height="400"
                                            src={getYouTubeEmbedUrl(videoDetail.video)}
                                            title="Video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
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
                                    )
                                )}
                            </div>
                            <div className={style.infoColumn}>
                                <div className={style.lessonInfo}>
                                    <h2 className={style.title}>
                                        {videoDetail.them_lesson}
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
                                            Дата загрузки:
                                        </h2>
                                        <h2 className={style.number}>
                                            {videoDetail.created_at ? new Date(videoDetail.created_at as string).toLocaleDateString('ru-RU') : 'Не указана'}
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
                        </div>
                    </div>

                    {allNextLessons.length > 0 && (
                        <div className={style.table}>
                            <h2 className={style.title}>
                                ДРУГИЕ ВИДЕО КУРСА
                            </h2>
                            <div className={style.cards}>
                                {nextLessons.map((video) => (
                                    <div
                                        key={video.id}
                                        className={style.card}
                                        onClick={() => handleVideoClick(video)}
                                    >
                                        <h3 className={style.cardTitle}>
                                            {video.them_lesson}
                                        </h3>
                                        <p className={style.cardNumber}>
                                            Дата: {video.created_at ? new Date(video.created_at).toLocaleDateString('ru-RU') : 'Не указана'}
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