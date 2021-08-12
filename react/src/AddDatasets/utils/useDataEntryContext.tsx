import React, { useContext } from "react";
import { DataEntryClient } from "./useDataEntryClient";

export const DataEntryContext = React.createContext<DataEntryClient>({});

/**
 * Return the data entry client.
 */
export function useDataEntryContext() {
    return useContext(DataEntryContext);
}
