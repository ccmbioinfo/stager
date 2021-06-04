import React, { useContext } from "react";
import { APIInfo } from "../typings";

export const APIInfoContext = React.createContext<APIInfo | null>(null);

/**
 * Return context object for determining whether OAuth support is enabled.
 */
export function useAPIInfoContext() {
    return useContext(APIInfoContext);
}
