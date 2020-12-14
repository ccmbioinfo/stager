import React from "react";
import { Typography, TypographyProps } from "@material-ui/core";
import { AccessTime, CalendarToday, LockOpen } from "@material-ui/icons";

/**
 * Displays the date and time of last login in a typography element.
 */
export default function LastLoginDisplay(props: { date: string; time: string } & TypographyProps) {
    const { date, time, ...typoProps } = props;

    return (
        <Typography {...typoProps}>
            <LockOpen fontSize="inherit" /> <CalendarToday fontSize="inherit" /> {date}{" "}
            <AccessTime fontSize="inherit" /> {time}
        </Typography>
    );
}
