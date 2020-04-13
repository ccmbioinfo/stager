import React, { useState } from "react";
import { Alert, Button, FormCheck, FormControl, FormLabel, FormGroup, Modal } from "react-bootstrap";

export interface CreateUserModalState {
    username: string;
    email: string;
    isAdmin: boolean;
    password: string;
    confirmPassword: string;
    errorNoMatch: boolean;
    errorIntegrity: boolean;
}

export interface CreateUserModalProps extends Partial<CreateUserModalState> {
    show: boolean;
    onHide: () => void;
    onSuccess: (state: CreateUserModalState) => void;
}

export default function CreateUserModal(props: CreateUserModalProps) {
    const [username, setUsername] = useState(props.username || "");
    const [email, setEmail] = useState(props.email || "");
    const [isAdmin, setAdmin] = useState(!!props.isAdmin);
    const [password, setPassword] = useState(props.password || "");
    const [confirmPassword, setConfirmPassword] = useState(props.confirmPassword || "");
    const [errorNoMatch, setErrorNoMatch] = useState(!!props.errorNoMatch);
    const [errorIntegrity, setErrorIntegrity] = useState(!!props.errorIntegrity);

    const state = {
        username, email, isAdmin, password, confirmPassword, errorNoMatch, errorIntegrity
    };
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        const response = await fetch("/api/users", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(state)
        });
        if (response.ok) {
            props.onSuccess(state);
            // Reset to default
            setUsername(props.username || "");
            setEmail(props.email || "");
            setAdmin(!!props.isAdmin);
            setPassword(props.password || "");
            setConfirmPassword(props.confirmPassword || "");
            setErrorNoMatch(!!props.errorNoMatch);
            setErrorIntegrity(!!props.errorIntegrity);
        } else {
            setErrorNoMatch(response.status === 400);
            setErrorIntegrity(response.status !== 400);
        }
    }

    return (
        <Modal show={props.show} onHide={props.onHide}>
            <Modal.Header closeButton>
                <Modal.Title>New user</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {state.errorNoMatch && <Alert variant="danger">Passwords do not match or length requirement not satisfied.</Alert>}
                {state.errorIntegrity && <Alert variant="danger">User or email already exists.</Alert>}
                <form onSubmit={submit}>
                    <FormGroup>
                        <FormLabel>Username (minimum 4 characters)</FormLabel>
                        <FormControl
                            type="text" placeholder="minimum 4 characters" autoComplete="off" required
                            value={state.username}
                            onChange={(e: any) => setUsername(e.target.value)}
                        />
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>Email</FormLabel>
                        <FormControl
                            type="email" placeholder="somebody@sickkids.ca" autoComplete="off" required
                            value={state.email}
                            onChange={(e: any) => setEmail(e.target.value)}
                        />
                    </FormGroup>
                    <FormCheck checked={state.isAdmin}
                        onChange={(e: any) => setAdmin(e.target.checked)}>
                        Admin?
                      </FormCheck>
                    <FormGroup>
                        <FormLabel>Password (minimum 4 characters)</FormLabel>
                        <FormControl
                            type="password" autoComplete="new-password" required
                            value={state.password}
                            onChange={(e: any) => setPassword(e.target.value)}
                        />
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl
                            type="password" autoComplete="new-password" required
                            value={state.confirmPassword}
                            onChange={(e: any) => setConfirmPassword(e.target.value)}
                        />
                    </FormGroup>
                    <Button variant="primary" type="submit">Create</Button>
                </form>
            </Modal.Body>
        </Modal>
    );
}
