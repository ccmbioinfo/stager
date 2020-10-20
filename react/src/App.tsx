import React, { useState, useEffect } from 'react';
import { createMuiTheme, ThemeProvider } from '@material-ui/core';

import LoginForm from './pages/Login';
import Navigation from './pages/Navigation';

const globalTheme = createMuiTheme({
    typography: {
        fontSize: 12
    },
    mixins: {
        toolbar: {
            minHeight: 48
        }
    }
});

function BaseApp() {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [username, setUsername] = useState("");
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
                setUsername((await result.json()).username);
            }
            setAuthenticated(result.ok);
        })();
    }, []);
    if (authenticated === null) {
        return <></>;
    } else if (authenticated) {
        return <Navigation signout={signout} username={username} />;
    } else {
        return <LoginForm setAuthenticated={setAuthenticated} setGlobalUsername={setUsername} />;
    }
}

export default function App() {
    return (
        <React.StrictMode>
            <ThemeProvider theme={globalTheme}>
                <BaseApp />
            </ThemeProvider>
        </React.StrictMode>
    );
}
