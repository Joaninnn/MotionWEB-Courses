// src/components/AuthInitializer.tsx
"use client";

import { useEffect, useRef } from "react";
import { useValidateTokenQuery } from "@/redux/api/auth";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/slices/userSlice";
import Cookies from "js-cookie";

/**
 * Компонент для автоматического восстановления данных пользователя
 * при загрузке страницы, если есть токен
 */
export function AuthInitializer() {
    const dispatch = useAppDispatch();
    const hasToken =
        typeof window !== "undefined" && !!Cookies.get("access_token");

    // Получаем текущее состояние пользователя из Redux
    const currentUser = useAppSelector((state) => state.user);
    
    // Флаг для предотвращения повторной загрузки
    const isInitialized = useRef(false);

    // 1. Приоритетная загрузка из localStorage (мгновенная, синхронная)
    useEffect(() => {
        // Загружаем только один раз при монтировании
        if (isInitialized.current || currentUser?.username) {
            return;
        }

        if (typeof window !== "undefined") {
            const savedState = localStorage.getItem("userState");
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    
                    // Проверяем актуальность данных (не старше 7 дней)
                    const timestamp = parsed._timestamp || 0;
                    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 дней
                    const isExpired = Date.now() - timestamp > maxAge;
                    
                    if (!isExpired && parsed?.username) {
                        const { _timestamp, ...userState } = parsed;
                        dispatch(setUser(userState));
                        console.log(
                            "📂 [AUTH_INIT] Restored from localStorage:",
                            userState
                        );
                        isInitialized.current = true;
                    } else if (isExpired) {
                        console.log("⚠️ [AUTH_INIT] localStorage data expired");
                        localStorage.removeItem("userState");
                    }
                } catch (error) {
                    console.error(
                        "❌ [AUTH_INIT] Failed to parse localStorage:",
                        error
                    );
                    localStorage.removeItem("userState");
                }
            }
        }
    }, []); // Запускаем только один раз

    // 2. Автоматически проверяем токен и восстанавливаем пользователя из API
    const { isLoading, isError, data } = useValidateTokenQuery(undefined, {
        skip: !hasToken, // Пропускаем запрос, если нет токена
        refetchOnMountOrArgChange: true, // Перезагружаем данные при каждом монтировании
    });

    useEffect(() => {
        if (isLoading) {
            console.log("🔄 [AUTH_INIT] Проверка токена через API...");
        } else if (isError) {
            console.log("❌ [AUTH_INIT] Токен невалиден");
        } else if (hasToken && data?.user) {
            console.log("✅ [AUTH_INIT] Пользователь восстановлен из API:", data.user);
            console.log("✅ [AUTH_INIT] Current Redux state:", currentUser);
        }
    }, [isLoading, isError, hasToken, data, currentUser]);

    return null; // Этот компонент ничего не рендерит
}
