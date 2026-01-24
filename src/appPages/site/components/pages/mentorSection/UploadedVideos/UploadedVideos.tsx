"use client";

import React, { useState } from "react";
import style from "./UploadedVideos.module.scss";
import defaultIcon from "@/assets/Icons/videoIcon.png";
import Image from "next/image";
import { useGetMentorVideosQuery, useDeleteVideoMutation } from "@/redux/api/mentor";
import Upload from "../Upload/Upload";

function UploadedVideos() {
    const { data: videos = [], isLoading, refetch } = useGetMentorVideosQuery();
    const [deleteVideo] = useDeleteVideoMutation();
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);

    // Отладочный лог для проверки данных
    console.log("🔍 [UPLOADED_VIDEOS] Videos data:", videos);
    console.log("🔍 [UPLOADED_VIDEOS] Is loading:", isLoading);

    const handleEdit = (id: number) => {
        setEditingId(id);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        refetch();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Вы уверены, что хотите удалить это видео?")) {
            try {
                await deleteVideo({ id: id }).unwrap();
                alert("Видео успешно удалено!");
                refetch();
            } catch (error) {
                console.error("Error:", error);
                alert("Ошибка при удалении видео");
            }
        }
    };

    const filteredData = (Array.isArray(videos) ? videos : []).filter((item) => {
        // Дополнительная проверка что item является объектом
        if (!item || typeof item !== 'object') return false;
        
        const matchesSearch = 
            (item.course?.toString() || "").includes(search.toLowerCase()) ||
            (item.category_lesson?.toString() || "").includes(search.toLowerCase()) ||
            (item.description || "").toLowerCase().includes(search.toLowerCase());

        return matchesSearch;
    });

    return (
        <section className={style.UploadedVideos}>
            <div className="container">
                <div className={style.content}>
                    <h2 className={style.title}>
                        Загруженные видео ({filteredData.length})
                    </h2>
                    <div className={style.filterBlock}>
                        <input
                            placeholder="поиск по курсу, категории или описанию"
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={style.Name}
                        />
                    </div>
                    <div className={style.videoBlock}>
                        {isLoading ? (
                            <p className={style.empty}>Загрузка...</p>
                        ) : filteredData.length > 0 ? (
                            filteredData.map((item, index) => (
                                <div key={item.id || `video-${index}`} className={style.card}>
                                    <div className={style.content}>
                                        <div className={style.imageWrapper}>
                                            <Image
                                                className={style.videoIcon}
                                                src={item.video || defaultIcon}
                                                alt="videoIcon"
                                                fill
                                                unoptimized
                                            />
                                        </div>
                                        <div className={style.cardInfo}>
                                            <h2 className={style.lessonName}>
                                                Курс: {item.course || 'Не указан'}
                                            </h2>
                                            <span className={style.lessonDesc}>
                                                Категория: {item.category_lesson || 'Не указана'}
                                            </span>
                                            <div className={style.infoLastBlock}>
                                                <h2 className={style.lessonTheme}>
                                                    Урок №{item.lesson_number || 'Не указан'}
                                                </h2>
                                                <h2 className={style.lessonData}>
                                                    {item.description || 'Нет описания'}
                                                </h2>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={style.buttons}>
                                        <button 
                                            className={style.edit}
                                            onClick={() => item.id && handleEdit(item.id)}
                                        >
                                            Редактировать
                                        </button>
                                        <button 
                                            className={style.delete}
                                            onClick={() => item.id && handleDelete(item.id)}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={style.empty}>Ничего не найдено 😕</p>
                        )}
                    </div>
                    {editingId && (
                        <Upload 
                            editingId={editingId} 
                            onCancel={handleCancelEdit}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}

export default UploadedVideos;
