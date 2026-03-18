/**
 * Mock data for development and testing of the Cart Module.
 */

export const mockProductDetail = {
  id: "prod_123",
  name: "Resina Filtek Z350",
  description: "Resina universal de alta estética",
  price: 45.0,
  store: { business_name: "3M Dental" },
  images: ["https://example.com/resina.jpg"],
};

export const mockVariationA1 = {
  id: "var_A1",
  attribute_name: "Tono",
  attribute_value: "A1",
  stock: 10,
};

export const mockVariationA2 = {
  id: "var_A2",
  attribute_name: "Tono",
  attribute_value: "A2",
  stock: 2,
};

export const mockCartItem = {
  id: "prod_123-var_A1",
  product_id: "prod_123",
  variation_id: "var_A1",
  name: "Resina Filtek Z350",
  price_usd: 45.0,
  quantity: 2,
  image: "https://example.com/resina.jpg",
  variation: mockVariationA1,
};

export const mockCartItems = [
  mockCartItem,
  {
    id: "prod_123-var_A2",
    product_id: "prod_123",
    variation_id: "var_A2",
    name: "Resina Filtek Z350",
    price_usd: 45.0,
    quantity: 1,
    image: "https://example.com/resina.jpg",
    variation: mockVariationA2,
  },
  {
    id: "prod_999-var_none",
    product_id: "prod_999",
    variation_id: "var_none", // No specific variation
    name: "Caja de Guantes de Nitrilo",
    price_usd: 8.5,
    quantity: 5,
    image: null,
    variation: { stock: 100, attribute_value: "M" },
  },
];
