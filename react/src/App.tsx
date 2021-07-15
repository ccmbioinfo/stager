import React, { useEffect, useMemo, useState } from "react";
import { createMuiTheme, IconButton, ThemeProvider } from "@material-ui/core";
import { Close } from "@material-ui/icons";
import { SnackbarKey, SnackbarProvider } from "notistack";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import { APIInfoContext, emptyUser, UserClient, UserContext } from "./contexts";
import { clearQueryCache } from "./hooks/utils";
import LoginPage from "./Login";
import Navigation from "./Navigation";
import { APIInfo, CurrentUser } from "./typings";

const notistackRef = React.createRef<SnackbarProvider>();
const onClickDismiss = (key: SnackbarKey) => () => {
    notistackRef.current!.closeSnackbar(key);
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60, // 1 minute
        },
    },
});

function BaseApp(props: { darkMode: boolean; toggleDarkMode: () => void }) {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [apiInfo, setApiInfo] = useState<APIInfo | null>(null);

    // React Context needs the provider value to be a complete package in a state var
    // or else extra re-renders will happen apparently
    const [userClient, setUserClient] = useState<UserClient>({
        user: emptyUser,
        updateUser: (newUser: Partial<CurrentUser>) => {
            // Only groups can be changed
            setUserClient(oldClient => ({
                updateUser: oldClient.updateUser,
                user: { ...oldClient.user, groups: newUser.groups || oldClient.user.groups },
            }));
        },
    });

    const setCurrentUser = (user: CurrentUser) => {
        setUserClient(oldClient => ({
            updateUser: oldClient.updateUser,
            user: user,
        }));
    };

    async function signout() {
        let body = {};
        if (apiInfo?.oauth) {
            body = { redirect_uri: window.location.origin };
        }
        const result = await fetch("/api/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (result.ok) {
            clearQueryCache(queryClient, ["enums", "metadatasettypes"]);
            if (result.status !== 204) {
                const redirectUrl = (await result.json())?.["redirect_uri"];
                if (redirectUrl) {
                    console.log(redirectUrl);
                    window.location.replace(redirectUrl);
                    return;
                }
            }
            setAuthenticated(false);
        }
    }
    // Check if already signed in
    // Since both apiInfo and a loggedin status are required to render main app, we'll query both in sequence to prevent unnecessary rerenders/reroutes
    useEffect(() => {
        (async () => {
            const loginResult = await fetch("/api/login", { method: "POST" });
            if (loginResult.ok) {
                const loginInfo = await loginResult.json();
                setCurrentUser(loginInfo);
            }
            setAuthenticated(loginResult.ok);

            const apiInfoResult = await fetch("/api");
            if (apiInfoResult.ok) {
                const apiInfo = await apiInfoResult.json();
                setApiInfo(apiInfo as APIInfo);
            }
        })();
    }, []);
    if (authenticated && apiInfo) {
        return (
            <UserContext.Provider value={userClient}>
                <APIInfoContext.Provider value={apiInfo}>
                    <QueryClientProvider client={queryClient}>
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
                                darkMode={props.darkMode}
                                toggleDarkMode={props.toggleDarkMode}
                            />
                            <ReactQueryDevtools initialIsOpen={false} />
                        </SnackbarProvider>
                    </QueryClientProvider>
                </APIInfoContext.Provider>
            </UserContext.Provider>
        );
    } else if (apiInfo) {
        return (
            <LoginPage
                signout={signout}
                setAuthenticated={setAuthenticated}
                setCurrentUser={setCurrentUser}
                oauth={apiInfo.oauth}
            />
        );
    } else {
        return <></>;
    }
}

export default function App() {
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("darkMode") === null
            ? prefersDarkMode
            : localStorage.getItem("darkMode") === "true"
    );

    useEffect(() => {
        if (process.env.NODE_ENV === "production") {
            console.log(`Latest Commit: ${process.env.REACT_APP_GIT_SHA}`);
        }
    }, []);

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
