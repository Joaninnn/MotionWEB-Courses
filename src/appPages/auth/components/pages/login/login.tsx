// src/appPages/auth/components/pages/login/login.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/redux/api/auth";
import { useAppSelector } from "@/redux/hooks";
import Cookies from "js-cookie";
import style from "./login.module.scss";

interface ErrorResponse {
    status?: number | string;
    data?: {
        detail?: string;
    };
}

export default function Login() {
    const router = useRouter();
    const [login, { isLoading }] = useLoginMutation();

    const userFromRedux = useAppSelector((state) => state.user);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Проверяем авторизацию при загрузке
    useEffect(() => {
        const hasToken = !!Cookies.get("access_token");

        // Если пользователь уже залогинен - редиректим на /home
        if (hasToken && userFromRedux?.username) {
            console.log(
                "✅ [LOGIN] User already logged in, redirecting to /home"
            );
            router.replace("/home");
        }
    }, [router, userFromRedux]);

    const handleLogin = async () => {
        if (!username || !password) {
            setErrorMessage("Введите логин и пароль");
            return;
        }

        setErrorMessage(""); // Очищаем предыдущие ошибки

        try {
            console.log("🔐 [LOGIN] Попытка входа для:", username);

            const result = await login({ username, password }).unwrap();

            console.log("✅ [LOGIN] Успешный вход!");
            console.log("   User:", result.user.username);

            // Проверяем что токены сохранились
            const hasToken = !!Cookies.get("access_token");
            console.log("🔑 [LOGIN] Токен сохранён:", hasToken);

            if (!hasToken) {
                console.error("❌ [LOGIN] ОШИБКА: Токен не сохранился!");
                setErrorMessage("Ошибка сохранения токена");
                return;
            }

            console.log("➡️ [LOGIN] Редирект на /home");
            router.push("/home");
        } catch (err) {
            // RTK Query возвращает ошибку в формате { status, data }
            const error = err as ErrorResponse;
            const status = error?.status;
            const errorData = error?.data;

            console.log("❌ [LOGIN] Ошибка:", { status, errorData });

            // Приоритет: сообщение от сервера -> статус -> общая ошибка
            if (errorData?.detail) {
                // Используем сообщение от сервера (например, "Неверные учетные данные")
                setErrorMessage(errorData.detail);
            } else if (status === 401 || status === 400) {
                setErrorMessage("Неверный логин или пароль");
            } else if (status === 500) {
                setErrorMessage("Ошибка сервера. Попробуйте позже");
            } else if (status === "FETCH_ERROR") {
                setErrorMessage("Ошибка подключения к серверу");
            } else {
                setErrorMessage("Произошла ошибка. Попробуйте снова");
            }
        }
    };

    return (
        <section className={style.login}>
            <div className={style.content}>
                <div className={style.form}>
                    <h2 className={style.title}>ВХОД В СИСТЕМУ</h2>

                    {errorMessage && (
                        <div className={style.errorMessage}>{errorMessage}</div>
                    )}

                    <div className={style.Block}>
                        <h2 className={style.Text}>ЛОГИН</h2>
                        <input
                            className={style.input}
                            placeholder="Введите логин"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className={style.Block}>
                        <h2 className={style.Text}>ПАРОЛЬ</h2>
                        <div className={style.passwordInputWrapper}>
                            <input
                                className={style.input}
                                placeholder="Введите пароль"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && !isLoading && handleLogin()
                                }
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className={style.passwordToggle}
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                            >
                                {showPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                    </div>

                    <button
                        className={style.button}
                        type="button"
                        onClick={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? "ВХОД..." : "ВОЙТИ"}
                    </button>
                </div>
            </div>
        </section>
    );
}
