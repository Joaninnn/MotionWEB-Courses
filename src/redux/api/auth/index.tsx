 
import { api } from "../index";
import type { ILoginRequest, ILoginResponse } from "./types";
import { setUser, clearUser } from "../../slices/userSlice";
import Cookies from "js-cookie";
import type { RootState } from "../../store";

// Тип для ответа от /profile/ эндпоинта
interface ProfileResponse {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string | null;
    course: number | null;
    role: string;
}

// Тип для обработанного пользователя из валидации
interface ValidatedUser {
    username: string; 
    email: string; 
    firstName: string; 
    lastName: string; 
    phoneNumber: string | null; 
    course: number | null; 
    role: string; 
    id: number | null;
}

type NormalizedStatus = "mentor" | "student";

const normalizeStatus = (value: unknown): NormalizedStatus | null => {
    if (typeof value !== "string") return null;
    const v = value.trim().toLowerCase();
    if (v === "mentor" || v === "student") return v;
    return null;
};

// Тип для ответа от чат API
interface ChatTokenResponse {
    token: string;
}

export const authApi = api.injectEndpoints({
    endpoints: (build) => ({
        // Получение токена для чата
        getChatToken: build.mutation<ChatTokenResponse, void>({
            query: () => ({
                url: "/api/chat/token",
                method: "POST",
            }),
        }),
        // Простая проверка валидности токена
        validateToken: build.query<
            { valid: boolean; user?: ValidatedUser },
            void
        >({
            query: () => ({
                url: "/profile/",
                method: "GET",
            }),
            keepUnusedDataFor: 300, // Кешируем на 5 минут
            providesTags: ["User"],
            transformResponse: (response: unknown) => {
                console.log("✅ [VALIDATE_TOKEN] Ответ от сервера:", response);
                console.log(
                    "✅ [VALIDATE_TOKEN] Тип ответа:",
                    Array.isArray(response) ? "массив" : "объект"
                );

                // Если ответ - массив, берём первый элемент
                const userData = Array.isArray(response)
                    ? response[0]
                    : response;

                console.log(
                    "✅ [VALIDATE_TOKEN] Данные пользователя:",
                    userData
                );

                // Type guard для проверки структуры данных
                const isValidProfileData = (data: unknown): data is ProfileResponse => {
                    return typeof data === 'object' && data !== null &&
                           'id' in data && 'first_name' in data && 'last_name' in data &&
                           'phone_number' in data && 'course' in data && 'role' in data;
                };

                const validData = isValidProfileData(userData) ? userData : null;

                return {
                    valid: true,
                    user: {
                        username: "", // НЕ используем username из API - он пустой
                        email: `${validData?.first_name || ''}.${validData?.last_name || ''}@example.com`.toLowerCase(),
                        firstName: validData?.first_name || '',
                        lastName: validData?.last_name || '',
                        phoneNumber: validData?.phone_number || null,
                        course: validData?.course || null,
                        role: validData?.role || '',
                        id: validData?.id || null,
                    },
                };
            },
            async onQueryStarted(_, { queryFulfilled, dispatch, getState }) {
                try {
                    const { data } = await queryFulfilled;
                    
                    // Получаем текущие данные пользователя из Redux
                    const currentState = getState() as RootState;
                    const currentUser = currentState.user;

                    // Автоматически обновляем профиль пользователя в Redux
                    if (data.user && currentUser.username !== null) {
                        console.log(
                            "💾 [VALIDATE_TOKEN] Обновляем профиль пользователя:",
                            data.user
                        );
                        console.log(
                            "🔍 [VALIDATE_TOKEN] Текущий username из Redux:",
                            currentUser.username
                        );
                        console.log(
                            "🔍 [VALIDATE_TOKEN] Текущий статус из Redux:",
                            currentUser.status
                        );
                        
                        const statusFromProfile = normalizeStatus(data.user.role);
                        dispatch(
                            setUser({
                                username: currentUser.username, // Сохраняем существующий username
                                email:
                                    data.user.email ||
                                    currentUser.email ||
                                    `${currentUser.username?.toLowerCase()}@example.com`,
                                firstName: data.user.firstName,
                                lastName: data.user.lastName,
                                phoneNumber: data.user.phoneNumber,
                                course: data.user.course,
                                role: data.user.role,
                                id: data.user.id,
                                // /profile.role — источник правды (mentor/student)
                                status: statusFromProfile ?? currentUser.status ?? null,
                            })
                        );
                    } else {
                        console.log(
                            "⚠️ [VALIDATE_TOKEN] Нет данных пользователя для обновления"
                        );
                    }
                } catch (error) {
                    console.log("❌ [VALIDATE_TOKEN] Ошибка валидации:", error);
                    // При ошибке очищаем данные
                    dispatch(clearUser());
                }
            },
        }),

        // Логин
        login: build.mutation<ILoginResponse, ILoginRequest>({
            query: (credentials) => ({
                url: "/login/",
                method: "POST",
                body: credentials,
            }),
            async onQueryStarted(_, { queryFulfilled, dispatch }) {
                try {
                    console.log("🔄 [AUTH_API] Начало процесса логина...");

                    dispatch(clearUser());
                    if (typeof window !== "undefined") {
                        localStorage.removeItem("userState");
                    }

                    const { data } = await queryFulfilled;
                    console.log(
                        "✅ [AUTH_API] Данные от сервера получены:",
                        data
                    );

                    // Сохраняем токены в cookies
                    if (data.access && data.refresh) {
                        console.log(
                            "💾 [AUTH_API] Сохраняем токены в cookies..."
                        );

                        Cookies.remove("access_token");
                        Cookies.remove("refresh_token");

                        Cookies.set("access_token", data.access, {
                            expires: 1 / 24,
                            path: "/",
                            sameSite: "lax",
                            domain: window.location.hostname.includes('vercel.app') ? undefined : undefined,
                        });

                        Cookies.set("refresh_token", data.refresh, {
                            expires: 7,
                            path: "/",
                            sameSite: "lax",
                            domain: window.location.hostname.includes('vercel.app') ? undefined : undefined,
                        });

                        console.log("✅ [AUTH_API] Токены сохранены");
                    }

                    // Сохраняем пользователя в Redux
                    console.log(
                        "💾 [AUTH_API] Вызываем setUser для:",
                        data.user
                    );
                    console.log(
                        "🔍 [AUTH_API] Сохраняем username:",
                        data.user.username
                    );
                    console.log(
                        "🔍 [AUTH_API] Сохраняем status:",
                        data.user.status
                    );
                    
                    // Определяем статус: берем status, иначе role, нормализуем
                    const finalStatus =
                        normalizeStatus(data.user.status) ??
                        normalizeStatus(data.user.role);
                    
                    console.log(
                        "🔍 [AUTH_API] Финальный статус:",
                        finalStatus
                    );
                    
                    dispatch(
                        setUser({
                            username: data.user.username,
                            email: data.user.email || `${data.user.username.toLowerCase()}@example.com`, // Fallback если email null
                            firstName: data.user.firstName, // Уже может быть null
                            lastName: data.user.lastName, // Уже может быть null
                            phoneNumber: data.user.phoneNumber, // Уже может быть null
                            course: data.user.course, // Уже может быть null
                            role: data.user.role, // Уже может быть null
                            id: data.user.id, // Уже может быть null
                            status: finalStatus,
                        })
                    );

                    const token = Cookies.get("access_token");
                    if (token) {
                        const resp = await fetch(
                            `${process.env.NEXT_PUBLIC_MOTIONCOURSE_API}/profile/`,
                            {
                                method: "GET",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );

                        if (resp.ok) {
                            const profileJson: unknown = await resp.json();
                            const profileItem = Array.isArray(profileJson)
                                ? profileJson[0]
                                : profileJson;

                            const profile =
                                profileItem && typeof profileItem === "object"
                                    ? (profileItem as Partial<ProfileResponse>)
                                    : null;

                            const statusFromProfile = normalizeStatus(
                                profile?.role
                            );

                            if (statusFromProfile) {
                                dispatch(
                                    setUser({
                                        username: data.user.username,
                                        email:
                                            data.user.email ||
                                            `${data.user.username.toLowerCase()}@example.com`,
                                        firstName: data.user.firstName,
                                        lastName: data.user.lastName,
                                        phoneNumber: profile?.phone_number ?? null,
                                        course: profile?.course ?? null,
                                        role: profile?.role ?? null,
                                        id: profile?.id ?? null,
                                        status: statusFromProfile,
                                    })
                                );
                            }
                        }
                    }
                    
                    console.log("✅ [AUTH_API] Пользователь сохранен в Redux");
                    
                    // Проверяем что данные сохранились в sessionStorage
                    if (typeof window !== 'undefined') {
                        setTimeout(() => {
                            console.log("🔍 [AUTH_API] Проверка sessionStorage после логина:");
                            console.log("   userState:", sessionStorage.getItem("userState"));
                            console.log("   access_token:", !!Cookies.get("access_token"));
                        }, 100);
                    }
                } catch (error) {
                    console.log("❌ [AUTH_API] Ошибка при логине:", error);
                }
            },
            invalidatesTags: ["User"],
        }),

        // Обновление токена
        refreshToken: build.mutation<{ access: string }, { refresh: string }>({
            query: (body) => ({
                url: "/api/token/refresh",
                method: "POST",
                body,
            }),
        }),

        // Выход
        logout: build.mutation<void, void>({
            query: () => ({
                url: "/logout/",
                method: "POST",
            }),
            invalidatesTags: ["User"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    console.log("✅ [AUTH_API] Logout успешен");
                } catch {
                    console.log("⚠️ [AUTH_API] Logout failed");
                } finally {
                    console.log("🧹 [AUTH_API] Очистка данных...");

                    dispatch(clearUser());
                    dispatch(api.util.resetApiState());

                    Cookies.remove("access_token", { path: "/" });
                    Cookies.remove("refresh_token", { path: "/" });
                    
                    // Очищаем sessionStorage
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('userState');
                        console.log("🧹 [AUTH_API] sessionStorage очищен");
                    }

                    console.log("✅ [AUTH_API] Данные очищены");
                }
            },
        }),
    }),
});

export const {
    useValidateTokenQuery,
    useLoginMutation,
    useRefreshTokenMutation,
    useLogoutMutation,
} = authApi;
