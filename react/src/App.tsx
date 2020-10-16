import React, { useState, useEffect } from 'react';

import LoginForm from './pages/Login';
import Navigation from './pages/Navigation';

export default function App() {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [username, setUsername] = useState("");
    const [lastLoginTime, setLastLoginTime] = useState("");

    async function signout() {
        const result = await fetch("/api/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "dummy": true })
        });
        if (result.ok) {
            setAuthenticated(false);
        }
    }
    // Check if already signed in
    useEffect(() => {
        (async () => {
            const result = await fetch("/api/login", { method: "POST" });
            if (result.ok) {
                const loginInfo = await result.json();
                setUsername(loginInfo.username);
                console.log(loginInfo.last_login)
                setLastLoginTime(loginInfo.last_login);
            }
            setAuthenticated(result.ok);
        })();
    }, []);
    if (authenticated === null) {
        return <></>;
    } else if (authenticated) {
        return <Navigation signout={signout} username={username} lastLoginTime={lastLoginTime}/>;
    } else {
        return <LoginForm setAuthenticated={setAuthenticated} setLastLoginTime={setLastLoginTime} setGlobalUsername={setUsername} />;
    }
}
