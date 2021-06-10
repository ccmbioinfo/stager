import React from "react";
import {
    Card,
    CardActionArea,
    CardContent,
    makeStyles,
    Theme,
    Typography,
} from "@material-ui/core";

export interface CardButtonProps {
    title: string;
    description?: string;
    onClick?: () => void;
    selected?: boolean;
    disabled?: boolean;
}

const useStyles = makeStyles<Theme, CardButtonProps>(theme => ({
    root: props => ({
        outlineColor: props.disabled ? theme.palette.action.disabled : theme.palette.primary.light,
        outlineWidth: props.disabled ? 0 : props.selected ? 3 : 0,
        outlineStyle: "solid",
        transition: "outline-width 150ms",
        backgroundColor: props.disabled ? theme.palette.action.disabledBackground : undefined,
    }),
    typography: props => ({
        color: props.disabled ? theme.palette.text.disabled : undefined,
    }),
}));

export function CardButton(props: CardButtonProps) {
    const classes = useStyles(props);

    return (
        <Card className={classes.root} variant="outlined">
            <CardActionArea onClick={props.onClick} disabled>
                <CardContent>
                    <Typography
                        gutterBottom
                        variant="h5"
                        component="h2"
                        className={classes.typography}
                    >
                        {props.title}
                    </Typography>
                    {!!props.description && (
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            component="p"
                            className={classes.typography}
                        >
                            {props.description}
                        </Typography>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
