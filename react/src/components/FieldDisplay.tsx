import { Tooltip, Typography } from "@material-ui/core";
import { useAPIInfoContext } from "../contexts";
import { formatDisplayValue } from "../functions";
import { Field } from "../typings";
export interface FieldDisplayProps {
    field: Field;
}

/* Simple Typography component to display "title: value" */
export default function FieldDisplay({ field }: FieldDisplayProps) {
    const apiInfo = useAPIInfoContext() ?? undefined;
    return (
        <Typography variant="body1" gutterBottom>
            <b>{field.title}:</b>{" "}
            {field.title === "Dataset Type" && typeof field.value === "string" ? (
                <Tooltip
                    title={apiInfo?.dataset_types[field.value].name || " "}
                    arrow
                    placement="top"
                >
                    <span>{field.value}</span>
                </Tooltip>
            ) : (
                <span>{formatDisplayValue(field)}</span>
            )}
        </Typography>
    );
}
