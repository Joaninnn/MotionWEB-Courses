namespace LESSONS {
    type GetLessonsResponse = [
        {
            id: number;
            course_image: string;
            course_name: string;
            description: string;
            created_at: string;
        }
    ];

    type GetLessonDetailResponce = {
        id: number;
        course_image: string;
        course_name: string;
        description: string;
        created_at: string;
        video_course: Array<{
            id: number;
            video: string;
            description: string;
        }>;
    };
    type GetLessonsResponse = GetLessonsResponse[];

    type GetLessonsRequest = void;

    type GetLessonDetailResponce = GetLessonDetailResponce;

    type GetLessonDetailRequest = number;
}
