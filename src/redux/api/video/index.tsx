import { api as index } from "..";

const api = index.injectEndpoints({
    endpoints: (build) => ({
        // Список видео
        getVideos: build.query<
            VIDEO.GetVideoListResponse, // тип ответа
            VIDEO.GetVideoListRequest // тип параметров запроса
        >({
            query: (params) => ({
                url: `video`,
                method: "GET",
                params, // передаем query-параметры, если есть
            }),
            providesTags: ["video"],
        }),

        // Детали видео по id
        getVideosDetail: build.query<
            VIDEO.GetVideoDetailResponse, // тип ответа
            VIDEO.GetVideoDetailRequest // id видео
        >({
            query: (id) => ({
                url: `video/${id}`,
                method: "GET",
            }),
            providesTags: ["video"],
        }),

        // Видео по курсу пользователя
        getCourseVideos: build.query<
            VIDEO.GetVideoListResponse, // тип ответа
            { course_id: string; category_lesson?: string; lesson_number?: string } // тип параметров
        >({
            query: ({ course_id, ...params }) => ({
                url: `courses/${course_id}/videos/`,
                method: "GET",
                params, // фильтры category_lesson и lesson_number
            }),
            providesTags: ["video"],
        }),
    }),
});

export const { useGetVideosQuery, useGetVideosDetailQuery, useGetCourseVideosQuery } = api;
