import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const USER_STATUS = {
    MENTOR: 'mentor',
    STUDENT: 'student'
} as const;

type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

export interface UserState {
    username: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
    course: number | null;
    chat_group_id: number | null; 
    role: string | null;
    id: number | null;
    status: UserStatus | null; 
}

type SetUserPayload = Omit<UserState, 'username'> & { username: string };

const initialState: UserState = {
    username: null,
    email: null,
    firstName: null,
    lastName: null,
    phoneNumber: null,
    course: null,
    chat_group_id: null,
    role: null,
    id: null,
    status: null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (
            state,
            action: PayloadAction<SetUserPayload>
        ) => {
            if (process.env.NODE_ENV === 'development') {
            }
            
            const { username, email, firstName, lastName, phoneNumber, course, chat_group_id, role, id, status } = action.payload;
            
            state.username = username;
            state.email = email;
            state.firstName = firstName;
            state.lastName = lastName;
            state.phoneNumber = phoneNumber;
            state.course = course;
            state.chat_group_id = chat_group_id;
            state.role = role;
            state.id = id;
            state.status = status;
        },
        clearUser: (state) => {
            if (process.env.NODE_ENV === 'development') {
            }
            
            Object.assign(state, initialState);
        },
    },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
