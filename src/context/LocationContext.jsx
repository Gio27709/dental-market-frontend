/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";

export const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [buyerState, setBuyerState] = useState(() => {
    return localStorage.getItem("buyer_state") || "";
  });

  useEffect(() => {
    if (buyerState) {
      localStorage.setItem("buyer_state", buyerState);
    } else {
      localStorage.removeItem("buyer_state");
    }
  }, [buyerState]);

  return (
    <LocationContext.Provider value={{ buyerState, setBuyerState }}>
      {children}
    </LocationContext.Provider>
  );
}

LocationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

