// src/redux/slices/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
    username: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
    course: number | null;
    role: string | null;
    id: number | null;
    status: string | null; // Mentor или Student
}

const initialState: UserState = {
    username: null,
    email: null,
    firstName: null,
    lastName: null,
    phoneNumber: null,
    course: null,
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
            action: PayloadAction<{
                username: string; 
                email: string | null;
                firstName: string | null;
                lastName: string | null;
                phoneNumber: string | null;
                course: number | null;
                role: string | null;
                id: number | null;
                status: string | null;
            }>
        ) => {
            console.log("✅ [USER_SLICE] setUser called with:", action.payload);
            state.username = action.payload.username;
            state.email = action.payload.email;
            state.firstName = action.payload.firstName;
            state.lastName = action.payload.lastName;
            state.phoneNumber = action.payload.phoneNumber;
            state.course = action.payload.course;
            state.role = action.payload.role;
            state.id = action.payload.id;
            state.status = action.payload.status;
        },
        clearUser: (state) => {
            console.log("🧹 [USER_SLICE] clearUser called");
            state.username = null;
            state.email = null;
            state.firstName = null;
            state.lastName = null;
            state.phoneNumber = null;
            state.course = null;
            state.role = null;
            state.id = null;
            state.status = null;
        },
    },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
