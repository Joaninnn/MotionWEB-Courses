

namespace MENTOR {
    interface CategoryLesson {
        id: number;
        ct_lesson_name: string;
    }

    interface VideoItem {
        id: number;
        course: number;
        category_lesson: number;
        video: string;
        lesson_number: number;
        description: string;
    }

    // Типы для создания/обновления видео
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

    interface DeleteVideoRequest {
        id: number;
    }

    interface VideoResponse {
        id: number;
        course: number;
        category_lesson: number;
        video: string;
        lesson_number: number;
        description: string;
    }

    // Response types
    type GetVideosResponse = VideoItem[];
    type GetVideoDetailResponse = VideoResponse;
    type CreateVideoResponse = VideoResponse;
    type UpdateVideoResponse = VideoResponse;
}