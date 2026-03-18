import React, { useState } from "react";
import PropTypes from "prop-types";
import { validatePhone, validateAddress } from "../../utils/validators";
import { formatCurrencyVES, formatCurrencyUSD } from "../../utils/formatters";
import PaymentMethodSelector from "./PaymentMethodSelector";
import PaymentInstructions from "./PaymentInstructions";
import toast from "react-hot-toast";

export default function CheckoutForm({
  cartItems,
  total_usd,
  total_ves,
  onSubmit,
  loading,
}) {
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem("checkout_form_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing checkout form data:", e);
      }
    }
    return {
      address: "",
      phone: "",
      payment_method: "",
      notes: "",
    };
  });

  // Persist form data to survive tab switching or HMR
  React.useEffect(() => {
    sessionStorage.setItem("checkout_form_data", JSON.stringify(formData));
  }, [formData]);

  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear specific error as user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleMethodChange = (method) => {
    setFormData((prev) => ({ ...prev, payment_method: method }));
    setFormErrors((prev) => ({ ...prev, payment_method: null }));
  };

  const validate = () => {
    const errors = {};
    if (!validateAddress(formData.address)) {
      errors.address =
        "La dirección debe ser clara y tener más de 10 caracteres.";
    }
    if (!validatePhone(formData.phone)) {
      errors.phone =
        "El número telefónico debe tener un formato válido (Ej. 0412-1234567).";
    }
    if (!formData.payment_method) {
      errors.payment_method = "Debe seleccionar un método de pago.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData, cartItems);
    } else {
      toast.error("Por favor, corrige los errores en el formulario");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6 rounded-t-lg shadow-sm">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Datos de Envío y Facturación
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          ¿A dónde enviaremos tu pedido y cómo te contactamos?
        </p>
      </div>

      <div className="bg-white shadow-sm px-4 py-5 sm:p-6 mb-6 rounded-b-lg">
        <div className="grid grid-cols-6 gap-6">
          <div className="col-span-6">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700"
            >
              Dirección Exacta de Entrega *
            </label>
            <textarea
              id="address"
              name="address"
              rows="3"
              disabled={loading}
              value={formData.address}
              onChange={handleChange}
              placeholder="Ej. Urb. Los Palos Grandes, Av. Principal con 1era transversal. Edif. Torre Letonia, Piso 4, Ofic 42."
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md p-2 border focus:ring-primary-500 focus:border-primary-500 ${formErrors.address ? "border-red-300" : "border-gray-300"}`}
            />
            {formErrors.address && (
              <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
            )}
          </div>

          <div className="col-span-6 sm:col-span-3">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Teléfono Contacto *
            </label>
            <input
              type="text"
              name="phone"
              id="phone"
              disabled={loading}
              value={formData.phone}
              onChange={handleChange}
              placeholder="0412-0000000"
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md p-2 border focus:ring-primary-500 focus:border-primary-500 ${formErrors.phone ? "border-red-300" : "border-gray-300"}`}
            />
            {formErrors.phone && (
              <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
            )}
          </div>

          <div className="col-span-6">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              Notas Adicionales (Opcional)
            </label>
            <input
              type="text"
              name="notes"
              id="notes"
              disabled={loading}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Punto de referencia o instrucciones al repartidor"
              className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 p-2 border focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6 rounded-t-lg shadow-sm">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Métodos de Pago
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Nuestros fondos se consolidan con seguridad.
        </p>
      </div>

      <div className="bg-white shadow-sm px-4 py-5 sm:p-6 mb-6 rounded-b-lg">
        <PaymentMethodSelector
          selectedMethod={formData.payment_method}
          onChange={handleMethodChange}
          error={formErrors.payment_method}
        />
        <PaymentInstructions paymentMethod={formData.payment_method} />
      </div>

      <div className="bg-gray-50 text-gray-800 shadow-sm border border-gray-200 px-4 py-5 sm:p-6 mb-6 rounded-lg pointer-events-none">
        <h4 className="text-md font-bold text-gray-900 mb-4 border-b pb-2">
          Resumen de Cuenta
        </h4>
        <div className="flex justify-between font-bold text-xl mb-1">
          <span>Total USD</span>
          <span>{formatCurrencyUSD(total_usd)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm text-gray-500">
          <span>Conversión Bs.</span>
          <span>{formatCurrencyVES(total_ves)}</span>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3 border-t pt-5">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex justify-center py-3 px-8 border border-transparent shadow-md text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed transition"
        >
          {loading ? "Procesando Orden..." : "Crear Pedido Seguro"}
        </button>
      </div>
    </form>
  );
}

CheckoutForm.propTypes = {
  cartItems: PropTypes.array.isRequired,
  total_usd: PropTypes.number.isRequired,
  total_ves: PropTypes.number.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
