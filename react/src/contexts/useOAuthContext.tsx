import React, { useContext } from "react";

export const OAuthContext = React.createContext<boolean>(false);

/**
 * Return context object for determining whether OAuth support is enabled.
 */
export function useOAuthContext() {
    return useContext(OAuthContext);
}
