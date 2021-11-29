import React, { useEffect, useMemo, useState } from "react";
import { createTheme, IconButton, ThemeProvider } from "@material-ui/core";
import { Close } from "@material-ui/icons";
import { SnackbarKey, SnackbarProvider } from "notistack";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import { APIInfoContext, emptyUser, UserClient, UserContext } from "./contexts";
import { apiFetch, clearQueryCache } from "./hooks/utils";
import LoginPage from "./Login";
import Navigation from "./Navigation";
import { APIInfo, CurrentUser, LabSelection } from "./typings";

const notistackRef = React.createRef<SnackbarProvider>();
const onClickDismiss = (key: SnackbarKey) => () => {
    notistackRef.current!.closeSnackbar(key);
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60, // 1 minute
            refetchOnWindowFocus: false,
        },
    },
});

function BaseApp(props: { darkMode: boolean; toggleDarkMode: () => void }) {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [apiInfo, setApiInfo] = useState<APIInfo | null>(null);
    const [availableEndpoints, setAvailableEndpoints] = useState<LabSelection[]>([]);

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
        const result = await apiFetch(`/api/logout`, {
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
            const loginResult = await apiFetch(`/api/login`, { method: "POST" });
            if (loginResult.ok) {
                const loginInfo = await loginResult.json();
                setCurrentUser(loginInfo);
            }
            setAuthenticated(loginResult.ok);

            let endpoints: LabSelection[] = [];
            /* const availibleEndpoints = await fetch("/labs.json");
            if (availibleEndpoints.ok) {
                endpoints = await availibleEndpoints.json();
            } */

            if (endpoints.length > 0) {
                setAvailableEndpoints(endpoints);
                return;
            }
            localStorage.removeItem("endpoint");

            fetchAPIInfo();
        })();
    }, []);

    const fetchAPIInfo = async () => {
        const apiInfoResult = await apiFetch(`/api`);
        if (apiInfoResult.ok) {
            let apiInfo = { ...(await apiInfoResult.json()) };
            setApiInfo(apiInfo as APIInfo);
        }
    };

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
                            hideIconVariant={true}
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
    } else if (apiInfo || availableEndpoints.length > 0) {
        return (
            <LoginPage
                signout={signout}
                setAuthenticated={setAuthenticated}
                setCurrentUser={setCurrentUser}
                onEndpointSelected={fetchAPIInfo}
                oauth={apiInfo ? apiInfo.oauth : false}
                labs={availableEndpoints}
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
            createTheme({
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
