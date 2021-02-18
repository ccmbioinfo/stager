import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ListItem, ListItemIcon, ListItemText, Tooltip } from "@material-ui/core";

export interface ListItemRouterLinkProps {
    primary: string;
    to: string;
    children: React.ReactNode;
    hideTooltip: boolean;
}

// https://material-ui.com/guides/composition/#caveat-with-inlining
// https://material-ui.com/components/tooltips/#custom-child-element
const ListItemRouterLink = React.forwardRef<HTMLDivElement, ListItemRouterLinkProps>(
    function _ListItemRouterLink(props, ref) {
        const [openTooltip, setOpenTooltip] = useState(false);

        const ForwardedRouterLink = React.useMemo(
            () =>
                React.forwardRef<HTMLAnchorElement>((linkProps, linkRef) => (
                    <Link ref={linkRef} to={props.to} {...linkProps} />
                )),
            [props.to]
        );

        return (
            <Tooltip arrow title={props.primary} placement="right" open={openTooltip}>
                <ListItem
                    button
                    component={ForwardedRouterLink}
                    ContainerProps={{
                        onMouseOver: () => setOpenTooltip(true && props.hideTooltip),
                        onMouseLeave: () => setOpenTooltip(false),
                    }}
                >
                    <ListItemIcon ref={ref}>{props.children}</ListItemIcon>
                    <ListItemText primary={props.primary} />
                </ListItem>
            </Tooltip>
        );
    }
);

export default ListItemRouterLink;
