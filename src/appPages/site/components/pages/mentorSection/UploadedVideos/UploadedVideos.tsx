"use client";

import React, { useState, useEffect } from "react";
import style from "./UploadedVideos.module.scss";
import defaultIcon from "@/assets/Icons/videoIcon.png";
import Image from "next/image";
import { 
    useGetMentorVideosQuery,
    useDeleteVideoMutation,
    useGetCourseListQuery 
} from "@/redux/api/mentor";
import { useAppSelector } from "@/redux/hooks";

interface UploadedVideosProps {
    editingId?: number | null;
    setEditingId?: (id: number | null) => void;
}

interface CategoryLesson {
    id: number;
    ct_lesson_name: string;
}

interface VideoResponse {
    id: number;
    course: number;
    category_lesson: CategoryLesson | number;
    video: string;
    lesson_number: number;
    description?: string;
}

interface MentorVideoResponse {
    id?: number;
    teaching_courses?: Array<{
        video_course?: VideoResponse[];
    }>;
}

interface ToastMessage {
    type: 'success' | 'error';
    message: string;
}

interface DeleteModal {
    isOpen: boolean;
    videoId: number | null;
    videoTitle: string;
    videoInfo: VideoResponse | null;
}

function UploadedVideos({ setEditingId: externalSetEditingId }: UploadedVideosProps) {
    const currentUser = useAppSelector((state) => state.user);
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [deleteModal, setDeleteModal] = useState<DeleteModal>({
        isOpen: false,
        videoId: null,
        videoTitle: "",
        videoInfo: null
    });

    const { data: courses = [] } = useGetCourseListQuery();

    const mentorVideosQuery = useGetMentorVideosQuery(
        undefined,
        {
            skip: !currentUser,
        }
    );
    
    const videos = (mentorVideosQuery.data as MentorVideoResponse[]) || [];
    const { isLoading, error } = mentorVideosQuery;

    const [deleteVideo, { isLoading: isDeleting }] = useDeleteVideoMutation();

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
    };

    const extractedVideos = videos.reduce((acc: VideoResponse[], mentorVideo: MentorVideoResponse) => {
        if (mentorVideo?.teaching_courses) {
            mentorVideo.teaching_courses.forEach((course: { video_course?: VideoResponse[] }) => {
                if (course?.video_course && Array.isArray(course.video_course)) {
                    acc.push(...course.video_course);
                }
            });
        }
        return acc;
    }, []);

  

    const handleEdit = (id: number) => {
        externalSetEditingId?.(id);
        
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const handleDelete = async (id: number, videoTitle: string) => {
        setDeleteModal({
            isOpen: true,
            videoId: id,
            videoTitle: videoTitle,
            videoInfo: null
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.videoId) return;
        
        try {
            await deleteVideo(deleteModal.videoId).unwrap();
            showToast('success', 'Видео успешно удалено!');
            setDeleteModal({ isOpen: false, videoId: null, videoTitle: "", videoInfo: null });
        } catch (error: unknown) {
            
            const errorObj = error as { status?: number };
            if (errorObj?.status === 403) {
                showToast('error', 'У вас нет прав на удаление этого видео');
            } else {
                showToast('error', 'Ошибка при удалении видео');
            }
            setDeleteModal({ isOpen: false, videoId: null, videoTitle: "", videoInfo: null });
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ isOpen: false, videoId: null, videoTitle: "", videoInfo: null });
    };

    const filteredData = (Array.isArray(extractedVideos) ? extractedVideos : []).filter((item) => {
        if (!item || typeof item !== 'object') return false;
        
        const searchLower = search.toLowerCase();
        const categoryName = typeof item.category_lesson === 'object' 
            ? item.category_lesson?.ct_lesson_name 
            : item.category_lesson;
        
        const courseName = item.course ? courses.find(c => c.id === item.course)?.course_name || `ID: ${item.course}` : 'Не указан';
            
        const matchesSearch = 
            (courseName?.toString().toLowerCase() || "").includes(searchLower) ||
            (categoryName?.toString().toLowerCase() || "").includes(searchLower) ||
            (item.lesson_number?.toString().toLowerCase() || "").includes(searchLower) ||
            (item.description?.toString().toLowerCase() || "").includes(searchLower);

        return matchesSearch;
    });


    return (
        <section className={style.UploadedVideos}>
            {toast && (
                <div className={`${style.toast} ${style[toast.type]}`}>
                    <span>{toast.message}</span>
                    <button onClick={() => setToast(null)} className={style.closeToast}>×</button>
                </div>
            )}
            
            {deleteModal.isOpen && (
                <div className={style.modalOverlay}>
                    <div className={style.deleteModal}>
                        <div className={style.modalContent}>
                            <h3 className={style.modalTitle}>Подтверждение удаления</h3>
                            <p className={style.modalMessage}>
                                Вы уверены, что хотите удалить видео?
                            </p>
                            <div className={style.modalVideoInfo}>
                                <span>{deleteModal.videoTitle}</span>
                            </div>
                            <div className={style.modalButtons}>
                                <button 
                                    className={style.modalCancel}
                                    onClick={cancelDelete}
                                    disabled={isDeleting}
                                >
                                    Отмена
                                </button>
                                <button 
                                    className={style.modalDelete}
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Удаление...' : 'Удалить'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="container">
                <div className={style.content}>
                    <h2 className={style.title}>
                        Загруженные видео ({extractedVideos.length})
                    </h2>
                    <div className={style.filterBlock}>
                        <input
                            placeholder="поиск по курсу, категории или номеру урока"
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={style.Name}
                        />
                    </div>

                    <div className={style.videoBlock}>
                        {!currentUser ? (
                            <p className={style.empty}>Вы не авторизованы</p>
                        ) : isLoading ? (
                            <div className={style.loader}>
                                <div className={style.spinner}></div>
                                <p>Загрузка...</p>
                            </div>
                        ) : error ? (
                            <p className={style.empty}>Ошибка загрузки видео</p>
                        ) : filteredData.length > 0 ? (
                            filteredData.map((item, index) => {
                                const categoryName = typeof item.category_lesson === 'object'
                                    ? item.category_lesson?.ct_lesson_name
                                    : item.category_lesson;
                                
                                const courseName = item.course ? courses.find(c => c.id === item.course)?.course_name || `ID: ${item.course}` : 'Не указан';

                                return (
                                    <div key={item.id || `video-${index}`} className={style.card}>
                                        <div className={style.content}>
                                            <div className={style.imageWrapper}>
                                                <Image
                                                    className={style.videoIcon}
                                                    src={defaultIcon}
                                                    alt="videoIcon"
                                                    fill
                                                    unoptimized
                                                />
                                            </div>
                                            <div className={style.cardInfo}>
                                                <h2 className={style.lessonName}>
                                                    Курс: {courseName}
                                                </h2>
                                                <span className={style.lessonDesc}>
                                                    Категория: {categoryName || 'Не указана'}
                                                </span>
                                                <div className={style.infoLastBlock}>
                                                    <h2 className={style.lessonTheme}>
                                                        Урок №{item.lesson_number || 'Не указан'}
                                                    </h2>
                                                  
                                                </div>
                                            </div>
                                        </div>
                                        <div className={style.buttons}>
                                            <button 
                                                className={style.edit}
                                                onClick={() => item.id && handleEdit(item.id)}
                                                disabled={isDeleting}
                                            >
                                                Редактировать
                                            </button>
                                            <button 
                                                className={style.delete}
                                                onClick={() => item.id && handleDelete(item.id, `Курс: ${courseName}, Урок №${item.lesson_number}`)}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? 'Удаление...' : 'Удалить'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className={style.empty}>
                                {search ? 'Ничего не найдено по вашему запросу' : 'Нет загруженных видео. Загрузите первое видео!'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default UploadedVideos;