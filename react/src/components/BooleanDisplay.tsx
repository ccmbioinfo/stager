import React, { useEffect, useState } from "react";
import { PseudoBoolean, PseudoBooleanReadableMap } from "../typings";

/**
 * Displays a PseudoBoolean value in a user-readable manner.
 * Specifically used for the render prop for Material-Table columns.
 */
export default function BooleanDisplay(props: {
    value: any | PseudoBoolean;
    fieldName: any;
    type: "row" | "group";
}) {
    const [value, setValue] = useState<string>("");

    useEffect(() => {
        const switchValue: PseudoBoolean =
            props.type === "row" ? (props.value as any)[props.fieldName] : props.value;

        setValue(PseudoBooleanReadableMap[switchValue]);
    }, [props.type, props.value, props.fieldName]);

    return <>{value}</>;
}
