import React, { useContext } from "react";

export const FetchContext = React.createContext("");

export function useFetchContext() {
    return useContext(FetchContext);
}
