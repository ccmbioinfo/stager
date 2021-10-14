import { Typography } from "@material-ui/core";
import { AccessTime, CalendarToday, LockOpen } from "@material-ui/icons";
import dayjs from "dayjs";
/**
 * Displays the date and time of last login in a typography element.
 */
export default function LastLoginDisplay({ timestamp }: { timestamp: string }) {
    return (
        <Typography>
            {dayjs(timestamp).isValid() ? (
                <>
                    <LockOpen fontSize="inherit" /> <CalendarToday fontSize="inherit" />{" "}
                    {dayjs(timestamp).format("YYYY-MM-DD")} <AccessTime fontSize="inherit" />{" "}
                    {dayjs(timestamp).format("HH:mm:ss")}
                </>
            ) : (
                "This user has never logged in"
            )}
        </Typography>
    );
}
