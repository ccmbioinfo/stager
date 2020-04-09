import React, {useState} from 'react';
import { Button, Card, Form } from 'react-bootstrap';

export default function LoginForm({
    authenticated = false,
    setAuthenticated = function(auth: boolean) {}
}) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    function bind(set: typeof setUsername) {
        // @ts-ignore
        return e => set(e.target.value);
    }
    async function authenticate(e: React.MouseEvent) {
        e.preventDefault();
        const result = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        setAuthenticated(result.ok);
    }
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
                            <Form.Control type="text" placeholder="Username" onChange={bind(setUsername)}/>
                        </Form.Group>
                        <Form.Group controlId="password">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" placeholder="Password" onChange={bind(setPassword)}/>
                        </Form.Group>
                        <Button variant="primary" type="submit" onClick={authenticate}>
                            Sign in
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        );
    }
}

