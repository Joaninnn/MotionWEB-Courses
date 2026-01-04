import React from "react";
import style from "./chat.module.scss";

function Chat() {
    return (
        <section className={style.chat}>
            <div className="container">
                <div className={style.content}>
                    <div className={style.groups}>
                        <div className={style.groupsName}>chat</div>
                        <div className={style.chatName}></div>
                    </div>
                    <div className={style.activeChat}></div>
                </div>
            </div>
        </section>
    );
}

export default Chat;
