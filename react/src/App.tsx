import React, {useState} from 'react';
import {BrowserRouter, Switch, Route, Link} from 'react-router-dom';
import {Nav, Navbar, NavItem} from 'react-bootstrap';
import logo from './logo.svg';
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css';

import LoginForm from './login/Login';

export default function App() {
    const [authenticated, setAuthenticated] = useState(false);
    return (
        <BrowserRouter>
            <Navbar bg="dark">
                <Navbar.Brand>
                    <Link to="/">ST2020</Link>
                </Navbar.Brand>
                <Nav className="flex-grow-1">
                    <NavItem>
                        <Link to="/search">Search</Link>
                    </NavItem>
                </Nav>
                <Nav>
                    <NavItem>
                        <Link to="/auth">{authenticated ? "Sign out" : "Sign in"}</Link>
                    </NavItem>
                </Nav>
            </Navbar>
            <Switch>
                <Route path="/search">
                    <p className="lead">Search stub</p>
                </Route>
                <Route path="/auth">
                   <LoginForm authenticated={authenticated} setAuthenticated={setAuthenticated} />
                </Route>
                <Route path="/">
                    <div className="App">
                        <header className="App-header">
                            <img src={logo} className="App-logo" alt="logo"/>
                            <p>
                                Edit <code>src/App.tsx</code> and save to reload.
                            </p>
                            <a
                                className="App-link"
                                href="https://reactjs.org"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Learn React
                            </a>
                        </header>
                    </div>
                </Route>
            </Switch>
        </BrowserRouter>
    );
}
