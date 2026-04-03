import { useContext } from "react";
import { LocationContext } from "../context/LocationContext";

export function useLocationContext() {
  return useContext(LocationContext);
}
