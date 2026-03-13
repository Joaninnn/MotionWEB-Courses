 
import { api } from "../index";
import type { ILoginRequest, ILoginResponse } from "./types";
import { setUser, clearUser } from "../../slices/userSlice";
import Cookies from "js-cookie";
import type { RootState } from "../../store";

interface ProfileResponse {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string | null;
    course: number | null;
    chat_group_id: number | null; 
    role: string;
}

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

interface ChatTokenResponse {
    token: string;
}

export const authApi = api.injectEndpoints({
    endpoints: (build) => ({
        getChatToken: build.mutation<ChatTokenResponse, void>({
            query: () => ({
                url: "/api/chat/token",
                method: "POST",
            }),
        }),
        validateToken: build.query<
            { valid: boolean; user?: ValidatedUser },
            void
        >({
            query: () => ({
                url: "/profile/",
                method: "GET",
            }),
            keepUnusedDataFor: 300,
            providesTags: ["User"],
            transformResponse: (response: unknown) => {
                const userData = Array.isArray(response)
                    ? response[0]
                    : response;
                const isValidProfileData = (data: unknown): data is ProfileResponse => {
                    return typeof data === 'object' && data !== null &&
                           'id' in data && 'first_name' in data && 'last_name' in data &&
                           'phone_number' in data && 'course' in data && 'role' in data;
                };

                const validData = isValidProfileData(userData) ? userData : null;

                return {
                    valid: true,
                    user: {
                        username: "",
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
                    
                    const currentState = getState() as RootState;
                    const currentUser = currentState.user;

                    if (data.user && currentUser.username !== null) {
                      
                        
                        const statusFromProfile = normalizeStatus(data.user.role);
                        dispatch(
                            setUser({
                                username: currentUser.username,
                                email:
                                    data.user.email ||
                                    currentUser.email ||
                                    `${currentUser.username?.toLowerCase()}@example.com`,
                                firstName: data.user.firstName,
                                lastName: data.user.lastName,
                                phoneNumber: data.user.phoneNumber,
                                course: data.user.course,
                                chat_group_id: currentUser.chat_group_id, 
                                role: data.user.role,
                                id: data.user.id,
                                status: statusFromProfile ?? currentUser.status ?? null,
                            })
                        );
                    } else {
                        
                    }
                } catch (error) {
                   
                    dispatch(clearUser());
                }
            },
        }),

        login: build.mutation<ILoginResponse, ILoginRequest>({
            query: (credentials) => ({
                url: "/login/",
                method: "POST",
                body: credentials,
            }),
            async onQueryStarted(_, { queryFulfilled, dispatch }) {
                try {

                    dispatch(clearUser());
                    if (typeof window !== "undefined") {
                        localStorage.removeItem("userState");
                    }

                    const { data } = await queryFulfilled;

                    if (data.access && data.refresh) {
                        

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

                    }

                    const finalStatus =
                        normalizeStatus(data.user.status) ??
                        normalizeStatus(data.user.role);
                    
                    
                    
                    dispatch(
                        setUser({
                            username: data.user.username,
                            email: data.user.email || `${data.user.username.toLowerCase()}@example.com`, 
                            firstName: data.user.firstName, 
                            lastName: data.user.lastName, 
                            phoneNumber: data.user.phoneNumber, 
                            course: data.user.course, 
                            chat_group_id: data.user.chat_group_id || null, 
                            role: data.user.role, 
                            id: data.user.id, 
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
                                        chat_group_id: profile?.chat_group_id ?? null, 
                                        role: profile?.role ?? null,
                                        id: profile?.id ?? null,
                                        status: statusFromProfile,
                                    })
                                );
                            }
                        }
                    }
                    
                    if (typeof window !== 'undefined') {
                        setTimeout(() => {
                        }, 100);
                    }
                } catch (error) {
                }
            },
            invalidatesTags: ["User"],
        }),

        refreshToken: build.mutation<{ access: string }, { refresh: string }>({
            query: (body) => ({
                url: "/api/token/refresh",
                method: "POST",
                body,
            }),
        }),

        logout: build.mutation<void, void>({
            query: () => ({
                url: "/logout/",
                method: "POST",
            }),
            invalidatesTags: ["User"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch {
                } finally {

                    dispatch(clearUser());
                    dispatch(api.util.resetApiState());

                    Cookies.remove("access_token", { path: "/" });
                    Cookies.remove("refresh_token", { path: "/" });
                    
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('userState');
                    }

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
