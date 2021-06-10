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
}

const useStyles = makeStyles<Theme, CardButtonProps>(theme => ({
    root: props => ({
        outlineColor: theme.palette.primary.light,
        outlineWidth: props.selected ? 3 : 0,
        outlineStyle: "solid",
        transition: "outline-width 150ms",
    }),
}));

export function CardButton(props: CardButtonProps) {
    const classes = useStyles(props);

    return (
        <Card className={classes.root} variant="outlined">
            <CardActionArea onClick={props.onClick}>
                <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                        {props.title}
                    </Typography>
                    {!!props.description && (
                        <Typography variant="body2" color="textSecondary" component="p">
                            {props.description}
                        </Typography>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
