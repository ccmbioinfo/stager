import React, { useState, useEffect } from 'react';

import LoginForm from './pages/Login';
import Navigation from './pages/Navigation';

export default function App() {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
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
        fetch("/api/login", { method: "POST" }).then(result => setAuthenticated(result.ok));
    }, []);
    if (authenticated === null) {
        return <></>;
    } else if (authenticated) {
        return <Navigation signout={signout} />;
    } else {
        return <LoginForm setAuthenticated={setAuthenticated} />;
    }
}
