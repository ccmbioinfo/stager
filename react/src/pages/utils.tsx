import React, { forwardRef, ReactElement, Ref } from "react";
import { Slide } from "@material-ui/core";
import { TransitionProps } from "@material-ui/core/transitions";

export const SlideUpTransition = forwardRef((
    props: TransitionProps & { children?: ReactElement },
    ref: Ref<unknown>,
) => <Slide direction="up" ref={ref} {...props} />);

export type Counts = { [key: string]: number };
export type KeyValue = { [key: string]: string };

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
 * Return a date string in the format "YYYY-MM-DD"
 */
export function formatDateString(date: string) {
    let d = new Date(date);
    let [year, month, day] = ['' + d.getFullYear(), '' + d.getMonth(), '' + d.getDay()];
    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    return [year, month, day].join('-');
}
