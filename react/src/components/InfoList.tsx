import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Collapse,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    makeStyles,
    Paper,
    Typography,
} from "@material-ui/core";
import { ExpandLess, ExpandMore, MenuOpen } from "@material-ui/icons";
import { useHistory } from "react-router-dom";
import DetailSection from "./DetailSection";
import { Info } from "../typings";

const useStyles = makeStyles(theme => ({
    listPaper: {
        margin: theme.spacing(1),
    },
    box: {
        padding: theme.spacing(2),
        margin: theme.spacing(1),
    },
    list: {
        padding: 0,
    },
    button: {
        marginRight: theme.spacing(1),
    },
}));

export default function InfoList(props: {
    infoList: Info[];
    enums: any;
    title?: string;
    icon: JSX.Element;
    linkPath?: string;
}) {
    const classes = useStyles();
    const [showInfo, setShowInfo] = useState<boolean[]>([]);
    const infoList = props.infoList;
    const history = useHistory();

    function clickListItem(index: number) {
        // toggle
        setShowInfo(
            showInfo.map((val, i) => {
                return index === i ? !val : val;
            })
        );
    }
    useEffect(() => {
        setShowInfo(props.infoList.map(val => false));
    }, [props.infoList]);
    return (
        <>
            {props.title && <Typography variant="h6">{props.title}</Typography>}
            <List className={classes.list}>
                {infoList.map((info, index) => (
                    <Paper key={index} className={classes.listPaper} elevation={1}>
                        <ListItem button onClick={() => clickListItem(index)}>
                            <ListItemIcon>{props.icon}</ListItemIcon>
                            <ListItemText
                                primary={info.primaryListTitle}
                                secondary={info.secondaryListTitle}
                            />
                            {showInfo[index] ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={showInfo[index]}>
                            <Box className={classes.box}>
                                <DetailSection
                                    fields={info.fields}
                                    enums={props.enums}
                                    collapsibleFields={info.collapsibleFields}
                                />
                                {props.linkPath && info.identifier && (
                                    <Button
                                        className={classes.button}
                                        onClick={() => {
                                            history.push(`${props.linkPath}/${info.identifier}`);
                                        }}
                                        variant="contained"
                                        size="small"
                                        endIcon={<MenuOpen />}
                                    >
                                        Open in table
                                    </Button>
                                )}
                            </Box>
                        </Collapse>
                    </Paper>
                ))}
            </List>
        </>
    );
}
