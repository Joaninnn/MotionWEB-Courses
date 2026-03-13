export interface ILoginRequest {
    username: string;
    password: string;
}

export interface ILoginResponse {
    user: {
        username: string;
        email: string | null; 
        status: string | null; 
        firstName: string | null;
        lastName: string | null;
        phoneNumber: string | null;
        course: number | null;
        chat_group_id: number | null; 
        role: string | null;
        id: number | null;
    };
    access: string;
    refresh: string;
}
