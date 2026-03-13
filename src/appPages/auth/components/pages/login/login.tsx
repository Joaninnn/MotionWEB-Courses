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

    useEffect(() => {
        const hasToken = !!Cookies.get("access_token");

        if (hasToken && userFromRedux?.username) {
            
            router.replace("/home");
        }
    }, [router, userFromRedux]);

    const handleLogin = async () => {
        if (!username || !password) {
            setErrorMessage("Введите логин и пароль");
            return;
        }

        setErrorMessage(""); 

        try {

            const result = await login({ username, password }).unwrap();

            const hasToken = !!Cookies.get("access_token");

            if (!hasToken) {
            
                return;
            }

            router.push("/home");
        } catch (err) {
            
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
