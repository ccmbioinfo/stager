import { createContext } from "react";

type ClientContextType = (url: string) => void;

// Value is a function that updates the url to fetch/page cache for
const ClientContext = createContext<ClientContextType>(() => {});

// Value is the result of a fetch or cache page for a url
const ResultContext = createContext<any>({});

export { ClientContext, ResultContext };
