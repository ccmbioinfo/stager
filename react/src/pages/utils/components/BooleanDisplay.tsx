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
        let switchValue: PseudoBoolean;

        if (props.type === "row") {
            switchValue = (props.value as any)[props.fieldName];
        } else {
            switchValue = props.value;
        }

        setValue(PseudoBooleanReadableMap[switchValue]);
    }, [props.type, props.value, props.fieldName]);

    return (
        <>
            <b>{value}</b>
        </>
    );
}
