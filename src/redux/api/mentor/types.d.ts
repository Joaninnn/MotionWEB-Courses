// src/redux/api/lessons/types.ts
namespace MENTOR {
    interface MentorItem {
        id: number;
        course_image: string;
        course_name: string;
        description: string;
        created_at: string;
    }

    interface VideoItem {
        id: number;
        course: number;
        category_lesson: number;
        video: string;
        lesson_number: number;
        description: string;
    }

    interface LessonDetailResponse {
        id: number;
        course_image: string;
        course_name: string;
        description: string;
        created_at: string;
        video_course: VideoItem[];
    }

    type GetLessonsResponse = LessonItem[];
    type GetLessonDetailResponse = LessonDetailResponse;

    type GetLessonsRequest = void;
    type GetLessonDetailRequest = number;

    // Типы для создания/обновления видео
    interface CreateVideoRequest {
        course: number;
        category_lesson: number;
        video: File;
        lesson_number?: number;
        description?: string;
    }

    interface UpdateVideoRequest {
        course?: number;
        category_lesson?: number;
        lesson_number?: number;
        description?: string;
    }

    interface VideoResponse {
        id: number;
        course: number;
        category_lesson: number;
        video: string;
        lesson_number: number;
        description: string;
    }
}
