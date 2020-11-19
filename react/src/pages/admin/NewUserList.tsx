import React, { useEffect, useState } from "react";
import { Grid } from "@material-ui/core";
import { User } from "../utils/typings";
import UserRow from "./NewUserRow";

export default function UserList() {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        document.title = "Admin | ST2020";
        fetch("/api/users")
            .then(response => response.json())
            .then(setUsers); // No safety check on JSON structure
    }, []);

    return (
        <Grid container spacing={1} alignItems="flex-start">
            {users.map(user => (
                <>
                    <UserRow user={user} />
                    <UserRow user={user} />
                    <UserRow user={user} />
                    <UserRow user={user} />
                </>
            ))}
        </Grid>
    );
}
