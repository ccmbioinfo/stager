import React from "react";
import { Typography } from "@material-ui/core";

export default function Title(props: { children: React.ReactNode }) {
    return (
        <Typography variant="button" display="block" gutterBottom color="primary">
            {props.children}
        </Typography>
    );
}
