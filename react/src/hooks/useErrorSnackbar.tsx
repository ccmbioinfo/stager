import { useSnackbar } from "notistack";

/**
 * Hook that returns a function for opening an error snackbar that displays an error code and an error message.
 *
 * @returns function that takes in the error response and an optional error message 
 */

export function useErrorSnackbar() {
    const { enqueueSnackbar } = useSnackbar();

    const enqueueErrorSnackbar = (response: Response, message?: string | undefined) => {
        enqueueSnackbar(`${message}. Error: ${response.status} - ${response.statusText}`, {
            variant: "error",
        });
    };
    return enqueueErrorSnackbar;
}
