import { useContext } from "react";
import EnumContext from "./EnumContext";

const useEnums = () => useContext(EnumContext);
export default useEnums;
