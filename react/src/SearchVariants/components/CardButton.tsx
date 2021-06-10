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
    onClick?: (value: any) => void;
    value?: any;
    selected?: boolean;
}

const useStyles = makeStyles<Theme, CardButtonProps>(theme => ({
    root: props => ({
        borderColor: props.selected ? theme.palette.primary.light : undefined,
        borderWidth: props.selected ? 3 : 1,
        margin: props.selected ? 0 : 2,
        transition: "border-color 150ms, border-width 150ms, margin 150ms",
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
