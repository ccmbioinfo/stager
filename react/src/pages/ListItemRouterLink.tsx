import React from "react";
import { Link } from "react-router-dom";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";

export interface ListItemRouterLinkProps {
    primary: React.ReactNode;
    to: string;
    children: React.ReactNode;
}

// https://material-ui.com/guides/composition/#caveat-with-inlining
export default function ListItemRouterLink({ primary, to, children }: ListItemRouterLinkProps) {
    const ForwardedRouterLink = React.useMemo(
        () =>
            React.forwardRef<HTMLAnchorElement>((linkProps, ref) => (
                <Link ref={ref} to={to} {...linkProps} />
            )),
        [to]
    );

    return (
        <ListItem button component={ForwardedRouterLink}>
            <ListItemIcon>{children}</ListItemIcon>
            <ListItemText primary={primary} />
        </ListItem>
    );
}
