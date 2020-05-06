import React, { useMemo } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Participant from "./Participant";

export default function ParticipantList() {
    const participants = useMemo(() => [
        {
            codename: "ST-2020",
            sex: "Male",
            type: "Proband",
            affected: true,
            notes: ""
        },
        {
            codename: "SK-1957",
            sex: "Female",
            type: "Parent",
            affected: true,
            notes: ""
        },
        {
            codename: "AP-1969",
            sex: "Female",
            type: "Parent",
            affected: false,
            notes: ""
        },
        {
            codename: "DL-6060",
            sex: "Male",
            type: "Proband",
            affected: false,
            notes: ""
        },
        {
            codename: "BA-2200",
            sex: "Male",
            type: "Sibling",
            affected: true,
            notes: ""
        },
        {
            codename: "BT-666",
            sex: "Male",
            type: "Proband",
            affected: true,
            notes: ""
        },
        {
            codename: "ET-2578",
            sex: "Female",
            type: "Sibling",
            affected: false,
            notes: ""
        },
        {
            codename: "PT-8",
            sex: "Female",
            type: "Proband",
            affected: true,
            notes: ""
        },
        {
            codename: "AB-7331",
            sex: "Male",
            type: "Parent",
            affected: false,
            notes: ""
        },
    ], []);
    return (
        <Container fluid>
            <Row>
            {participants.map(p =>
                <Col sm={6} md={4} lg={3}>
                    <Participant {...p} />
                </Col>
            )}
            </Row>
        </Container>

    );
}
