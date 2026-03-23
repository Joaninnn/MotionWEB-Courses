"use client";

import React, { useState } from "react";
import style from "./lessonsTable.module.scss";
import { useRouter } from "next/navigation";
import { useGetCourseVideosQuery, useGetLessonDetailQuery } from "@/redux/api/lessons";
import { useGetMentorVideosQuery, useGetCourseListQuery } from "@/redux/api/mentor";
import { useAppSelector } from "@/redux/hooks";

interface MentorVideoResponse {
    id?: number;
    teaching_courses?: Array<{
        video_course?: MENTOR.VideoResponse[];
    }>;
}

function LessonsTable() {
    const [search, setSearch] = useState("");
    const [visibleCount, setVisibleCount] = useState(9); 
    const router = useRouter();
    
    const currentUser = useAppSelector((state) => state.user);
    
    const isMentor = currentUser?.status === "mentor";

    const { data: courses = [] } = useGetCourseListQuery();
    
    const { data: studentVideos = [], isLoading: isStudentLoading } = useGetCourseVideosQuery(
        {
            course_id: currentUser?.course?.toString() || "",
        },
        {
            skip: !currentUser?.course || isMentor,
        }
    );

    const mentorVideosQuery = useGetMentorVideosQuery(
        undefined,
        {
            skip: !isMentor, 
        }
    );
    
    const mentorVideosData = mentorVideosQuery.data || [];
    const isLoading = isMentor ? mentorVideosQuery.isLoading : isStudentLoading;
    const error = isMentor ? mentorVideosQuery.error : null;

    const { data: courseDetail } = useGetLessonDetailQuery(
        currentUser?.course || 0,
        {
            skip: !currentUser?.course || isMentor, 
        }
    );

    const extractedMentorVideos = mentorVideosData.reduce((acc: MENTOR.VideoResponse[], mentorVideo: MentorVideoResponse) => {
        if (mentorVideo?.teaching_courses) {
            mentorVideo.teaching_courses.forEach((course: { video_course?: MENTOR.VideoResponse[] }) => {
                if (course?.video_course && Array.isArray(course.video_course)) {
                    acc.push(...course.video_course);
                }
            });
        }
        return acc;
    }, []);

    const allVideos = isMentor ? extractedMentorVideos : studentVideos;
    
    const filteredVideos = allVideos.filter((video) => {
        if (isMentor) {
            const searchLower = search.toLowerCase();
            const courseName = (video as MENTOR.VideoResponse).course ? courses.find(c => c.id === (video as MENTOR.VideoResponse).course)?.course_name || `ID: ${(video as MENTOR.VideoResponse).course}` : 'Не указан';
                
            const matchesSearch = 
                (courseName?.toString().toLowerCase() || "").includes(searchLower) ||
                ((video as MENTOR.VideoResponse).them_lesson?.toString().toLowerCase() || "").includes(searchLower) ||
                ((video as MENTOR.VideoResponse).description?.toString().toLowerCase() || "").includes(searchLower);
            
            return matchesSearch;
        } else {
            return (video as LESSONS.VideoListItem).them_lesson.toLowerCase().includes(search.toLowerCase());
        }
    });

    const visibleVideos = filteredVideos.slice(0, visibleCount);
    
    const hasMore = filteredVideos.length > visibleCount;

    const handleVideoClick = (video: MENTOR.VideoResponse | LESSONS.VideoListItem): void => {
        router.push(`/lessons/${video.id}`);
    };

    const handleShowMore = () => {
        setVisibleCount(prev => prev + 9); 
    };

    React.useEffect(() => {
        setVisibleCount(9);
    }, [search]);

    return (
        <section className={style.LessonsTable}>
            <div className="container">
                <div className={style.content}>
                    <div className={style.title}>
                        <div className={style.titleContent}>
                            <h2 className={style.cardsTitle}>
                                {isMentor ? "МОИ ВИДЕО" : "БИБЛИОТЕКА УРОКОВ"}
                            </h2>
                            {courseDetail && !isMentor && (
                                <h2 className={style.cardsTitleCourse}>
                                    {courseDetail.course_name}
                                </h2>
                            )}
                        </div>
                        <div className={style.filters}>
                            <input
                                type="text"
                                placeholder="Поиск по названию видео..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={style.input}
                            />
                        </div>
                    </div>
                    <div className={style.cards}>
                        {!currentUser ? (
                            <p className={style.empty}>Вы не авторизованы</p>
                        ) : isMentor && !currentUser?.username ? (
                            <p className={style.empty}>Загрузка данных...</p>
                        ) : !isMentor && !currentUser?.course ? (
                            <p className={style.empty}>У вас нет назначенного курса</p>
                        ) : isLoading ? (
                            <p className={style.empty}>Загрузка...</p>
                        ) : error ? (
                            <p className={style.empty}>Ошибка загрузки видео</p>
                        ) : visibleVideos.length > 0 ? (
                            visibleVideos.map((video) => {
                                if (isMentor) {
                                    const courseName = (video as MENTOR.VideoResponse).course ? courses.find(c => c.id === (video as MENTOR.VideoResponse).course)?.course_name || `ID: ${(video as MENTOR.VideoResponse).course}` : 'Не указан';
                                    const createdAt = (video as MENTOR.VideoResponse).created_at ? new Date((video as MENTOR.VideoResponse).created_at as string).toLocaleDateString('ru-RU') : 'Не указана';

                                    return (
                                        <div
                                            key={video.id || `video-${(video as MENTOR.VideoResponse).them_lesson}-${(video as MENTOR.VideoResponse).course}`}
                                            className={style.card}
                                            onClick={() => handleVideoClick(video)}
                                        >
                                            <div className={style.videoCard}>
                                                <div className={style.videoHeader}>
                                                    <h3>{(video as MENTOR.VideoResponse).them_lesson || 'Не указано'}</h3>
                                                </div>
                                                <div className={style.videoInfo}>
                                                    <p>Курс: {courseName}</p>
                                                    <p>Дата: {createdAt}</p>
                                                    {(video as MENTOR.VideoResponse).description && (
                                                        <p>Описание: {(video as MENTOR.VideoResponse).description}</p>
                                                    )}
                                                </div>
                                               
                                            </div>
                                        </div>
                                    );
                                } else {
                                    const createdAt = (video as LESSONS.VideoListItem).created_at ? new Date((video as LESSONS.VideoListItem).created_at as string).toLocaleDateString('ru-RU') : 'Не указана';
                                    
                                    return (
                                        <div
                                            key={video.id}
                                            className={style.card}
                                            onClick={() => handleVideoClick(video)}
                                        >
                                            <div className={style.videoCard}>
                                                <div className={style.videoHeader}>
                                                    <h3>{video.them_lesson}</h3>
                                                </div>
                                                <div className={style.videoInfo}>
                                                    <p>Дата: {createdAt}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            })
                        ) : (
                            <p className={style.empty}>
                                {search ? 'Ничего не найдено 😕' : (isMentor ? 'Нет загруженных видео' : 'Нет доступных уроков')}
                            </p>
                        )}
                    </div>

                    {hasMore && (
                        <div className={style.showMoreContainer}>
                            <button 
                                className={style.showMoreButton}
                                onClick={handleShowMore}
                            >
                                Показать больше ({filteredVideos.length - visibleCount} осталось)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default LessonsTable;