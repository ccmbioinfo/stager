import React, {useState} from 'react';
import {BrowserRouter, Switch, Route, Link} from 'react-router-dom';
import {Nav, Navbar, NavItem} from 'react-bootstrap';
import logo from './logo.svg';
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css';

import LoginForm from './login/Login';
import UserList from './admin/UserList';
import Dashboard from './dashboard/Dashboard';
import ParticipantList from './participant/ParticipantList';

export default function App() {
    const [authenticated, setAuthenticated] = useState(false);
    return (
        <BrowserRouter>
            <Navbar bg="dark" expand="sm">
                <Navbar.Brand>
                    <Link to="/">ST2020</Link>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="main-nav" />
                <Navbar.Collapse id="main-nav">
                    <Nav className="flex-grow-1">
                        <NavItem className="px-2">
                            <Link to="/datasets">Datasets</Link>
                        </NavItem>
                        <NavItem className="px-2">
                            <Link to="/analyses">Analyses</Link>
                        </NavItem>
                        <NavItem className="px-2">
                            <Link to="/participants">Participants</Link>
                        </NavItem>
                        <NavItem className="px-2">
                            <Link to="/upload">Upload</Link>
                        </NavItem>
                    </Nav>
                </Navbar.Collapse>
                <Nav>
                    {authenticated &&
                    <NavItem className="px-2">
                        <Link to="/admin">Admin</Link>
                    </NavItem>}
                    <NavItem className="px-2">
                        <Link to="/auth">{authenticated ? "Sign out" : "Sign in"}</Link>
                    </NavItem>
                </Nav>
            </Navbar>
            <Switch>
                <Route path="/datasets">
                    <p className="lead">Dataset stub</p>
                </Route>
                <Route path="/analyses">
                    <p className="lead">Analysis stub</p>
                </Route>
                <Route path="/participants">
                    <ParticipantList />
                </Route>
                <Route path="/upload">
                    <p className="lead">Upload stub</p>
                </Route>
                {authenticated && <Route path="/admin" component={UserList} />}
                <Route path="/auth">
                   <LoginForm authenticated={authenticated} setAuthenticated={setAuthenticated} />
                </Route>
                <Route path="/">
                    <Dashboard />
                </Route>
            </Switch>
        </BrowserRouter>
    );
}
