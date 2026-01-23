// src/redux/api/auth/types.d.ts
export interface ILoginRequest {
    username: string;
    password: string;
}

export interface ILoginResponse {
    user: {
        username: string;
        email: string | null; // email может быть пустым
        status: string | null; // Mentor или Student
        // Другие поля могут приходить от API логина, но не гарантированы
        firstName: string | null;
        lastName: string | null;
        phoneNumber: string | null;
        course: number | null;
        role: string | null;
        id: number | null;
    };
    // Токены приходят в ответе от бекенда
    access: string;
    refresh: string;
}
