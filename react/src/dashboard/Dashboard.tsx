import React, { useEffect } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";

export default function Dashboard() {
    useEffect(() => {
        document.title = "Dashboard | ST2020";
    }, []);
    return (
        <Container fluid>
            <Row>
                <Col sm={6} md={4}>
                    <Card className="my-3">
                        <Card.Header className="bg-dark text-light">
                            <Card.Title>Pending analyses</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            stub
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4}>
                    <Card className="my-3">
                        <Card.Header className="bg-dark text-light">
                            <Card.Title>Running analyses</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            stub
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={12} md={4}>
                    <Card className="my-3">
                        <Card.Header className="bg-dark text-light">
                            <Card.Title>Completed analyses</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            stub
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
