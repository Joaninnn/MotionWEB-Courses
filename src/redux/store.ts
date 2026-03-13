import { configureStore, Middleware, MiddlewareAPI } from "@reduxjs/toolkit";
import { api } from "./api";
import { chatApi } from "./api/chat";
import userReducer, { UserState } from "./slices/userSlice";
import chatReducer from "./slices/chatSlice";
import notificationsReducer from "./slices/notificationsSlice";
import { chatMiddleware } from "./middleware/chatMiddleware";

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

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

const localStorageMiddleware: Middleware<object, RootState> =
    (store: MiddlewareAPI<AppDispatch, RootState>) => (next) => (action) => {
        const result = next(action);

        if (typeof action === "object" && action !== null && "type" in action) {
            const typedAction = action as { type: string };
            if (typedAction.type?.startsWith("user/")) {
                const userState = store.getState().user;
                if (typeof window !== "undefined") {
                    try {
                        const dataToSave = {
                            ...userState,
                            _timestamp: Date.now(),
                        };
                        const storage = typeof window !== 'undefined' ? window.sessionStorage : localStorage;
                        storage.setItem(
                            "userState",
                            JSON.stringify(dataToSave)
                        );
                       
                        
                        const savedData = storage.getItem("userState");
                        if (savedData) {
                        }
                    } catch (error) {
                      
                    }
                }
            }
        }

        return result;
    };

const loadUserState = (): UserState | undefined => {
    if (typeof window !== "undefined") {
        try {
            const storage = window.sessionStorage;
            const serializedState = storage.getItem("userState");
            if (serializedState) {
                const parsed = JSON.parse(serializedState);

                const timestamp = parsed._timestamp || 0;
                const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 дней в миллисекундах
                const isExpired = Date.now() - timestamp > maxAge;

                if (isExpired) {
                  
                    storage.removeItem("userState");
                    return undefined;
                }

                const { _timestamp, ...userState } = parsed;
                return userState as UserState;
            }
        } catch (error) {
        
            window.sessionStorage.removeItem("userState"); // Очищаем поврежденные данные
        }
    } else {
    }
    return undefined;
};

let globalStore: AppStore | null = null;

export const makeStoreWithMiddleware = () => {
    if (globalStore && typeof window !== "undefined") {
        return globalStore;
    }

    const preloadedUserState = loadUserState();

   

    const store = configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            [chatApi.reducerPath]: chatApi.reducer,
            user: userReducer,
            chat: chatReducer,
            notifications: notificationsReducer,
        },
        preloadedState: preloadedUserState
            ? { user: preloadedUserState }
            : undefined,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(
                api.middleware, 
                chatApi.middleware,
                localStorageMiddleware,
                chatMiddleware
            ),
    });


    if (typeof window !== "undefined") {
        globalStore = store;
    }

    return store;
};
