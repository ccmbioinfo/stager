import React, { useState } from 'react';

import LoginForm from './pages/Login';
import Navigation from './pages/Navigation';

export default function App() {
    const [authenticated, setAuthenticated] = useState(false);
    async function signout() {
        const result = await fetch("/api/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "dummy": true })
        });
        if (result.ok) {
            setAuthenticated(false);
        }
    }
    if (authenticated) {
        return <Navigation signout={signout} />;
    } else {
        return <LoginForm setAuthenticated={setAuthenticated} />;
    }
}
