"use client";

import React, { useState, useEffect, useRef } from "react";
import style from "./Upload.module.scss";
import Image from "next/image";
import videoIcon from "@/assets/Icons/videoIcon.png";
import { useCreateVideoMutation, useUpdateVideoMutation, useGetMentorVideoDetailQuery, useGetCourseListQuery, useGetCategoryLessonListQuery } from "@/redux/api/mentor";

interface UploadProps {
    editingId?: number;
    onCancel?: () => void;
}

interface ApiError {
    status: number;
    data: {
        [key: string]: string[] | string | undefined;
        detail?: string | string[];
        message?: string | string[];
    };
}

interface FieldErrors {
    course?: string;
    them_lesson?: string;
    description?: string;
    video?: string;
    videoUrl?: string;
}

interface ToastMessage {
    type: 'success' | 'error';
    message: string;
}

function Upload({ editingId, onCancel }: UploadProps) {
    const uploadRef = useRef<HTMLElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<{
        course: number | null;
        them_lesson: string;
        description: string;
        videoFile: File | null;
        videoPreview: string | null;
        videoUrl: string;
    }>({
        course: null,
        them_lesson: "",
        description: "",
        videoFile: null,
        videoPreview: null,
        videoUrl: "",
    });

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [toast, setToast] = useState<ToastMessage | null>(null);

    const { data: courses = [], isLoading: coursesLoading } = useGetCourseListQuery();
    const { data: categories = [], isLoading: categoriesLoading } = useGetCategoryLessonListQuery();

    const [createVideo, { isLoading: isCreating }] = useCreateVideoMutation();
    const [updateVideo, { isLoading: isUpdating }] = useUpdateVideoMutation();
    const { data: editingVideo } = useGetMentorVideoDetailQuery(editingId!, {
        skip: !editingId,
    });

    useEffect(() => {
        if (editingId && uploadRef.current) {
            uploadRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [editingId]);

    const loadedVideoIdRef = useRef<number | null>(null);
    
    const resetForm = () => {
        setFormData({
            course: null,
            them_lesson: "",
            description: "",
            videoFile: null,
            videoPreview: null,
            videoUrl: "",
        });
        setFieldErrors({});
        loadedVideoIdRef.current = null;
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    useEffect(() => {
        if (editingVideo && editingId && loadedVideoIdRef.current !== editingId) {
            loadedVideoIdRef.current = editingId;
            
            const timeoutId = setTimeout(() => {
                setFormData({
                    course: typeof editingVideo.course === 'number' ? editingVideo.course : null,
                    them_lesson: editingVideo.them_lesson || "",
                    description: editingVideo.description || "",
                    videoFile: null,
                    videoPreview: editingVideo.video,
                    videoUrl: editingVideo.video || "",
                });
                setFieldErrors({});
                
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }, 0);
            
            return () => clearTimeout(timeoutId);
        } else if (!editingId) {
            const timeoutId = setTimeout(() => {
                resetForm();
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [editingVideo, editingId]);

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

    const getErrorMessage = (field: string, errorData: string[] | string): string => {
        const errorArray = Array.isArray(errorData) ? errorData : [errorData];
        const errorMessage = errorArray[0];

        if (errorMessage.includes('does not exist') || errorMessage.includes('matching query does not exist')) {
            switch (field) {
                case 'course':
                    return 'Курс с таким ID не найден';
                case 'them_lesson':
                    return 'Название видео обязательно';
                default:
                    return 'Объект не найден';
            }
        }
        if (errorMessage.includes('required') || errorMessage.includes('This field is required')) {
            return 'Обязательное поле';
        }
        if (errorMessage.includes('invalid')) {
            return 'Неверный формат данных';
        }
        return errorMessage;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        
        if (!formData.videoFile && !formData.videoUrl && !editingId) {
            setFieldErrors({ video: 'Выберите видео файл или вставьте YouTube ссылку' });
            return;
        }

        if (!formData.course) {
            setFieldErrors({ course: 'Пожалуйста, выберите курс' });
            return;
        }

        if (!formData.them_lesson.trim()) {
            setFieldErrors({ them_lesson: 'Пожалуйста, введите название видео' });
            return;
        }

        try {
            if (editingId) {
                const updateData: {
                    id: number;
                    course: number;
                    them_lesson: string;
                    description?: string;
                    video?: File | string;
                } = {
                    id: editingId,
                    course: formData.course,
                    them_lesson: formData.them_lesson,
                    description: formData.description || undefined,
                };
                
                if (formData.videoFile) {
                    updateData.video = formData.videoFile;
                } else if (formData.videoUrl) {
                    updateData.video = formData.videoUrl;
                }
                
                await updateVideo(updateData).unwrap();
                showToast('success', 'Видео успешно обновлено!');
                resetForm();
                onCancel?.();
            } else {
                await createVideo({
                    course: formData.course,
                    them_lesson: formData.them_lesson,
                    video: formData.videoFile || formData.videoUrl!,
                    description: formData.description || undefined,
                }).unwrap();
                showToast('success', 'Видео успешно загружено!');
                resetForm();
            }
        } catch (error: unknown) {
            const apiError = error as ApiError;
            
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
               
            }
            
            const errors: FieldErrors = {};
            
            if (apiError?.data) {
                Object.keys(apiError.data).forEach((field: string) => {
                    const fieldError = apiError.data[field];
                    if (fieldError && field !== 'detail' && field !== 'message') {
                        errors[field as keyof FieldErrors] = getErrorMessage(field, fieldError);
                    }
                });
            }
            
            if (Object.keys(errors).length > 0) {
                showToast('error', 'Проверьте правильность заполнения полей');
            } else {
                showToast('error', editingId ? 'Ошибка при обновлении видео' : 'Ошибка при загрузке видео');
            }
            
            setFieldErrors(errors);
        }
    };

    const getYouTubeVideoId = (url: string): string | null => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[11].length === 11) ? match[11] : null;
    };

    const getYouTubeThumbnail = (videoId: string): string => {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const video = document.createElement("video");
            video.src = URL.createObjectURL(file);
            video.currentTime = 1;

            video.addEventListener("loadeddata", () => {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

                const thumbnail = canvas.toDataURL("image/jpeg");
                setFormData((prev) => ({
                    ...prev,
                    videoFile: file,
                    videoPreview: thumbnail,
                }));

                URL.revokeObjectURL(video.src);
            });
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setFormData(prev => ({
            ...prev,
            videoUrl: url,
            videoPreview: null
        }));

        if (url) {
            const videoId = getYouTubeVideoId(url);
            if (videoId) {
                const thumbnail = getYouTubeThumbnail(videoId);
                setFormData(prev => ({
                    ...prev,
                    videoPreview: thumbnail
                }));
            }
        }
    };

    return (
        <section className={style.Upload} ref={uploadRef}>
            {toast && (
                <div className={`${style.toast} ${style[toast.type]}`}>
                    <span>{toast.message}</span>
                    <button onClick={() => setToast(null)} className={style.closeToast}>×</button>
                </div>
            )}
            <div className="container">
                <div className={style.content}>
                    <h2 className={style.title}>
                        {editingId ? 'РЕДАКТИРОВАТЬ ВИДЕО' : 'ЗАГРУЗИТЬ ВИДЕО'}
                    </h2>
                    <form onSubmit={handleSubmit} className={style.preview}>
                        <h2 className={style.previewTitle}>
                            ПРЕДПРОСМОТР / ПРЕВЬЮ
                        </h2>
                        <div className={style.previewBlock}>
                            {formData.videoPreview ? (
                                <Image
                                    className={style.image}
                                    width={320}
                                    height={220}
                                    src={formData.videoPreview}
                                    alt="Video preview"
                                    unoptimized
                                />
                            ) : (
                                <Image
                                    className={style.image}
                                    width={320}
                                    height={220}
                                    src={videoIcon}
                                    alt=""
                                />
                            )}
                            <div className={style.info}>
                                <h2 className={style.lessonName}>
                                    Курс: {formData.course ? courses.find(c => c.id === formData.course)?.course_name : 'Не указан'}
                                </h2>
                                <span className={style.lessonDesc}>
                                    Название видео: {formData.them_lesson || 'Не указано'}
                                </span>
                                <div className={style.infoLastBlock}>
                                    <h2 className={style.lessonData}>
                                        {formData.description || 'Нет описания'}
                                    </h2>
                                </div>
                            </div>
                        </div>
                        <div className={style.UploadBlock}>
                            <div className={style.inputs}>
                                <div className={style.inputBlock}>
                                    <h2 className={style.inputTitle}>
                                        Курс
                                    </h2>
                                    <select
                                        name="course"
                                        value={formData.course || ''}
                                        onChange={(e) => {
                                            const courseId = e.target.value ? parseInt(e.target.value) : null;
                                            setFormData(prev => ({
                                                ...prev,
                                                course: courseId
                                            }));
                                            if (fieldErrors.course) {
                                                setFieldErrors(prev => ({
                                                    ...prev,
                                                    course: undefined
                                                }));
                                            }
                                        }}
                                        className={`${style.input} ${fieldErrors.course ? style.error : ''}`}
                                        required
                                    >
                                        <option value="">Выберите курс</option>
                                        {courses.map((course) => (
                                            <option key={course.id} value={course.id}>
                                                {course.course_name}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldErrors.course && (
                                        <span className={style.errorMessage}>{fieldErrors.course}</span>
                                    )}
                                </div>
                                <div className={style.inputBlock}>
                                    <h2 className={style.inputTitle}>
                                        Название видео
                                    </h2>
                                    <input
                                        name="them_lesson"
                                        value={formData.them_lesson}
                                        onChange={(e) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                them_lesson: e.target.value
                                            }));
                                            if (fieldErrors.them_lesson) {
                                                setFieldErrors(prev => ({
                                                    ...prev,
                                                    them_lesson: undefined
                                                }));
                                            }
                                        }}
                                        placeholder="Введите название видео"
                                        type="text"
                                        className={`${style.input} ${fieldErrors.them_lesson ? style.error : ''}`}
                                        required
                                    />
                                    {fieldErrors.them_lesson && (
                                        <span className={style.errorMessage}>{fieldErrors.them_lesson}</span>
                                    )}
                                </div>
                                <div className={style.inputBlock}>
                                    <h2 className={style.inputTitle}>
                                        YouTube ссылка
                                    </h2>
                                    <input
                                        name="videoUrl"
                                        value={formData.videoUrl}
                                        onChange={(e) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                videoUrl: e.target.value
                                            }));
                                            if (fieldErrors.videoUrl) {
                                                setFieldErrors(prev => ({
                                                    ...prev,
                                                    videoUrl: undefined
                                                }));
                                            }
                                        }}
                                        placeholder="https://youtube.com/watch?v=..."
                                        type="text"
                                        className={`${style.input} ${fieldErrors.videoUrl ? style.error : ''}`}
                                    />
                                    {fieldErrors.videoUrl && (
                                        <span className={style.errorMessage}>{fieldErrors.videoUrl}</span>
                                    )}
                                </div>
                            </div>
                            <div className={style.descInput}>
                                <h2 className={style.inputTitle}>Описание</h2>
                                <input
                                    name="description"
                                    value={formData.description}
                                    onChange={(e) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            description: e.target.value
                                            }));
                                        }}
                                        placeholder="описание урока"
                                    type="text"
                                    className={`${style.input} ${fieldErrors.description ? style.error : ''}`}
                                />
                                {fieldErrors.description && (
                                        <span className={style.errorMessage}>{fieldErrors.description}</span>
                                    )}
                            </div>
                            <div className={style.buttonGroup}>
                                {onCancel && (
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            resetForm();
                                            onCancel?.();
                                        }}
                                        className={style.cancel}
                                    >
                                        ОТМЕНА
                                    </button>
                                )}
                                <button 
                                    type="submit"
                                    className={style.load}
                                    disabled={isCreating || isUpdating}
                                >
                                    {isCreating || isUpdating ? 'ЗАГРУЗКА...' : editingId ? 'ОБНОВИТЬ ВИДЕО' : 'ЗАГРУЗИТЬ ВИДЕО'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}

export default Upload;
