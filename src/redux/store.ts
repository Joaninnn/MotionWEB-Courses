// src/redux/store.ts
import { configureStore, Middleware, MiddlewareAPI } from "@reduxjs/toolkit";
import { api } from "./api";
import userReducer, { UserState } from "./slices/userSlice";

// Создаём функцию для создания store (нужно определить раньше для типов)
export const makeStore = () => {
    return configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            user: userReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(api.middleware),
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
                const userState = store.getState().user;
                if (typeof window !== "undefined") {
                    try {
                        // Сохраняем с timestamp для проверки актуальности
                        const dataToSave = {
                            ...userState,
                            _timestamp: Date.now(),
                        };
                        localStorage.setItem(
                            "userState",
                            JSON.stringify(dataToSave)
                        );
                        console.log(
                            "💾 [STORE] User state saved to localStorage:",
                            userState
                        );
                    } catch (error) {
                        console.error(
                            "❌ [STORE] Failed to save to localStorage:",
                            error
                        );
                    }
                }
            }
        }

        return result;
    };

// Загружаем состояние пользователя из localStorage
const loadUserState = (): UserState | undefined => {
    if (typeof window !== "undefined") {
        try {
            const serializedState = localStorage.getItem("userState");
            if (serializedState) {
                const parsed = JSON.parse(serializedState);

                // Проверяем актуальность данных (не старше 7 дней)
                const timestamp = parsed._timestamp || 0;
                const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 дней в миллисекундах
                const isExpired = Date.now() - timestamp > maxAge;

                if (isExpired) {
                    console.log(
                        "⚠️ [STORE] User state expired, clearing localStorage"
                    );
                    localStorage.removeItem("userState");
                    return undefined;
                }

                // Удаляем _timestamp из состояния
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { _timestamp, ...userState } = parsed;
                console.log(
                    "📂 [STORE] User state loaded from localStorage:",
                    userState
                );
                return userState as UserState;
            }
        } catch (error) {
            console.error(
                "❌ [STORE] Failed to load from localStorage:",
                error
            );
            localStorage.removeItem("userState"); // Очищаем поврежденные данные
        }
    }
    return undefined;
};

// Обновляем функцию для создания store с middleware и preloadedState
export const makeStoreWithMiddleware = () => {
    const preloadedUserState = loadUserState();

    console.log(
        "🏪 [STORE] Creating store with preloaded user state:",
        preloadedUserState
    );

    return configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            user: userReducer,
        },
        preloadedState: preloadedUserState
            ? { user: preloadedUserState }
            : undefined,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(
                api.middleware,
                localStorageMiddleware
            ),
    });
};
