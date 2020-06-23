import React, {useState} from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css';

import LoginForm from './login/Login';
import UserList from './admin/UserList';

import Navigation from './pages/Navigation';

export default function App() {
    const [authenticated, setAuthenticated] = useState(false);
    return (
        <Navigation />
    );
}
