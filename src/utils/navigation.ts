"use client";

import { useRouter } from "next/navigation";

export const navigateToHome = (router?: ReturnType<typeof useRouter>): void => {
    if (typeof window === "undefined") return;
    
    if (!router) {
        if (window.location.pathname === "/home") {
            window.location.reload();
        } else {
            window.location.href = "/home";
        }
        return;
    }
    
    if (window.location.pathname === "/home") {
        window.location.reload();
    } else {
        router.push("/home");
    }
};
