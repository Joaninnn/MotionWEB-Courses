import { api as index } from "..";

const api = index.injectEndpoints({
    endpoints: (build) => ({
        getMentorVideos: build.query<MENTOR.VideoResponse[], void>({
            query: () => ({
                url: `/mentor/videos/`,
                method: "GET",
            }),
            providesTags: ["mentor", "video"],
        }),

        getMentorVideoDetail: build.query<MENTOR.GetVideoDetailResponse, number>({
            query: (id) => ({
                url: `video-update/${id}/`,
                method: "GET",
            }),
            providesTags: ["mentor"],
        }),

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

                for (const [key, value] of formData.entries()) {
                }

                return {
                    url: `video-create/`,
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: ["mentor", "video"],
        }),

        updateVideo: build.mutation<MENTOR.UpdateVideoResponse, MENTOR.UpdateVideoRequest>({
            query: ({ id, ...data }) => ({
                url: `video-update/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: ["mentor", "video"],
        }),

        deleteVideo: build.mutation<void, number>({
            query: (id) => ({
                url: `video-update/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["mentor", "video"],
        }),

        getCourseList: build.query<{ id: number; course_name: string }[], void>({
            query: () => ({
                url: `/course_list/`,
                method: "GET",
            }),
            providesTags: ["course"],
        }),

        getCategoryLessonList: build.query<{ id: number; ct_lesson_name: string }[], void>({
            query: () => ({
                url: `/cactegory_lesson_list/`,
                method: "GET",
            }),
            providesTags: ["course"],
        }),
    }),
});

export const {
    useGetMentorVideosQuery,
    useGetMentorVideoDetailQuery,
    useCreateVideoMutation,
    useUpdateVideoMutation,
    useDeleteVideoMutation,
    useGetCourseListQuery,
    useGetCategoryLessonListQuery,
} = api;