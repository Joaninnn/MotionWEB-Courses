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
    category_lesson?: string;
    lesson_number?: string;
    description?: string;
    video?: string;
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
        category_lesson: number | null;
        lesson_number: string;
        description: string;
        videoFile: File | null;
        videoPreview: string | null;
    }>({
        course: null,
        category_lesson: null,
        lesson_number: "",
        description: "",
        videoFile: null,
        videoPreview: null,
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
            category_lesson: null,
            lesson_number: "",
            description: "",
            videoFile: null,
            videoPreview: null,
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
                    category_lesson: typeof editingVideo.category_lesson === 'number' ? editingVideo.category_lesson : null,
                    lesson_number: editingVideo.lesson_number.toString(),
                    description: editingVideo.description || "",
                    videoFile: null,
                    videoPreview: editingVideo.video,
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
                case 'category_lesson':
                    return 'Категория урока с таким ID не найдена';
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
        
        if (!formData.videoFile && !editingId) {
            setFieldErrors({ video: 'Выберите видео для загрузки' });
            return;
        }

        if (!formData.course) {
            setFieldErrors({ course: 'Пожалуйста, выберите курс' });
            return;
        }

        if (!formData.category_lesson) {
            setFieldErrors({ category_lesson: 'Пожалуйста, выберите категорию урока' });
            return;
        }

        try {
            if (editingId) {
                const updateData: {
                    id: number;
                    course: number;
                    category_lesson: number;
                    lesson_number?: number;
                    description?: string;
                    video?: File;
                } = {
                    id: editingId,
                    course: formData.course,
                    category_lesson: formData.category_lesson,
                    lesson_number: parseInt(formData.lesson_number) || undefined,
                    description: formData.description || undefined,
                };
                
                if (formData.videoFile) {
                    updateData.video = formData.videoFile;
                }
                
                await updateVideo(updateData).unwrap();
                showToast('success', 'Видео успешно обновлено!');
                resetForm();
                onCancel?.();
            } else {
                await createVideo({
                    course: formData.course,
                    category_lesson: formData.category_lesson,
                    video: formData.videoFile!,
                    lesson_number: parseInt(formData.lesson_number) || undefined,
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
                                    Категория: {formData.category_lesson ? categories.find(c => c.id === formData.category_lesson)?.ct_lesson_name : 'Не указана'}
                                </span>
                                <div className={style.infoLastBlock}>
                                    <h2 className={style.lessonTheme}>
                                        Урок №{formData.lesson_number || 'Не указан'}
                                    </h2>
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
                                        Категория урока
                                    </h2>
                                    <select
                                        name="category_lesson"
                                        value={formData.category_lesson || ''}
                                        onChange={(e) => {
                                            const categoryId = e.target.value ? parseInt(e.target.value) : null;
                                            setFormData(prev => ({
                                                ...prev,
                                                category_lesson: categoryId
                                            }));
                                            if (fieldErrors.category_lesson) {
                                                setFieldErrors(prev => ({
                                                    ...prev,
                                                    category_lesson: undefined
                                                }));
                                            }
                                        }}
                                        className={`${style.input} ${fieldErrors.category_lesson ? style.error : ''}`}
                                        required
                                    >
                                        <option value="">Выберите категорию</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.ct_lesson_name}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldErrors.category_lesson && (
                                        <span className={style.errorMessage}>{fieldErrors.category_lesson}</span>
                                    )}
                                </div>
                                <div className={style.inputBlock}>
                                    <h2 className={style.inputTitle}>
                                        Номер урока
                                    </h2>
                                    <input
                                        name="lesson_number"
                                        value={formData.lesson_number}
                                        onChange={(e) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                lesson_number: e.target.value
                                            }));
                                        }}
                                        placeholder="Номер урока (необязательно)"
                                        type="number"
                                        className={`${style.input} ${fieldErrors.lesson_number ? style.error : ''}`}
                                    />
                                    {fieldErrors.lesson_number && (
                                        <span className={style.errorMessage}>{fieldErrors.lesson_number}</span>
                                    )}
                                </div>
                                <div className={style.inputBlock}>
                                    <h2 className={style.inputTitle}>
                                        {editingId ? 'Новое видео (необязательно)' : 'Видео'}
                                    </h2>
                                    <input
                                        ref={fileInputRef}
                                        name="videoFile"
                                        onChange={handleFileChange}
                                        placeholder="видео"
                                        type="file"
                                        accept="video/*"
                                        className={`${style.input} ${fieldErrors.video ? style.error : ''}`}
                                        required={!editingId}
                                    />
                                    {fieldErrors.video && (
                                        <span className={style.errorMessage}>{fieldErrors.video}</span>
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
