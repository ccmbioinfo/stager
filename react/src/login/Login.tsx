import React from 'react';
import { Button, Card, Form } from 'react-bootstrap';

export default function LoginForm({ authenticated = false }) {
    if (authenticated) {
        return (
            <p className="lead">Already authenticated.</p>
        );
    } else {
        return (
            <Card>
                <Card.Body>
                    <Form>
                        <Form.Group controlId="username">
                            <Form.Label>Username</Form.Label>
                            <Form.Control type="text" placeholder="Username" />
                        </Form.Group>
                        <Form.Group controlId="password">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" placeholder="Password" />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Sign in
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        );
    }
}

