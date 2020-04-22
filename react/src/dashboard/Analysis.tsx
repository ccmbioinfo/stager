import React from "react";

export interface AnalysisProps {
    submitted: Date;
    elapsedSeconds?: number;
    completed?: Date;
    samples: string[];
    pipeline: string;
    pipelineVersion: string;
    state: "pending" | "running" | "completed" | "failed";
}

const mapping = {
    "pending": "bg-info",
    "running": "bg-warning",
    "completed": "bg-success",
    "failed": "bg-danger"
};

export default function Analysis(props: AnalysisProps) {
    return (
        <div className={`rounded my-1 p-3 text-white border-dark ${mapping[props.state]}`}>
            <p className="lead">{props.pipeline} {props.pipelineVersion}</p>
            <p>
                requested {props.submitted.toLocaleString()}
                {props.elapsedSeconds &&
                    <><br /><code className="text-primary">{props.elapsedSeconds}s</code> elapsed</>}
                {props.completed && <><br /><i>{props.state}</i> {props.completed.toLocaleString()}</>}
            </p>
            <b className="d-block">Samples</b>
            {
                props.samples.map(sample => (
                    <small className="px-1">{sample}</small>
                ))
            }
        </div>
    );
}
