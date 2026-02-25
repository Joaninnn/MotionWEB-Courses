// src/redux/store.ts
import { configureStore, Middleware, MiddlewareAPI } from "@reduxjs/toolkit";
import { api } from "./api";
import { chatApi } from "./api/chat";
import userReducer, { UserState } from "./slices/userSlice";
import chatReducer from "./slices/chatSlice";
import notificationsReducer, { addNotification, markAsRead, markAllAsRead } from "./slices/notificationsSlice";

// Создаём функцию для создания store (нужно определить раньше для типов)
export const makeStore = () => {
    return configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            [chatApi.reducerPath]: chatApi.reducer,
            user: userReducer,
            chat: chatReducer,
            notifications: notificationsReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(api.middleware, chatApi.middleware),
    });
};

export type RootState = ReturnType<ReturnType<typeof makeStore>['getState']>;
export type AppDispatch = ReturnType<typeof makeStore>['dispatch'];
