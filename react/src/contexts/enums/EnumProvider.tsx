import React, { useEffect, useState } from "react";
import EnumContext from "./EnumContext";

/**
 * Allows child components to call the 'useEnums' hook.
 */
export default function EnumProvider(props: { children: React.ReactNode }) {
    const [enums, setEnums] = useState<any>();

    useEffect(() => {
        const enumStored = sessionStorage.getItem("enums");
        if (enumStored) {
            // hit, no fetch
            setEnums(JSON.parse(enumStored));
        } else {
            // miss, refetch
            fetch("/api/enums").then(async response => {
                if (response.ok) {
                    const data = await response.json();
                    sessionStorage.setItem("enums", JSON.stringify(data));
                    setEnums(data);
                } else {
                    console.error(
                        `GET /api/enums failed with response ${response.status} - ${response.statusText}`
                    );
                }
            });
        }
    }, []);

    return <EnumContext.Provider value={enums}>{props.children}</EnumContext.Provider>;
}
