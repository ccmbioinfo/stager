import React, { useState, useEffect } from "react";
import { IconButton, createMuiTheme, ThemeProvider } from "@material-ui/core";
import { Close } from "@material-ui/icons";
import { SnackbarKey, SnackbarProvider } from "notistack";

import LoginForm from "./pages/Login";
import Navigation from "./pages/Navigation";

const notistackRef = React.createRef<SnackbarProvider>();
const onClickDismiss = (key: SnackbarKey) => () => {
    notistackRef.current!.closeSnackbar(key);
};

function BaseApp(props: { darkMode: boolean; toggleDarkMode: () => void }) {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [username, setUsername] = useState("");
    const [lastLoginTime, setLastLoginTime] = useState("");

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
                action={key => (
                    <IconButton aria-label="close" color="inherit" onClick={onClickDismiss(key)}>
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
                />
            </SnackbarProvider>
        );
    } else {
        return (
            <LoginForm
                setAuthenticated={setAuthenticated}
                setLastLoginTime={setLastLoginTime}
                setGlobalUsername={setUsername}
            />
        );
    }
}

export default function App() {
    const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
    const globalTheme = createMuiTheme({
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
    });

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
