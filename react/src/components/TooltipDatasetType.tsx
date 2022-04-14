import React from "react";
import { Tooltip } from "@material-ui/core";
import { useAPIInfoContext } from "../contexts";

export interface TooltipDatasetTypeProps {
    dataset_type: string;
    children: React.ReactElement<any, any>;
}

export default function TooltipDatasetType({ dataset_type, children }: TooltipDatasetTypeProps) {
    const apiInfo = useAPIInfoContext() ?? undefined;
    return (
        <Tooltip title={apiInfo?.dataset_types[dataset_type].name || " "} arrow placement="top">
            {children}
        </Tooltip>
    );
}
