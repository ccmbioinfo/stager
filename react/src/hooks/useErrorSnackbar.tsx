import { useSnackbar } from "notistack";

export function useErrorSnackbar() {
    const { enqueueSnackbar } = useSnackbar();

    const enqueueErrorSnackbar = (response: Response, message?: string | undefined) => {
        enqueueSnackbar(`${message}. Error: ${response.status} - ${response.statusText}`, {
            variant: "error",
        });
    };
    return enqueueErrorSnackbar;
}
