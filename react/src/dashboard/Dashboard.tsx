import React, { useEffect } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import Analysis, { AnalysisProps } from "./Analysis";

const analyses: AnalysisProps[] = [
    {
        submitted: new Date(),
        samples: ["ST2020", "ST2020-1"],
        pipeline: "cre",
        pipelineVersion: "4.20.1",
        state: "pending"
    },
    {
        submitted: new Date("2020-04-01"),
        samples: ["ST2020", "ST2020-1"],
        pipeline: "crg",
        pipelineVersion: "4.20.1",
        state: "pending"
    },
    {
        submitted: new Date(Date.now() - 1000),
        elapsedSeconds: 1,
        samples: ["C4R-3", "C4R-4"],
        pipeline: "wgs",
        pipelineVersion: "1.0.0",
        state: "running"
    },
    {
        submitted: new Date(Date.now() - 5000),
        elapsedSeconds: 5,
        samples: ["R2-D2", "R4-D4"],
        pipeline: "rnaseq",
        pipelineVersion: "20200405",
        state: "running"
    },
    {
        submitted: new Date(Date.now() - 60000),
        elapsedSeconds: 60,
        completed: new Date(),
        samples: ["the one"],
        pipeline: "epi",
        pipelineVersion: "2.2.0",
        state: "completed"
    },
    {
        submitted: new Date(Date.now() - 60000),
        elapsedSeconds: 120,
        completed: new Date(),
        samples: ["1", "two", "III", "quatre"],
        pipeline: "wes",
        pipelineVersion: "luftschloss",
        state: "failed"
    },
];

export default function Dashboard() {
    useEffect(() => {
        document.title = "Dashboard | ST2020";
    }, []);
    return (
        <Container fluid>
            <Row>
                <Col sm={6} md={4} className="py-3">
                    <Card className="h-100">
                        <Card.Header className="bg-dark text-light">
                            <Card.Title>Pending analyses</Card.Title>
                        </Card.Header>
                        <Card.Body className="analysis-list">
                            {
                                analyses.filter(a => a.state === "pending").map(a => (
                                    <Analysis {...a} />
                                ))
                            }
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} className="py-3">
                    <Card className="h-100">
                        <Card.Header className="bg-dark text-light">
                            <Card.Title>Running analyses</Card.Title>
                        </Card.Header>
                        <Card.Body className="analysis-list">
                            {
                                analyses.filter(a => a.state === "running").map(a => (
                                    <Analysis {...a} />
                                ))
                            }
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={12} md={4} className="py-3">
                    <Card className="h-100">
                        <Card.Header className="bg-dark text-light">
                            <Card.Title>Completed analyses</Card.Title>
                        </Card.Header>
                        <Card.Body className="analysis-list">
                            {
                                analyses.filter(a => a.state === "completed" || a.state === "failed")
                                    .map(a => (
                                        <Analysis {...a} />
                                    ))
                            }
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <Card className="my-3">
                        <Card.Header className="bg-dark text-light">
                            <Card.Title>Participants</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            stub
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
