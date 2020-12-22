import React, { useState, useEffect, useMemo } from "react";
import { IconButton, createMuiTheme, ThemeProvider } from "@material-ui/core";
import { Close } from "@material-ui/icons";
import { SnackbarKey, SnackbarProvider } from "notistack";

import LoginForm from "./Login";
import Navigation from "./Navigation";
import { EnumProvider } from "./contexts/EnumProvider";

const notistackRef = React.createRef<SnackbarProvider>();
const onClickDismiss = (key: SnackbarKey) => () => {
    notistackRef.current!.closeSnackbar(key);
};

function BaseApp(props: { darkMode: boolean; toggleDarkMode: () => void }) {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [username, setUsername] = useState("");
    const [lastLoginTime, setLastLoginTime] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);

    async function signout() {
        const result = await fetch("/api/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dummy: true }),
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
                setIsAdmin(loginInfo.is_admin);
            }
            setAuthenticated(result.ok);
        })();
    }, []);
    if (authenticated === null) {
        return <></>;
    } else if (authenticated) {
        return (
            <EnumProvider>
                <SnackbarProvider
                    ref={notistackRef}
                    action={key => (
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            onClick={onClickDismiss(key)}
                        >
                            <Close fontSize="small" />
                        </IconButton>
                    )}
                    autoHideDuration={6000}
                    anchorOrigin={{
                        horizontal: "center",
                        vertical: "bottom",
                    }}
                >
                    <Navigation
                        signout={signout}
                        username={username}
                        lastLoginTime={lastLoginTime}
                        darkMode={props.darkMode}
                        toggleDarkMode={props.toggleDarkMode}
                        isAdmin={isAdmin}
                    />
                </SnackbarProvider>
            </EnumProvider>
        );
    } else {
        return (
            <LoginForm
                setAuthenticated={setAuthenticated}
                setLastLoginTime={setLastLoginTime}
                setGlobalUsername={setUsername}
                setIsAdmin={setIsAdmin}
            />
        );
    }
}

export default function App() {
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("darkMode") === null
            ? prefersDarkMode
            : localStorage.getItem("darkMode") === "true"
    );
    const globalTheme = useMemo(
        () =>
            createMuiTheme({
                typography: {
                    fontSize: 12,
                },
                mixins: {
                    toolbar: {
                        minHeight: 48,
                    },
                },
                palette: {
                    type: darkMode ? "dark" : "light",
                    background: {
                        default: darkMode ? "#2A2A2B" : "#fafafa",
                    },
                },
                overrides: {
                    MuiFilledInput: {
                        input: {
                            "&:-webkit-autofill": {
                                WebkitBoxShadow: `0 0 0 100px ${
                                    darkMode ? "#565656" : "transparent"
                                } inset`,
                                WebkitTextFillColor: darkMode ? "#fff" : "#000",
                            },
                        },
                    },
                    MuiFormLabel: darkMode
                        ? {
                              root: {
                                  "&$focused": {
                                      color: "#fff",
                                  },
                              },
                          }
                        : {},
                },
            }),
        [darkMode]
    );

    return (
        <React.StrictMode>
            <ThemeProvider theme={globalTheme}>
                <BaseApp
                    darkMode={darkMode}
                    toggleDarkMode={() => {
                        localStorage.setItem("darkMode", String(!darkMode));
                        setDarkMode(!darkMode);
                    }}
                />
            </ThemeProvider>
        </React.StrictMode>
    );
}
