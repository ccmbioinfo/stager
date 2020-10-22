import React, { useState, useEffect } from 'react';
import { IconButton } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { SnackbarKey, SnackbarProvider } from 'notistack';
import { createMuiTheme, ThemeProvider } from '@material-ui/core';

import LoginForm from './pages/Login';
import Navigation from './pages/Navigation';

const notistackRef = React.createRef<SnackbarProvider>();
const onClickDismiss = (key: SnackbarKey) => () => {
    notistackRef.current!.closeSnackbar(key);
}

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
                setLastLoginTime(loginInfo.last_login);
            }
            setAuthenticated(result.ok);
        })();
    }, []);
    if (authenticated === null) {
        return <></>;
    } else if (authenticated) {
        return (
            <SnackbarProvider
                ref={notistackRef}
                action={(key) => (
                    <IconButton aria-label="close" color="inherit" onClick={onClickDismiss(key)}>
                        <Close fontSize="small" />
                    </IconButton>
                )}
                autoHideDuration={6000}
            >
                <Navigation signout={signout} username={username} lastLoginTime={lastLoginTime} />
            </SnackbarProvider>
        );
    } else {
        return <LoginForm setAuthenticated={setAuthenticated} setLastLoginTime={setLastLoginTime} setGlobalUsername={setUsername} />;
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
