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
 * Returns JSON string of table row with material-table metadata removed.
 */
export function rowToJSON(row: any): string {
    var newRow = Object.assign({}, {...row}, {selected: undefined, tableData: undefined});
    return JSON.stringify(newRow);
}
