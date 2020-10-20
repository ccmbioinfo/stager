import React, { forwardRef, ReactElement, Ref, useState } from "react";
import { IconButton, Slide, Snackbar } from "@material-ui/core";
import { TransitionProps } from "@material-ui/core/transitions";
import { Close } from "@material-ui/icons";
import { SnackbarKey } from "notistack";

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
