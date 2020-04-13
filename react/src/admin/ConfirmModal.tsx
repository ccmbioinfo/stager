import React from "react";
import { Button, ButtonProps, Modal } from "react-bootstrap";

export interface ConfirmModalProps {
    children: React.ReactNode;
    show: boolean;
    onHide: () => void;
    onConfirm: () => void;
    confirmVariant: ButtonProps["variant"];
}

export default function ConfirmModal(props: ConfirmModalProps) {
    return (
        <Modal show={props.show} onHide={props.onHide}>
            <Modal.Header>
                <Modal.Title>{props.children}</Modal.Title>
            </Modal.Header>
            <Modal.Body>`
                <Button
                    variant={props.confirmVariant}
                    onClick={props.onConfirm}>
                    Yes
                </Button>
                <Button
                    variant="info" className="pull-right"
                    onClick={props.onHide}>
                    No, go back
                </Button>
            </Modal.Body>
        </Modal>
    );
}
