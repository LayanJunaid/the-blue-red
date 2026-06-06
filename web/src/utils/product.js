const CATEGORY_PREFIX_MAP = {
  barcode_scanner: "BC",
  pos_terminal: "POS",
  receipt_printer: "PRN",
  label_printer: "LBL",
  software: "SW",
  service: "SVC",
  accessory: "ACC",
};

export const PRODUCT_CATEGORIES = [
  "barcode_scanner",
  "pos_terminal",
  "receipt_printer",
  "label_printer",
  "software",
  "service",
  "accessory",
];

function getCategoryPrefix(category) {
  return CATEGORY_PREFIX_MAP[category] || "GEN";
}

function getExistingProductNumbers(products, category) {
  const prefix = getCategoryPrefix(category);

  return products
    .map((product) => product.product_id)
    .filter((id) => id?.startsWith(`PRD-${prefix}-`))
    .map((id) => Number(id.split("-").pop()))
    .filter((num) => !Number.isNaN(num));
}

export function generateProductIdentity(category, products) {
  const prefix = getCategoryPrefix(category);
  const existingNumbers = getExistingProductNumbers(products, category);

  const nextNumber =
    existingNumbers.length > 0 ? Math.max(...existingNumbers) + 10 : 100;

  return {
    product_id: `PRD-${prefix}-${nextNumber}`,
    sku: `TBR-${prefix}-${nextNumber}`,
  };
}

export function splitCommaText(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateProductForm(form) {
  const errors = {};

  if (!form.name_tr.trim()) {
    errors.name_tr = "Product name is required.";
  }

  if (!form.category) {
    errors.category = "Category is required.";
  }

  if (!form.brand.trim()) {
    errors.brand = "Brand is required.";
  }

  if (!form.price_try || Number(form.price_try) <= 0) {
    errors.price_try = "Price must be greater than 0.";
  }

  if (form.stock_qty === "" || Number(form.stock_qty) < 0) {
    errors.stock_qty = "Stock quantity must be 0 or greater.";
  }

  if (!form.min_order_qty || Number(form.min_order_qty) <= 0) {
    errors.min_order_qty = "Minimum order quantity must be greater than 0.";
  }

  if (form.delivery_days === "" || Number(form.delivery_days) < 0) {
    errors.delivery_days = "Delivery days must be 0 or greater.";
  }

  if (!form.warranty_months || Number(form.warranty_months) <= 0) {
    errors.warranty_months = "Warranty months must be greater than 0.";
  }

  if (splitCommaText(form.tags).length === 0) {
    errors.tags = "At least one tag is required.";
  }

  if (splitCommaText(form.aliases).length === 0) {
    errors.aliases = "At least one alias is required.";
  }

  if (form.substitute_product_ids.length === 0) {
    errors.substitute_product_ids = "At least one alternative product is required.";
  }

  if (!form.notes.trim()) {
    errors.notes = "Notes are required.";
  }

  return errors;
}

export function buildProductPayload(form, products) {
  const identity = generateProductIdentity(form.category, products);

  return {
    ...identity,
    name_tr: form.name_tr.trim(),
    category: form.category,
    brand: form.brand.trim(),
    price_try: Number(form.price_try),
    stock_qty: Number(form.stock_qty),
    active: true,
    min_order_qty: Number(form.min_order_qty),
    delivery_days: Number(form.delivery_days),
    warranty_months: Number(form.warranty_months),
    tags: splitCommaText(form.tags),
    aliases: {
      tr: splitCommaText(form.aliases),
    },
    substitute_product_ids: form.substitute_product_ids,
    notes: form.notes.trim(),
  };
}