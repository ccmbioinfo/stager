import React from "react";
import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(LocalizedFormat);

export default function DateTimeText(props: { datetime: string }) {
    const dateObj = dayjs.utc(props.datetime);
    const displayText = dateObj.isValid() ? dateObj.local().format("YYYY-MM-DD") : null;
    const titleText = dateObj.isValid() ? dateObj.local().format("LLLL") : "";

    return <span title={titleText}>{displayText}</span>;
}
