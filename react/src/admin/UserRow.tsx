import React, { useState } from "react";
import { Button, Col, FormCheck, FormControl, Row } from "react-bootstrap";

export interface UserRowState {
    username: string;
    email: string;
    isAdmin: boolean;
    password: string;
    confirmPassword: string;
}

export interface UserRowProps extends UserRowState {
    onUpdate: (state: UserRowState) => void;
    onDelete: (state: UserRowState) => void;
}

export default function UserRow(props: UserRowProps) {
    const [isAdmin, setAdmin] = useState(props.isAdmin);
    const [password, setPassword] = useState(props.password);
    const [confirmPassword, setConfirmPassword] = useState(props.confirmPassword);
    const state = {
        username: props.username,
        email: props.email,
        isAdmin,
        password,
        confirmPassword
    };
    return (
        <Row className="pb-1">
            <Col xs={1}>{props.username}</Col>
            <Col xs={2}>{props.email}</Col>
            <Col xs={1}>
                <FormCheck
                    inline checked={isAdmin}
                    onChange={(e: any) => setAdmin(e.target.checked)}
                />
            </Col>
            <Col xs={3}>
                <FormControl
                    type="password" placeholder="New password" autoComplete="new-password"
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                />
            </Col>
            <Col xs={3}>
                <FormControl
                    type="password" placeholder="Confirm password" autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e: any) => setConfirmPassword(e.target.value)}
                />
            </Col>
            <Col xs={2}>
                <Button
                    variant="primary" className="mr-1"
                    onClick={() => props.onUpdate(state)}>
                    Update
                </Button>
                <Button variant="danger" onClick={() => props.onDelete(state)}>Delete</Button>
            </Col>
        </Row>
    );
}
