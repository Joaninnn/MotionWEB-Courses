import { api as index } from "..";

const api = index.injectEndpoints({
    endpoints: (build) => ({
        // Получить все видео ментора
        getMentorVideos: build.query<MENTOR.GetVideosResponse, void>({
            query: () => ({
                url: `/mentor/videos/`,
                method: "GET",
            }),
            providesTags: ["mentor"],
        }),

        // Получить детали видео
        getMentorVideoDetail: build.query<MENTOR.GetVideoDetailResponse, number>({
            query: (id) => ({
                url: `video-update/${id}/`,
                method: "GET",
            }),
            providesTags: ["mentor"],
        }),

        // Создать видео
        createVideo: build.mutation<MENTOR.CreateVideoResponse, MENTOR.CreateVideoRequest>({
            query: (data) => {
                const formData = new FormData();
                formData.append("course", data.course.toString());
                formData.append("category_lesson", data.category_lesson.toString());
                formData.append("video", data.video);
                if (data.lesson_number !== undefined) {
                    formData.append("lesson_number", data.lesson_number.toString());
                }
                if (data.description) {
                    formData.append("description", data.description);
                }

                // Логирование FormData для отладки
                console.log("🔍 [MENTOR_API] FormData being sent:");
                for (const [key, value] of formData.entries()) {
                    console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
                }

                return {
                    url: `video-create/`,
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: ["mentor", "video"],
        }),

        // Обновить видео
        updateVideo: build.mutation<MENTOR.UpdateVideoResponse, MENTOR.UpdateVideoRequest>({
            query: ({ id, ...data }) => ({
                url: `video-update/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: ["mentor", "video"],
        }),

        // Удалить видео
        deleteVideo: build.mutation<void, MENTOR.DeleteVideoRequest>({
            query: (id) => ({
                url: `video-update/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["mentor", "video"],
        }),
    }),
});

export const {
    useGetMentorVideosQuery,
    useGetMentorVideoDetailQuery,
    useCreateVideoMutation,
    useUpdateVideoMutation,
    useDeleteVideoMutation,
} = api;        















