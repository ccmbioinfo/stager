import { createContext } from "react";
import { KeyValue } from "../typings";

type Enum = KeyValue | undefined;

export default createContext<Enum>(undefined);
