import { Typography } from "@material-ui/core";
import { TooltipDatasetType } from ".";
import { formatDisplayValue } from "../functions";
import { Field } from "../typings";

export interface FieldDisplayProps {
    field: Field;
}

/* Simple Typography component to display "title: value" */
export default function FieldDisplay({ field }: FieldDisplayProps) {
    return (
        <Typography variant="body1" gutterBottom>
            <b>{field.title}:</b>{" "}
            {field.title === "Dataset Type" && typeof field.value === "string" ? (
                <TooltipDatasetType dataset_type={field.value}>
                    <span>{formatDisplayValue(field)}</span>
                </TooltipDatasetType>
            ) : (
                <span>{formatDisplayValue(field)}</span>
            )}
        </Typography>
    );
}
