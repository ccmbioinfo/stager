import React from "react";

/**
 * Displays a boolean or null value in a user-readable manner.
 * Specifically used for the render prop for Material-Table columns.
 */
export default function BooleanDisplay<T extends object>(props: {
    value: T | boolean | null | undefined;
    fieldName: keyof T;
    type: "row" | "group";
}) {
    let displayValue;
    let switchValue;

    if (props.type === "row") {
        switchValue = (props.value as T)[props.fieldName];
    } else {
        switchValue = props.value;
    }

    switch (switchValue) {
        case true:
            displayValue = "Yes";
            break;
        case false:
            displayValue = "No";
            break;
        case null:
            displayValue = "Unknown";
            break;
        default:
            displayValue = "Not specified";
            break;
    }

    return (
        <>
            <b>{displayValue}</b> ({"" + switchValue})
        </>
    );
}
