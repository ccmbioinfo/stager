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
                Requested {props.submitted.toLocaleString()}
                {props.elapsedSeconds && <><br />{props.elapsedSeconds} s elapsed</>}
                {props.completed && <><br />Finished {props.completed.toLocaleString()}</>}
            </p>
            <b>Samples</b>
            {
                props.samples.map(sample => (
                    <small className="d-block">{sample}</small>
                ))
            }
        </div>
    );
}
