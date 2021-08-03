import React, { useState } from "react";
import { ListItem, ListItemIcon, ListItemText, Tooltip } from "@material-ui/core";
import { Link } from "react-router-dom";

export interface ListItemRouterLinkProps {
    primary: string;
    to: string;
    children: React.ReactNode;
    hideTooltip: boolean;
}

// https://material-ui.com/guides/composition/#caveat-with-inlining
// https://material-ui.com/components/tooltips/#custom-child-element
export default function ListItemRouterLink(props: ListItemRouterLinkProps) {
    const [openTooltip, setOpenTooltip] = useState(false);

    const ForwardedRouterLink = React.useMemo(
        () =>
            React.forwardRef<HTMLAnchorElement>((linkProps, linkRef) => (
                <Link
                    ref={linkRef}
                    to={props.to}
                    {...linkProps}
                    onMouseEnter={() => setOpenTooltip(true)}
                    onMouseLeave={() => setOpenTooltip(false)}
                />
            )),
        [props.to]
    );

    return (
        <Tooltip
            arrow
            title={props.primary}
            placement="right"
            open={openTooltip && !props.hideTooltip}
        >
            <ListItem button component={ForwardedRouterLink}>
                <ListItemIcon>{props.children}</ListItemIcon>
                <ListItemText primary={props.primary} />
            </ListItem>
        </Tooltip>
    );
}
