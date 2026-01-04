"use client";
import React from "react";

import style from "./login.module.scss";

export default function Login() {
    return (
        <section className={style.login}>
            <div className={style.content}>
                <div className={style.form}>
                    <h2 className={style.title}>ВХОД В СИСТЕМУ</h2>
                    <div className={style.Block}>
                        <h2 className={style.Text}>ЛОГИН</h2>
                        <input
                            className={style.input}
                            placeholder="Введите логин"
                            type="text"
                        />
                    </div>
                    <div className={style.Block}>
                        {" "}
                        <h2 className={style.Text}>ПАРОЛЬ</h2>
                        <input
                            className={style.input}
                            placeholder="Введите пароль"
                            type="text"
                        />
                    </div>
                    <button className={style.button}>ВОЙТИ</button>
                </div>
            </div>
        </section>
    );
}
