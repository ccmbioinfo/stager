import React from "react";
import { Alert, AlertProps, Button, Card, Col, Container, Row } from "react-bootstrap";
import ConfirmModal from "./ConfirmModal";
import CreateUserModal from "./CreateUserModal";
import UserRow, { UserRowState } from "./UserRow";

interface UserListState {
    userList: UserRowState[];
    addingUser: boolean;
    updatingUser: UserRowState | null;
    deletingUser: UserRowState | null;
    message: string;
    messageVariant: AlertProps["variant"];
}

export default class UserList extends React.Component {
    state: UserListState;
    constructor(props: object) {
        super(props);
        this.state = {
            userList: [],
            addingUser: false,
            updatingUser: null,
            deletingUser: null,
            message: "",
            messageVariant: "secondary"
        };
        this.showAddingUser = this.showAddingUser.bind(this);
        this.hideAddingUser = this.hideAddingUser.bind(this);
        this.addUser = this.addUser.bind(this);
        this.showUpdatingUser = this.showUpdatingUser.bind(this);
        this.hideUpdatingUser = this.hideUpdatingUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.showDeletingUser = this.showDeletingUser.bind(this);
        this.hideDeletingUser = this.hideDeletingUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
        this.clearMessage = this.clearMessage.bind(this);
    }
    componentDidMount() {
        fetch("/api/users")
            .then(response => response.json())
            .then(userList => this.setState({ userList }));
    }
    showAddingUser() {
        this.setState({ addingUser: true });
    }
    hideAddingUser() {
        this.setState({ addingUser: false });
    }
    addUser(user: UserRowState) {
        this.setState({
            userList: this.state.userList.concat(user)
        });
        this.hideAddingUser();
    }
    showUpdatingUser(user: UserRowState) {
        this.setState({
            updatingUser: user
        });
    }
    hideUpdatingUser() {
        this.setState({
            updatingUser: null
        });
    }
    updateUser() {
        fetch("/api/users", {
            method: "PUT",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(this.state.updatingUser)
        }).then(response => {
            if (response.ok) {
                this.setState({
                    message: `Updated ${this.state.updatingUser!.username}.`,
                    messageVariant: "success"
                });
            } else {
                this.setState({
                    message: `Bad request for ${this.state.updatingUser!.username}.`,
                    messageVariant: "warning"
                });
            }
            this.hideUpdatingUser();
        });
    }
    showDeletingUser(user: UserRowState) {
        this.setState({
            deletingUser: user
        });
    }
    hideDeletingUser() {
        this.setState({
            deletingUser: null
        });
    }
    deleteUser() {
        fetch("/api/users", {
            method: "DELETE",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(this.state.deletingUser)
        }).then(response => {
            if (response.ok) {
                // Precondition: deletingUser is in userList
                const index = this.state.userList.findIndex(user => user.username === this.state.deletingUser!.username);
                const userList = Array.from(this.state.userList);
                userList.splice(index, 1);
                this.setState({
                    userList,
                    message: `Deleted ${this.state.deletingUser!.username}.`,
                    messageVariant: "info"
                });
            } else {
                this.setState({
                    message: `Failed to delete ${this.state.deletingUser!.username}.`,
                    messageVariant: "warning"
                });
            }
            this.hideDeletingUser();
        });
    }
    clearMessage() {
        this.setState({
            message: ""
        });
    }
    render() {
        return (
            <Card>
                <CreateUserModal show={!!this.state.addingUser} onHide={this.hideAddingUser} onSuccess={this.addUser} />
                <ConfirmModal
                    confirmVariant="warning" show={!!this.state.updatingUser}
                    onHide={this.hideUpdatingUser} onConfirm={this.updateUser}>
                    Update {this.state.updatingUser && this.state.updatingUser.username} and maybe overwrite password?
                </ConfirmModal>
                <ConfirmModal
                    confirmVariant="danger" show={!!this.state.deletingUser}
                    onHide={this.hideDeletingUser} onConfirm={this.deleteUser}>
                    Really delete {this.state.deletingUser && this.state.deletingUser.username}?
                </ConfirmModal>
                {this.state.message &&
                    <Alert variant={this.state.messageVariant} onClose={this.clearMessage}>{this.state.message}</Alert>}
                <Card.Header className="py-3 d-flex justify-content-between align-items-bottom">
                    <Card.Title as="h3" className="mb-0">Users</Card.Title>
                    <Button variant="primary" onClick={this.showAddingUser}>Add new</Button>
                </Card.Header>
                <Card.Body className="px-0">
                    <Container fluid>
                        <Row>
                            <Col xs={1}><h6>Username</h6></Col>
                            <Col xs={2}><h6>Email</h6></Col>
                            <Col xs={1}><h6>Admin?</h6></Col>
                            <Col xs={6}><h6>Change password</h6></Col>
                            <Col xs={2}><h6>Actions</h6></Col>
                        </Row>
                        {this.state.userList.map(user =>
                            <UserRow
                                key={user.username} {...user}
                                onUpdate={this.showUpdatingUser} onDelete={this.showDeletingUser} />
                        )}
                    </Container>
                </Card.Body>
            </Card>
        );
    }
}
