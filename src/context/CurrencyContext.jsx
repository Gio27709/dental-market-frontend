/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useCallback, useMemo } from "react";
import PropTypes from "prop-types";

const CurrencyContext = createContext();

// Whitelist de monedas válidas (Seguridad: previene inyección de valores arbitrarios)
const ALLOWED_CURRENCIES = ["USD", "VES"];
const DEFAULT_CURRENCY = "USD";
const STORAGE_KEY = "preferred_currency";

/**
 * Sanitiza el valor de moneda contra la whitelist.
 * Si el valor no es válido, retorna la moneda por defecto.
 */
const sanitizeCurrency = (value) => {
  if (typeof value !== "string") return DEFAULT_CURRENCY;
  const upper = value.toUpperCase().trim();
  return ALLOWED_CURRENCIES.includes(upper) ? upper : DEFAULT_CURRENCY;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyRaw] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return sanitizeCurrency(stored);
    } catch {
      return DEFAULT_CURRENCY;
    }
  });

  const setCurrency = useCallback((newCurrency) => {
    const safe = sanitizeCurrency(newCurrency);
    setCurrencyRaw(safe);
    try {
      localStorage.setItem(STORAGE_KEY, safe);
    } catch {
      // localStorage podría estar lleno o deshabilitado — falla silenciosamente
    }
  }, []);

  const contextValue = useMemo(() => ({
    currency,
    setCurrency,
    isVES: currency === "VES",
    isUSD: currency === "USD",
  }), [currency, setCurrency]);

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

CurrencyProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useCurrency = () => useContext(CurrencyContext);
