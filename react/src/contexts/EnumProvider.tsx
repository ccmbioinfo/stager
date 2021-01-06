import React, { useEffect, useState } from "react";
import { KeyValue } from "../typings";
import EnumContext from "./EnumContext";

export function EnumProvider(props: { children: React.ReactNode }) {
    // The enum cache is a react state kept here
    const [enums, setEnums] = useState<KeyValue>();

    useEffect(() => {
        fetch("/api/enums").then(async response => {
            if (response.ok) {
                const data = await response.json();
                setEnums(data as KeyValue);
            } else {
                console.error(
                    `GET /api/enums failed with ${response.status}: ${response.statusText}`
                );
            }
        });
    }, []);

    return <EnumContext.Provider value={enums}>{props.children}</EnumContext.Provider>;
}
