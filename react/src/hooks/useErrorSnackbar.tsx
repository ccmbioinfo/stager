import { useSnackbar } from "notistack";
import { ErrorSnackbar } from "../components/index";

/**
 * Hook that returns a function for opening an error snackbar that displays an error code and an error message.
 *
 * @returns function that takes in the error response and an optional error message
 */

export function useErrorSnackbar() {
    const { enqueueSnackbar } = useSnackbar();

    const enqueueErrorSnackbar = async (response: Response, message?: string | undefined) => {
        const payload = await response.json();
        const userMessage = `Error: ${message ? message : "Your request can't be processed."}`;
        const errorMessage = `Details: ${response.status} - ${response.statusText}. ${payload.error}`;

        enqueueSnackbar(errorMessage, {
            content: () => <ErrorSnackbar userMessage={userMessage} errorMessage={errorMessage} />,
            preventDuplicate: true,
        });
    };
    return enqueueErrorSnackbar;
}
