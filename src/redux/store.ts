// src/redux/store.ts
import { configureStore, Middleware, MiddlewareAPI } from "@reduxjs/toolkit";
import { api } from "./api";
import { chatApi } from "./api/chat";
import userReducer, { UserState } from "./slices/userSlice";
import chatReducer from "./slices/chatSlice";

// Создаём функцию для создания store (нужно определить раньше для типов)
export const makeStore = () => {
    return configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            [chatApi.reducerPath]: chatApi.reducer,
            user: userReducer,
            chat: chatReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(api.middleware, chatApi.middleware),
    });
};

// Экспортируем типы
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

// Middleware для сохранения состояния пользователя в localStorage
const localStorageMiddleware: Middleware<object, RootState> =
    (store: MiddlewareAPI<AppDispatch, RootState>) => (next) => (action) => {
        const result = next(action);

        // Сохраняем состояние пользователя после каждого изменения
        if (typeof action === "object" && action !== null && "type" in action) {
            const typedAction = action as { type: string };
            if (typedAction.type?.startsWith("user/")) {
                console.log("🔍 [MIDDLEWARE] Action detected:", typedAction.type);
                const userState = store.getState().user;
                if (typeof window !== "undefined") {
                    try {
                        // Сохраняем с timestamp для проверки актуальности
                        const dataToSave = {
                            ...userState,
                            _timestamp: Date.now(),
                        };
                        // Временное решение для отладки - используем sessionStorage
                        const storage = typeof window !== 'undefined' ? window.sessionStorage : localStorage;
                        storage.setItem(
                            "userState",
                            JSON.stringify(dataToSave)
                        );
                        console.log(
                            "💾 [MIDDLEWARE] User state saved to sessionStorage:",
                            userState
                        );
                        
                        // Немедленно проверяем что данные сохранились
                        const savedData = storage.getItem("userState");
                        console.log("🔍 [MIDDLEWARE] Verification - saved data:", savedData ? "SUCCESS" : "FAILED");
                        if (savedData) {
                            console.log("🔍 [MIDDLEWARE] Saved content:", JSON.parse(savedData));
                        }
                    } catch (error) {
                        console.error(
                            "❌ [MIDDLEWARE] Failed to save to localStorage:",
                            error
                        );
                    }
                }
            }
        }

        return result;
    };

// Загружаем состояние пользователя из localStorage/sessionStorage
const loadUserState = (): UserState | undefined => {
    // Проверяем, что мы в браузере
    if (typeof window !== "undefined") {
        try {
            // Временное решение для отладки - используем sessionStorage
            const storage = window.sessionStorage;
            const serializedState = storage.getItem("userState");
            if (serializedState) {
                const parsed = JSON.parse(serializedState);

                // Проверяем актуальность данных (не старше 7 дней)
                const timestamp = parsed._timestamp || 0;
                const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 дней в миллисекундах
                const isExpired = Date.now() - timestamp > maxAge;

                if (isExpired) {
                    console.log(
                        "⚠️ [STORE] User state expired, clearing sessionStorage"
                    );
                    storage.removeItem("userState");
                    return undefined;
                }

                // Удаляем _timestamp из состояния
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { _timestamp, ...userState } = parsed;
                console.log(
                    "📂 [STORE] User state loaded from sessionStorage:",
                    userState
                );
                return userState as UserState;
            }
        } catch (error) {
            console.error(
                "❌ [STORE] Failed to load from sessionStorage:",
                error
            );
            // Временное решение для отладки - используем sessionStorage
            window.sessionStorage.removeItem("userState"); // Очищаем поврежденные данные
        }
    } else {
        console.log("🔍 [STORE] Running on server, sessionStorage not available");
    }
    return undefined;
};

// Глобальный экземпляр store для клиента
let globalStore: AppStore | null = null;

// Обновляем функцию для создания store с middleware и preloadedState
export const makeStoreWithMiddleware = () => {
    // Если store уже существует на клиенте, возвращаем его
    if (globalStore && typeof window !== "undefined") {
        console.log("🏪 [STORE] Returning existing global store instance");
        return globalStore;
    }

    const preloadedUserState = loadUserState();

    console.log(
        "🏪 [STORE] Creating store with preloaded user state:",
        preloadedUserState
    );

    const store = configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            [chatApi.reducerPath]: chatApi.reducer,
            user: userReducer,
            chat: chatReducer,
        },
        preloadedState: preloadedUserState
            ? { user: preloadedUserState }
            : undefined,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(
                api.middleware,
                chatApi.middleware,
                localStorageMiddleware
            ),
    });

    console.log("🔍 [STORE] Middleware added:", store.getState().user);

    // Сохраняем глобальный экземпляр на клиенте
    if (typeof window !== "undefined") {
        globalStore = store;
        console.log("🏪 [STORE] Global store instance saved");
    }

    return store;
};
