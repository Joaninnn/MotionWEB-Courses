namespace MENTOR {
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

    interface CreateVideoRequest {
        course: number;
        category_lesson: number;
        video: File;
        lesson_number?: number;
        description?: string;
    }

    interface UpdateVideoRequest {
        id: number;
        course?: number;
        category_lesson?: number;
        lesson_number?: number;
        description?: string;
    }

    type VideoItem = VideoResponse

    type GetVideosResponse = VideoResponse[];
    type GetVideoDetailResponse = VideoResponse;
    type CreateVideoResponse = VideoResponse;
    type UpdateVideoResponse = VideoResponse;
}