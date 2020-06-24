import React, { useState } from 'react';

import './App.css';

import LoginForm from './pages/Login';
import Navigation from './pages/Navigation';

export default function App() {
    const [authenticated, setAuthenticated] = useState(false);
    if (authenticated) {
        return <Navigation />;
    } else {
        return <LoginForm setAuthenticated={setAuthenticated} />;
    }
}
