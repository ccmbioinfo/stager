import React from "react";
import { Card } from "react-bootstrap";

export interface ParticipantProps {
    codename: string;
    sex: string;
    type: string;
    affected: boolean;
    notes: string;
    // family
    // tissues
    // datasets
    // analyses
}

export default function Participant(props: ParticipantProps) {
    return (
        <Card className="my-3" border={props.affected ? "danger" : undefined}>
            <Card.Header className="d-flex justify-content-between">
                <span>{props.codename}</span>
                <span>{props.type}</span>
            </Card.Header>
            <Card.Body>
                <Card.Text>
                    {props.sex}, {props.affected ? "Affected" : "Unaffected"}
                </Card.Text>
                <Card.Text>{props.notes}</Card.Text>
            </Card.Body>
        </Card>
    );
}
