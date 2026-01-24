// src/components/AuthInitializer.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUser, clearUser } from "@/redux/slices/userSlice";
import Cookies from "js-cookie";

export function AuthInitializer() {
    const [isMounted, setIsMounted] = React.useState(false);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const hasToken = isMounted ? !!Cookies.get("access_token") : false;
    const currentUser = useAppSelector((state) => state.user);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    React.useEffect(() => {
        if (!isMounted) return;

        console.log("🔍 [AUTH_INIT] Initial state check:", {
            hasToken,
            username: currentUser?.username,
            status: currentUser?.status,
            course: currentUser?.course,
        });

        // Если есть токен но нет данных в Redux
        if (hasToken && !currentUser?.username) {
            console.log("⚠️ [AUTH_INIT] Token exists but no user data");
            
            // Отладочный лог - проверяем все ключи в sessionStorage
            console.log("🔍 [AUTH_INIT] sessionStorage keys:", Object.keys(sessionStorage));
            console.log("🔍 [AUTH_INIT] sessionStorage userState:", sessionStorage.getItem("userState"));
            
            // Проверяем sessionStorage
            const storedUser = sessionStorage.getItem("userState");
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    // Удаляем _timestamp если есть
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { _timestamp, ...userData } = parsedUser;
                    
                    console.log("📂 [AUTH_INIT] Loading user from sessionStorage:", userData);
                    
                    // Загружаем данные в Redux
                    dispatch(setUser(userData));
                } catch (error) {
                    console.error("❌ [AUTH_INIT] Error parsing stored user:", error);
                    sessionStorage.removeItem("userState");
                    Cookies.remove("access_token");
                    Cookies.remove("refresh_token");
                    dispatch(clearUser());
                    router.replace("/login");
                }
            } else {
                console.log(" [AUTH_INIT] No user in sessionStorage - clearing tokens");
                Cookies.remove("access_token");
                Cookies.remove("refresh_token");
                dispatch(clearUser());
                router.replace("/login");
            }
        }

        // Если нет токена но есть данные в Redux - очищаем Redux
        if (!hasToken && currentUser?.username) {
            console.log(" [AUTH_INIT] No token but user data exists - clearing state");
            dispatch(clearUser());
            sessionStorage.removeItem("userState");
        }
    }, [isMounted, hasToken, currentUser, router, dispatch]);

    return null;
}