"use client";

import { useMemo } from "react";
import { Provider } from "react-redux";
import { makeStoreWithMiddleware } from "./store";
import { AuthInitializer } from "@/components/AuthInitializer";

export default function StoreProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const store = useMemo(() => {
        const newStore = makeStoreWithMiddleware();
        return newStore;
    }, []);


    return (
        <Provider store={store}>
            <AuthInitializer />
            {children}
        </Provider>
    );
}
