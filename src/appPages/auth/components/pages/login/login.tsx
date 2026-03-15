"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/redux/api/auth";
import { useAppSelector } from "@/redux/hooks";
import Cookies from "js-cookie";
import style from "./login.module.scss";



export default function Login() {
    const router = useRouter();
    const [login, { isLoading }] = useLoginMutation();

    const userFromRedux = useAppSelector((state) => state.user);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState({ username: false, password: false });

    useEffect(() => {
        const hasToken = !!Cookies.get("access_token");

        if (hasToken && userFromRedux?.username) {
            
            router.replace("/home");
        }
    }, [router, userFromRedux]);

    const handleLogin = async () => {
        if (!username || !password) {
            setErrorMessage("Введите логин и пароль");
            setFieldErrors({ username: !username, password: !password });
            return;
        }

        setErrorMessage("");
        setFieldErrors({ username: false, password: false });

        try {
            const result = await login({ username, password }).unwrap();

            const hasToken = !!Cookies.get("access_token");

            if (!hasToken) {
                return;
            }

            router.push("/home");
        } catch (err: unknown) {
            // Улучшенная обработка ошибок для RTK Query
            setFieldErrors({ username: true, password: true });

            // RTK Query ошибки имеют структуру {status, data}
            let errorMsg = 'Неверный логин или пароль';

            if (err && typeof err === 'object' && 'status' in err) {
                const errorStatus = (err as { status?: number }).status;
                const errorData = (err as { data?: { message?: string; error?: string } }).data;

                if (errorStatus === 401) {
                    errorMsg = 'Неверные учетные данные';
                } else if (errorStatus === 429) {
                    errorMsg = 'Слишком много попыток. Попробуйте позже';
                } else if (errorStatus === 500) {
                    errorMsg = 'Ошибка сервера. Попробуйте позже';
                } else if (errorData?.message) {
                    errorMsg = errorData.message;
                } else if (errorData?.error) {
                    errorMsg = errorData.error;
                }
            } else if (err && typeof err === 'object' && 'message' in err) {
                errorMsg = (err as { message?: string }).message || 'Ошибка авторизации';
            } else if (err && typeof err === 'string') {
                errorMsg = err;
            }

            setErrorMessage(errorMsg);
        }
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
        setFieldErrors(prev => ({ ...prev, username: false }));
        if (errorMessage) setErrorMessage("");
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        setFieldErrors(prev => ({ ...prev, password: false }));
        if (errorMessage) setErrorMessage("");
    };

    return (
        <section className={style.login}>
            <div className={style.content}>
                <div className={style.form}>
                    <h2 className={style.title}>ВХОД В СИСТЕМУ</h2>

                    {errorMessage && (
                        <div className={style.error}>{errorMessage}</div>
                    )}

                    <div className={style.Block}>
                        <h2 className={style.Text}>ЛОГИН</h2>
                        <input
                            className={`${style.input} ${fieldErrors.username ? style.error : ''}`}
                            placeholder="Введите логин"
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            disabled={isLoading}
                        />
                    </div>

                    <div className={style.Block}>
                        <h2 className={style.Text}>ПАРОЛЬ</h2>
                        <div className={style.passwordInputWrapper}>
                            <input
                                className={`${style.input} ${fieldErrors.password ? style.error : ''}`}
                                placeholder="Введите пароль"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={handlePasswordChange}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && !isLoading && handleLogin()
                                }
                                disabled={isLoading}
                            />
                            <button
                            style={{width:"35px", color:'black'}}
                                type="button"
                                className={style.passwordToggle}
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                            >
                                {showPassword ? "✕" : "👁️‍🗨️"}
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
