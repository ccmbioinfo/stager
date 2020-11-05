import { Counts, KeyValue, Analysis, PipelineStatus } from "./typings";
export function countArray(items: string[]) {
    return items.reduce<Counts>((counts, item) => {
        if (counts[item]) {
            counts[item] += 1;
        } else {
            counts[item] = 1;
        }
        return counts;
    }, Object.create(null));
}

export function toKeyValue(items: string[]) {
    return items.reduce<KeyValue>((map, item) => {
        map[item] = item;
        return map;
    }, Object.create(null));
}

/**
 * Return a date string in the format "YYYY-MM-DD", if possible.
 *
 * @param {string} date Datestring of the form: "Day, DD Mon YYYY HH:MM:SS GMT"
 */
export function formatDateString(date: string) {
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    // Pretty general datestring because we trust the server to send a good one
    const regex = /^[A-Z][a-z]{2}, (\d{2}) ([A-Z][a-z]{2}) (\d{4}) \d{2}:\d{2}:\d{2} GMT$/;
    const result = regex.exec(date);
    if (result) {
        let [year, month, day] = [result[3], "" + (months.indexOf(result[2]) + 1), result[1]];
        if (month.length < 2) month = "0" + month;
        return [year, month, day].join("-");
    }
    return date;
}

/**
 * Convert the provided JSON Array to a valid array of Analysis.
 */
export function jsonToAnalyses(data: Array<any>): Analysis[] {
    const rows: Analysis[] = data.map((row, index, arr) => {
        switch (row.analysis_state) {
            case "Requested":
                row.state = PipelineStatus.PENDING;
                break;
            case "Running":
                row.state = PipelineStatus.RUNNING;
                break;
            case "Done":
                row.state = PipelineStatus.COMPLETED;
                break;
            case "Error":
                row.state = PipelineStatus.ERROR;
                break;
            case "Cancelled":
                row.state = PipelineStatus.CANCELLED;
                break;
            default:
                row.state = null;
                break;
        }
        return { ...row } as Analysis;
    });
    return rows;
}

/**
 * Get the index of a material-table row.
 * If a material-table row is not provided, return null.
 */
export function getRowIndex(row: any): number | null {
    return row.tableData?.id;
}

/**
 * Return whether this material-table row is checked / selected.
 * If it is not a material-table row, return null.
 */
export function isRowSelected(row: any): boolean {
    return !!row?.tableData?.checked;
}
