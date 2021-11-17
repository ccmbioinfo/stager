function getActiveEndpoint(): string {
    const activeEndpoint = localStorage.getItem("endpoint");
    return activeEndpoint === null ? "" : activeEndpoint;
}

export function useFetch(url: string, ...args: any[]): Promise<Response> {
    const endpoint = getActiveEndpoint();
    return fetch(`${endpoint}${url}`, ...args);
}
