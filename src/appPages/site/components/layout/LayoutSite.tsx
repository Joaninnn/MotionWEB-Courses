"use client";

import { FC, ReactNode } from "react";
import scss from "./LayoutSite.module.scss";
import Header from "./header/header";
import Footer from "./footer/footer";
import { usePathname } from "next/navigation";

interface LayoutSiteProps {
    children: ReactNode;
}

const LayoutSite: FC<LayoutSiteProps> = ({ children }) => {
    const pathname = usePathname();
    const isChatPage = pathname?.startsWith("/chat");

    return (
        <div className={scss.LayoutSite}>
            <Header />
            <main>{children}</main>
            {!isChatPage && <Footer />}
        </div>
    );
};

export default LayoutSite;
