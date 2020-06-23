import React, {useState} from 'react';

import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css';

import UserList from './admin/UserList';

import LoginForm from './pages/Login';
import Navigation from './pages/Navigation';

export default function App() {
    const [authenticated, setAuthenticated] = useState(false);
    if (authenticated) {
        return <LoginForm setAuthenticated={setAuthenticated} />;
    } else {
        return <Navigation />;
    }
}
