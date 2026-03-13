"use client";

import React from "react";
import { useAppSelector } from "@/redux/hooks";
import style from "./ProtectedRoute.module.scss";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const userFromRedux = useAppSelector((state) => state.user);

    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className={style.loading}>Загрузка</div>;
    }

    if (!userFromRedux?.username) {
        return <div className={style.loading}>Загрузка</div>;
    }

    return <>{children}</>;
}