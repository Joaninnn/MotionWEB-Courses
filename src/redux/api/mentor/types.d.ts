namespace MENTOR {
    interface CategoryLesson {
        id: number;
        ct_lesson_name: string;
    }

    interface VideoResponse {
        id: number;
        course: number;
        them_lesson: string;
        video: string;
        description?: string;
        created_at?: string;
    }

    interface CreateVideoRequest {
        course: number;
        them_lesson: string;
        video: File | string;
        lesson_number?: number;
        description?: string;
    }

    interface UpdateVideoRequest {
        id: number;
        course?: number;
        them_lesson?: string;
        description?: string;
        video?: File | string;
    }

    type VideoItem = VideoResponse

    type GetVideosResponse = VideoResponse[];
    type GetVideoDetailResponse = VideoResponse;
    type CreateVideoResponse = VideoResponse;
    type UpdateVideoResponse = VideoResponse;
}