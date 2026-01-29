"use client";

import React, { useState } from "react";
import style from "./Upload.module.scss";
import Image from "next/image";
import videoIcon from "@/assets/Icons/videoIcon.png";
import { useCreateVideoMutation, useUpdateVideoMutation, useGetMentorVideoDetailQuery } from "@/redux/api/mentor";

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

function Upload({ editingId, onCancel }: UploadProps) {
    const [formData, setFormData] = useState<{
        course: string;
        category_lesson: string;
        lesson_number: string;
        description: string;
        videoFile: File | null;
        videoPreview: string | null;
    }>({
        course: "",
        category_lesson: "",
        lesson_number: "",
        description: "",
        videoFile: null,
        videoPreview: null,
    });

    const [createVideo, { isLoading: isCreating }] = useCreateVideoMutation();
    const [updateVideo, { isLoading: isUpdating }] = useUpdateVideoMutation();
    const { data: editingVideo } = useGetMentorVideoDetailQuery(editingId!, {
        skip: !editingId,
    });

    React.useEffect(() => {
        if (editingVideo) {
            setFormData({
                course: editingVideo.course.toString(),
                category_lesson: editingVideo.category_lesson.toString(),
                lesson_number: editingVideo.lesson_number.toString(),
                description: editingVideo.description || "",
                videoFile: null,
                videoPreview: editingVideo.video,
            });
        }
    }, [editingVideo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.videoFile && !editingId) {
            alert("Пожалуйста, выберите видео для загрузки");
            return;
        }

        try {
            console.log("🔍 [UPLOAD] Submitting form:", {
                editingId,
                formData: {
                    course: formData.course,
                    category_lesson: formData.category_lesson,
                    lesson_number: formData.lesson_number,
                    description: formData.description,
                    hasVideoFile: !!formData.videoFile,
                    fileName: formData.videoFile?.name,
                    fileSize: formData.videoFile?.size
                }
            });

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
                    course: parseInt(formData.course),
                    category_lesson: parseInt(formData.category_lesson),
                    lesson_number: parseInt(formData.lesson_number) || undefined,
                    description: formData.description || undefined,
                };
                
                // Добавляем видео только если выбрали новое
                if (formData.videoFile) {
                    updateData.video = formData.videoFile;
                }
                
                await updateVideo(updateData).unwrap();
                alert("Видео успешно обновлено!");
                onCancel?.();
            } else {
                await createVideo({
                    course: parseInt(formData.course),
                    category_lesson: parseInt(formData.category_lesson),
                    video: formData.videoFile!,
                    lesson_number: parseInt(formData.lesson_number) || undefined,
                    description: formData.description || undefined,
                }).unwrap();
                alert("Видео успешно загружено!");
                // Reset form
                setFormData({
                    course: "",
                    category_lesson: "",
                    lesson_number: "",
                    description: "",
                    videoFile: null,
                    videoPreview: null,
                });
            }
        } catch (error: unknown) {
            const apiError = error as ApiError;
            console.error("Error:", apiError);
            console.error("Error details JSON:", JSON.stringify(apiError, null, 2));
            console.error("Error status:", apiError?.status);
            console.error("Error data:", apiError?.data);
            console.error("Form data:", {
                course: formData.course,
                category_lesson: formData.category_lesson,
                lesson_number: formData.lesson_number,
                description: formData.description,
                hasVideoFile: !!formData.videoFile,
                fileName: formData.videoFile?.name,
                fileSize: formData.videoFile?.size
            });
            
            // Показываем конкретную ошибку от сервера если есть
            let errorMessage = editingId ? "Ошибка при обновлении видео" : "Ошибка при загрузке видео";
            
            if (apiError?.data) {
                // Обрабатываем ошибки валидации полей
                const errorFields = Object.keys(apiError.data);
                if (errorFields.length > 0) {
                    const fieldErrors = errorFields.map((field: string) => {
                        const messages = apiError.data[field];
                        return `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
                    });
                    errorMessage = `Ошибка валидации:\n${fieldErrors.join('\n')}`;
                } else if (apiError.data.detail) {
                    errorMessage = Array.isArray(apiError.data.detail) ? apiError.data.detail.join(', ') : apiError.data.detail;
                } else if (apiError.data.message) {
                    errorMessage = Array.isArray(apiError.data.message) ? apiError.data.message.join(', ') : apiError.data.message;
                }
            }
            
            alert(errorMessage);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
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
        <section className={style.Upload}>
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
                                    Курс: {formData.course}
                                </h2>
                                <span className={style.lessonDesc}>
                                    Категория: {formData.category_lesson}
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
                                    <input
                                        name="course"
                                        value={formData.course}
                                        onChange={handleInputChange}
                                        placeholder="ID курса (например: 1, 2, 3...)"
                                        type="number"
                                        className={style.input}
                                        required
                                    />
                                </div>
                                <div className={style.inputBlock}>
                                    <h2 className={style.inputTitle}>
                                        Категория урока
                                    </h2>
                                    <input
                                        name="category_lesson"
                                        value={formData.category_lesson}
                                        onChange={handleInputChange}
                                        placeholder="ID категории урока (например: 1, 2, 3...)"
                                        type="number"
                                        className={style.input}
                                        required
                                    />
                                </div>
                                <div className={style.inputBlock}>
                                    <h2 className={style.inputTitle}>
                                        Номер урока
                                    </h2>
                                    <input
                                        name="lesson_number"
                                        value={formData.lesson_number}
                                        onChange={handleInputChange}
                                        placeholder="Номер урока (необязательно)"
                                        type="number"
                                        className={style.input}
                                    />
                                </div>
                                {!editingId && (
                                    <div className={style.inputBlock}>
                                        <h2 className={style.inputTitle}>Видео</h2>
                                        <input
                                            name="videoFile"
                                            onChange={handleFileChange}
                                            placeholder="видео"
                                            type="file"
                                            accept="video/*"
                                            className={style.input}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                            <div className={style.descInput}>
                                <h2 className={style.inputTitle}>Описание</h2>
                                <input
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="описание урока"
                                    type="text"
                                    className={style.input}
                                />
                            </div>
                            <div className={style.buttonGroup}>
                                {onCancel && (
                                    <button 
                                        type="button" 
                                        onClick={onCancel}
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
