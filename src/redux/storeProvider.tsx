// src/redux/storeProvider.tsx
"use client";

import { useMemo } from "react";
import { Provider } from "react-redux";
import { makeStoreWithMiddleware, AppStore } from "./store";
import { AuthInitializer } from "@/components/AuthInitializer";

export default function StoreProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    // Используем useMemo для гарантии единственного экземпляра store
    const store = useMemo(() => {
        const newStore = makeStoreWithMiddleware();
        console.log("🏪 [STORE_PROVIDER] Store created with initial state");
        return newStore;
    }, []);

    return (
        <Provider store={store}>
            <AuthInitializer />
            {children}
        </Provider>
    );
}
