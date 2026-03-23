namespace VIDEO {
    interface CategoryLesson {
        id: number;
        ct_lesson_name: string;
    }

    interface VideoListItem {
        id: number;
        course: number;
        them_lesson: string;
        created_at: string;
    }

    interface VideoDetailItem {
        id: number;
        course: number;
        them_lesson: string;
        video: string;
        description?: string;
        created_at?: string;
    }

    type GetVideoListResponse = VideoListItem[];
    type GetVideoDetailResponse = VideoDetailItem;

    type GetVideoListRequest = {
        them_lesson?: string;
    };

    type GetVideoDetailRequest = number; // ID видео
}
