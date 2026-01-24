// src/components/ProtectedRoute.tsx
"use client";

import React from "react";
import { useAppSelector } from "@/redux/hooks";
import style from "./ProtectedRoute.module.scss";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const userFromRedux = useAppSelector((state) => state.user);

    // Используем useState с начальным значением false для client-side рендеринга
    // Это гарантирует что на сервере и на первом рендере клиента будет одинаковое состояние
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // Пока компонент не смонтировался, показываем загрузку
    if (!isMounted) {
        return <div className={style.loading}>Загрузка</div>;
    }

    // На клиенте показываем контент если есть данные пользователя
    // Иначе показываем загрузку (AuthInitializer разберется с редиректом)
    if (!userFromRedux?.username) {
        return <div className={style.loading}>Загрузка</div>;
    }

    // Все проверки пройдены - показываем контент
    return <>{children}</>;
}