// src/components/ProtectedRoute.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import Cookies from "js-cookie";
import style from "./ProtectedRoute.module.scss";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    // Получаем пользователя из Redux
    const userFromRedux = useAppSelector((state) => state.user);

    // Проверяем наличие токена только на клиенте
    const hasToken = isClient ? !!Cookies.get("access_token") : false;

    // Устанавливаем флаг клиента при монтировании
    useEffect(() => {
        setIsClient(true);
    }, []);

    console.log("🔍 [PROTECTED_ROUTE] State:", {
        isClient,
        hasToken,
        username: userFromRedux?.username,
        status: userFromRedux?.status,
        course: userFromRedux?.course,
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'server',
    });

    // Пользователь аутентифицирован, если есть токен и данные в Redux
    const isAuthenticated = hasToken && !!userFromRedux?.username;

    useEffect(() => {
        if (!isClient) return; // Не выполняем логику на сервере

        // Если нет токена - сразу редиректим
        if (!hasToken) {
            console.log("❌ No token found, redirecting to /login");
            router.replace("/login");
            return;
        }

        // Если есть токен но нет данных в Redux - возможна проблема с localStorage
        if (hasToken && !userFromRedux?.username) {
            console.log("⚠️ Token exists but no user data in Redux - possible localStorage issue");
            // Можно добавить принудительное восстановление или очистку
        }

        // Если все в порядке
        if (isAuthenticated) {
            console.log("✅ User authenticated:", userFromRedux.username);
        }
    }, [isClient, hasToken, userFromRedux, isAuthenticated, router]);

    // На сервере всегда показываем загрузку
    if (!isClient) {
        return <div className={style.loading}>Загрузка</div>;
    }

    // Показываем загрузку если нет токена
    if (!hasToken) {
        return <div className={style.loading}>Загрузка</div>;
    }

    // Если есть токен но нет данных - показываем загрузку
    if (hasToken && !userFromRedux?.username) {
        return <div className={style.loading}>Загрузка</div>;
    }

    // Токен есть и данные есть - показываем контент
    return <>{children}</>;
}
