import { useSnackbar } from "notistack";

/**
 * Hook that returns a function for opening an error snackbar that displays an error code and an error message.
 *
 * @returns function that takes in the error response and an optional error message
 */

export function useErrorSnackbar() {
    const { enqueueSnackbar } = useSnackbar();

    const enqueueErrorSnackbar = async (response: Response, message?: string | undefined) => {
        var payload;

        try {
            payload = await response.json();
        } catch (error) {
            console.error(error, response);
        }

        const userMessage = `Error: ${message ? message : "Your request can't be processed."} \n`;
        const errorMessage = `${response.status} - ${response.statusText}. ${
            payload ? payload.error : ""
        }`;

        enqueueSnackbar(`${userMessage} (${errorMessage})`, {
            variant: "error",
            preventDuplicate: true,
        });
    };
    return enqueueErrorSnackbar;
}
