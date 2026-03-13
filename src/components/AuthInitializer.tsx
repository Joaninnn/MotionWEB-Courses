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

        if (hasToken && !currentUser?.username) {
            const storedUser = sessionStorage.getItem("userState");
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    const { _timestamp, ...userData } = parsedUser;
                    
                    dispatch(setUser(userData));
                } catch (error) {
                    sessionStorage.removeItem("userState");
                    Cookies.remove("access_token");
                    Cookies.remove("refresh_token");
                    dispatch(clearUser());
                    router.replace("/login");
                }
            } else {
                Cookies.remove("access_token");
                Cookies.remove("refresh_token");
                dispatch(clearUser());
                router.replace("/login");
            }
        }

        if (!hasToken && currentUser?.username) {
            dispatch(clearUser());
            sessionStorage.removeItem("userState");
        }
    }, [isMounted, hasToken, currentUser, router, dispatch]);

    return null;
}