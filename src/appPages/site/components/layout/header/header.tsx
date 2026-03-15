"use client";

import style from "./Header.module.scss";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ProfileIcon from "@/assets/Icons/profile.jpg";
import Logo from "@/assets/Icons/Logo.svg";
import { useLogoutMutation } from "@/redux/api/auth";
import { useAppSelector } from "@/redux/hooks";
import Cookies from "js-cookie";
import { navigateToHome } from "@/utils/navigation";

interface LinkItem {
    name: string;
    href: string;
    mentorOnly?: boolean;
}

const Links: LinkItem[] = [
    {
        name: "Уроки",
        href: "/lessons",
    },
    {
        name: "Чат",
        href: "/chat",
    },
    {
        name: "Видео",
        href: "/mentor",
        mentorOnly: true, }
];

const Header: React.FC = () => {
    const router = useRouter();
    const [logout] = useLogoutMutation();
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === 'undefined') return; 
        
        if (isMenuOpen) {
            setShowProfileMenu(false);
            
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = `-${window.scrollY}px`;
        } else {
            const scrollY = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
            
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
            }
        }

        return () => {
            if (typeof window === 'undefined') return;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
        };
    }, [isMenuOpen]);

    const currentUser = useAppSelector((state) => state.user);

    const hasToken =
        typeof window !== "undefined" && !!Cookies.get("access_token");

    const isAuthenticated = hasToken && !!currentUser?.username;

    if (typeof window !== "undefined") {
        const localStorageData = localStorage.getItem("userState");
        if (localStorageData) {
            try {
                const parsed = JSON.parse(localStorageData);
            } catch (e) {
            }
        }
    }

    const handleProfileClick = (): void => {
        if (isMenuOpen) {
            return;
        }
        
        if (isAuthenticated) {
            setShowProfileMenu(!showProfileMenu);
        } else {
            router.push("/login");
        }
    };

    const handleLogout = async (): Promise<void> => {
        try {
            await logout().unwrap();
        } catch (error) {
        } finally {
            setShowProfileMenu(false);
            setTimeout(() => {
                router.push("/login");
            }, 100);
        }
    };

    const toggleMenu = (): void => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className={style.header}>
            <div className="container">
                <div className={style.content}>
                    <div
                        onClick={() => navigateToHome(router)}
                        className={style.logoButton}
                    >
                        <Image className={style.logo} src={Logo} alt="Logo" />
                        <div className={style.logoTextBlock}>
                            <span className={style.logoText1}>Motion</span>
                            <span className={style.logoText2}>Web</span>
                        </div>
                    </div>

                    <div className={style.navs}>
                        {Links.filter((link) => {
                            if (link.mentorOnly) {
                                const isMentor = currentUser?.status === "mentor";
                                return isMentor;
                            }
                            return true;
                        }).map((link) => (
                            <a
                                key={link.name}
                                className={style.nav}
                                href={link.href}
                            >
                                {link.name}
                            </a>
                        ))}
                    </div>

                    <div className={style.rightBlock}>
                        <div className={style.profileWrapper}>
                            <button
                                onClick={handleProfileClick}
                                className={`${style.buttonBlock} ${isMenuOpen ? style.disabled : ''}`}
                                disabled={isMenuOpen}
                            >
                                <Image
                                    className={style.profile}
                                    src={ProfileIcon}
                                    alt="profile"
                                />
                                {isAuthenticated && currentUser && (
                                    <span className={style.username}>
                                        {currentUser.username}
                                    </span>
                                )}
                                {!isAuthenticated && (
                                    <span className={style.username}>
                                        Войти
                                    </span>
                                )}
                            </button>

                            {isAuthenticated &&
                                showProfileMenu &&
                                currentUser && (
                                    <div className={`${style.profileMenu} ${showProfileMenu ? style.active : ''}`}>
                                        <div className={style.profileInfo}>
                                            <p className={style.profileName}>
                                                {currentUser.username}
                                            </p>
                                            <p className={style.profileStatus}>
                                                {currentUser?.status === "mentor" ? "Ментор" : "Студент"}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className={style.logoutButton}
                                        >
                                            Выйти
                                        </button>
                                    </div>
                                )}
                        </div>

                        <button
                            onClick={toggleMenu}
                            className={style.burgerButton}
                            aria-label="Toggle menu"
                        >
                            <span
                                className={`${style.burgerLine} ${
                                    isMenuOpen ? style.open : ""
                                }`}
                            ></span>
                            <span
                                className={`${style.burgerLine} ${
                                    isMenuOpen ? style.open : ""
                                }`}
                            ></span>
                            <span
                                className={`${style.burgerLine} ${
                                    isMenuOpen ? style.open : ""
                                }`}
                            ></span>
                        </button>
                    </div>

                    {isMenuOpen && (
                        <div 
                            className={style.menuOverlay}
                            onClick={() => setIsMenuOpen(false)}
                        />
                    )}

                    <nav
                        className={`${style.mobileMenu} ${
                            isMenuOpen ? style.active : ""
                        }`}
                    >
                        {Links.filter((link) => {
                            if (link.mentorOnly) {
                                return currentUser?.status === "mentor";
                            }
                            return true;
                        }).map((link) => (
                            <a
                                key={link.name}
                                className={style.mobileNav}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.name}
                            </a>
                        ))}
                        {isAuthenticated && (
                            <button
                                onClick={handleLogout}
                                className={style.mobileLogout}
                            >
                                Выйти
                            </button>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
