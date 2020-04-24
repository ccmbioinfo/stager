import React, { ReactNode, useCallback, useState } from "react";
import { Button, ButtonProps } from "react-bootstrap";
import Analysis, { AnalysisProps } from "./Analysis";

interface SortButtonProps {
    active: boolean;
    toggleActive: () => void;
    activeVariant: ButtonProps["variant"];
    inactiveVariant: ButtonProps["variant"];
    children?: ReactNode;
}

function SortButton(props: SortButtonProps) {
    return (
        <Button
            variant={props.active ? props.activeVariant : props.inactiveVariant}
            onClick={props.toggleActive}>
            {props.children}
        </Button>
    );
}

export interface AnalysisListProps {
    analyses: AnalysisProps[]
}

export default function AnalysisList(props: AnalysisListProps) {
    const [sortColumn, setSortColumn] = useState("time");
    const [sortAscending, setSortAscending] = useState(true);

    const toggleTime = useCallback(() => {
        if (sortColumn === "time") {
            setSortAscending(!sortAscending);
        } else {
            setSortColumn("time");
            setSortAscending(true);
        }
    }, [sortColumn, sortAscending]);
    const toggleSample = useCallback(() => {
        if (sortColumn === "sample") {
            setSortAscending(!sortAscending);
        } else {
            setSortColumn("sample");
            setSortAscending(true);
        }
    }, [sortColumn, sortAscending]);

    return (
        <>
        <div className="d-flex justify-content-between">
            <SortButton active={sortColumn === "time"} toggleActive={toggleTime}
                activeVariant="primary" inactiveVariant="outline-primary">
                Time {sortColumn === "time" && (sortAscending ? '⬆️' : '⬇️')}
            </SortButton>
            <SortButton active={sortColumn === "sample"} toggleActive={toggleSample}
                activeVariant="secondary" inactiveVariant="outline-secondary">
                Sample {sortColumn === "sample" && (sortAscending ? '⬆️' : '⬇️')}
            </SortButton>
        </div>
        {props.analyses.sort((a, b) => {
            if (sortAscending) {
                [b, a] = [a, b];
            }
            if (sortColumn === "time") {
                return b.submitted.valueOf() - a.submitted.valueOf();
            } else if (sortColumn === "sample") {
                return b.samples.length - a.samples.length;
            } else {
                return 0;
            }
        }).map(analysis => (
            <Analysis {...analysis} />
        ))}
        </>
    );
}
