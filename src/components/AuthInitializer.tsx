// src/components/AuthInitializer.tsx
"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/redux/hooks";
import Cookies from "js-cookie";

/**
 * Компонент для проверки начального состояния аутентификации
 * Данные пользователя уже восстанавливаются из localStorage в store
 */
export function AuthInitializer() {
    const [isClient, setIsClient] = useState(false);
    const hasToken = isClient ? !!Cookies.get("access_token") : false;
    const currentUser = useAppSelector((state) => state.user);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return; // Не выполняем логику на сервере

        console.log("🔍 [AUTH_INIT] Initial state check:", {
            hasToken,
            username: currentUser?.username,
            status: currentUser?.status,
            course: currentUser?.course,
        });

        // Если есть токен но нет данных в Redux, возможно нужно очистить и перенаправить
        if (hasToken && !currentUser?.username) {
            console.log("⚠️ [AUTH_INIT] Token exists but no user data in Redux");
            // Здесь можно добавить логику для очистки токена и редиректа
        }
    }, [isClient, hasToken, currentUser]);

    return null; // Этот компонент ничего не рендерит
}
