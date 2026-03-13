import { configureStore } from "@reduxjs/toolkit";
import { api } from "./api";
import { chatApi } from "./api/chat";
import userReducer from "./slices/userSlice";
import chatReducer from "./slices/chatSlice";
import notificationsReducer from "./slices/notificationsSlice";

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
