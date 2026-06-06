import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import {
  createProduct,
  deleteProduct,
  getProducts,
} from "../services/productService";
import { formatTRY } from "../utils/currency";
import {
  PRODUCT_CATEGORIES,
  buildProductPayload,
  generateProductIdentity,
  validateProductForm,
} from "../utils/product";

const emptyForm = {
  name_tr: "",
  category: "",
  brand: "",
  price_try: "",
  stock_qty: "",
  min_order_qty: 1,
  delivery_days: 2,
  warranty_months: 24,
  tags: "",
  aliases: "",
  substitute_product_ids: [],
  notes: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_tr");
  const [alternativeSearch, setAlternativeSearch] = useState("");

  const generatedIdentity = useMemo(() => {
    if (!form.category) {
      return { product_id: "Select category", sku: "Select category" };
    }

    return generateProductIdentity(form.category, products);
  }, [form.category, products]);

  const loadProducts = async () => {
    setProducts(await getProducts());
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const availableCategories = useMemo(() => {
    return ["all", ...new Set(products.map((p) => p.category).filter(Boolean))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const q = search.toLowerCase();

        const matchesSearch =
          product.product_id?.toLowerCase().includes(q) ||
          product.sku?.toLowerCase().includes(q) ||
          product.name_tr?.toLowerCase().includes(q) ||
          product.brand?.toLowerCase().includes(q) ||
          product.category?.toLowerCase().includes(q);

        const matchesCategory =
          category === "all" || product.category === category;

        const matchesStock =
          stockFilter === "all" ||
          (stockFilter === "in_stock" && Number(product.stock_qty) > 0) ||
          (stockFilter === "out_of_stock" && Number(product.stock_qty) === 0) ||
          (stockFilter === "low_stock" &&
            Number(product.stock_qty) > 0 &&
            Number(product.stock_qty) <= 3);

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") {
          return Number(a.price_try) - Number(b.price_try);
        }

        if (sortBy === "price_desc") {
          return Number(b.price_try) - Number(a.price_try);
        }

        if (sortBy === "stock_asc") {
          return Number(a.stock_qty) - Number(b.stock_qty);
        }

        if (sortBy === "stock_desc") {
          return Number(b.stock_qty) - Number(a.stock_qty);
        }

        return String(a.name_tr || "").localeCompare(
          String(b.name_tr || ""),
          "tr"
        );
      });
  }, [products, search, category, stockFilter, sortBy]);

  const selectedAlternatives = products.filter((product) =>
    form.substitute_product_ids.includes(product.product_id)
  );

  const alternativeOptions = products
    .filter((product) => !form.substitute_product_ids.includes(product.product_id))
    .filter((product) => {
      const q = alternativeSearch.toLowerCase();

      return (
        product.product_id?.toLowerCase().includes(q) ||
        product.sku?.toLowerCase().includes(q) ||
        product.name_tr?.toLowerCase().includes(q) ||
        product.brand?.toLowerCase().includes(q)
      );
    })
    .slice(0, 8);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const addAlternative = (productId) => {
    setForm((prev) => ({
      ...prev,
      substitute_product_ids: [...prev.substitute_product_ids, productId],
    }));

    setErrors((prev) => ({ ...prev, substitute_product_ids: undefined }));
    setAlternativeSearch("");
  };

  const removeAlternative = (productId) => {
    setForm((prev) => ({
      ...prev,
      substitute_product_ids: prev.substitute_product_ids.filter(
        (id) => id !== productId
      ),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setFeedback(null);
    setAlternativeSearch("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateProductForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setFeedback({
        type: "error",
        message: "Please fix the highlighted fields before saving.",
      });
      return;
    }

    try {
      const payload = buildProductPayload(form, products);

      await createProduct(payload);

      setFeedback({
        type: "success",
        message: `Product ${payload.product_id} was created successfully.`,
      });

      setForm(emptyForm);
      setShowForm(false);
      await loadProducts();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error?.response?.data?.detail ||
          "Product could not be created. Please try again.",
      });
    }
  };

  const renderError = (field) => {
    if (!errors[field]) return null;

    return <p className="mt-1 text-xs font-bold text-red-600">{errors[field]}</p>;
  };

  const inputClass = (field) =>
    `rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-900 focus:ring-4 focus:ring-blue-900/10 dark:bg-slate-950 ${
      errors[field]
        ? "border-red-400 dark:border-red-500"
        : "border-slate-200 dark:border-slate-700"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            Products
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage product catalog, stock, pricing and alternatives.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((prev) => !prev);
            setFeedback(null);
          }}
          className="rounded-2xl bg-blue-900 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-blue-800"
        >
          {showForm ? "Close Form" : "+ Add Product"}
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-bold ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                New Product
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Product ID and SKU are generated automatically from the selected
                category.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Product ID
                </p>
                <p className="font-black text-blue-900 dark:text-blue-300">
                  {generatedIdentity.product_id}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase text-slate-500">SKU</p>
                <p className="font-black text-blue-900 dark:text-blue-300">
                  {generatedIdentity.sku}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Product Name / Ürün Adı
              </label>
              <input
                value={form.name_tr}
                onChange={(event) => updateForm("name_tr", event.target.value)}
                placeholder="BlueScan Lite 1D USB Barkod Okuyucu"
                className={inputClass("name_tr")}
              />
              {renderError("name_tr")}
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Category / Kategori
              </label>
              <select
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
                className={inputClass("category")}
              >
                <option value="">Select category</option>
                {PRODUCT_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {renderError("category")}
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Brand / Marka
              </label>
              <input
                value={form.brand}
                onChange={(event) => updateForm("brand", event.target.value)}
                placeholder="BlueScan"
                className={inputClass("brand")}
              />
              {renderError("brand")}
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Price TRY / Fiyat
              </label>
              <input
                type="number"
                min="1"
                value={form.price_try}
                onChange={(event) => updateForm("price_try", event.target.value)}
                placeholder="2450"
                className={inputClass("price_try")}
              />
              {renderError("price_try")}
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Stock Quantity / Stok
              </label>
              <input
                type="number"
                min="0"
                value={form.stock_qty}
                onChange={(event) => updateForm("stock_qty", event.target.value)}
                placeholder="44"
                className={inputClass("stock_qty")}
              />
              {renderError("stock_qty")}
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Min Order Qty / Minimum Sipariş
              </label>
              <input
                type="number"
                min="1"
                value={form.min_order_qty}
                onChange={(event) =>
                  updateForm("min_order_qty", event.target.value)
                }
                className={inputClass("min_order_qty")}
              />
              {renderError("min_order_qty")}
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Delivery Days / Teslimat Günü
              </label>
              <input
                type="number"
                min="0"
                value={form.delivery_days}
                onChange={(event) =>
                  updateForm("delivery_days", event.target.value)
                }
                className={inputClass("delivery_days")}
              />
              {renderError("delivery_days")}
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Warranty Months / Garanti Ayı
              </label>
              <input
                type="number"
                min="1"
                value={form.warranty_months}
                onChange={(event) =>
                  updateForm("warranty_months", event.target.value)
                }
                className={inputClass("warranty_months")}
              />
              {renderError("warranty_months")}
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Tags / Etiketler
              </label>
              <input
                value={form.tags}
                onChange={(event) => updateForm("tags", event.target.value)}
                placeholder="1d, usb, kablolu, giris"
                className={inputClass("tags")}
              />
              {renderError("tags")}
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Aliases TR / Türkçe Arama İfadeleri
              </label>
              <input
                value={form.aliases}
                onChange={(event) => updateForm("aliases", event.target.value)}
                placeholder="barkod okuyucu, kablolu okuyucu, 1d scanner"
                className={inputClass("aliases")}
              />
              {renderError("aliases")}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">
              Alternative Products / Alternatif Ürünler
            </label>

            <div
              className={`rounded-2xl border bg-slate-50 p-4 dark:bg-slate-950 ${
                errors.substitute_product_ids
                  ? "border-red-400 dark:border-red-500"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              {selectedAlternatives.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedAlternatives.map((product) => (
                    <button
                      type="button"
                      key={product.product_id}
                      onClick={() => removeAlternative(product.product_id)}
                      className="rounded-full bg-blue-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800"
                    >
                      {product.name_tr} ×
                    </button>
                  ))}
                </div>
              )}

              <input
                value={alternativeSearch}
                onChange={(event) => setAlternativeSearch(event.target.value)}
                placeholder="Search and select alternative products..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-900 focus:ring-4 focus:ring-blue-900/10 dark:border-slate-700 dark:bg-slate-900"
              />

              {alternativeSearch && (
                <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  {alternativeOptions.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-slate-400">
                      No matching products.
                    </p>
                  ) : (
                    alternativeOptions.map((product) => (
                      <button
                        type="button"
                        key={product.product_id}
                        onClick={() => addAlternative(product.product_id)}
                        className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {product.name_tr}
                          </p>
                          <p className="text-xs text-slate-500">
                            {product.product_id} · {product.sku}
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Add
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {renderError("substitute_product_ids")}
          </div>

          <div className="mt-5">
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Notes / Notlar
            </label>
            <textarea
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              placeholder="Entry-level wired scanner. No QR support."
              className={`${inputClass("notes")} h-24 w-full`}
            />
            {renderError("notes")}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-2xl bg-blue-900 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-blue-800">
              Save Product
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Reset
            </button>
          </div>
        </form>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            placeholder="Search product, SKU, brand..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-900 dark:border-slate-700 dark:bg-slate-950"
          />

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            {availableCategories.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All categories" : item}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="all">All stock</option>
            <option value="in_stock">In stock</option>
            <option value="low_stock">Low stock</option>
            <option value="out_of_stock">Out of stock</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="name_tr">Sort by name</option>
            <option value="price_asc">Price low to high</option>
            <option value="price_desc">Price high to low</option>
            <option value="stock_asc">Stock low to high</option>
            <option value="stock_desc">Stock high to low</option>
          </select>
        </div>
      </div>

      <DataTable
        title="Product Catalog"
        description={`${filteredProducts.length} products found`}
        rows={filteredProducts}
        columns={[
          { key: "product_id", label: "Product ID" },
          { key: "sku", label: "SKU" },
          {
            key: "name_tr",
            label: "Product",
            render: (product) => (
              <div>
                <p className="font-black text-slate-900 dark:text-white">
                  {product.name_tr}
                </p>
                <p className="text-xs text-slate-500">
                  {product.brand} · {product.category}
                </p>
              </div>
            ),
          },
          {
            key: "price_try",
            label: "Price",
            render: (product) => (
              <span className="font-black">{formatTRY(product.price_try)}</span>
            ),
          },
          {
            key: "stock_qty",
            label: "Stock",
            render: (product) => {
              const stock = Number(product.stock_qty);

              const color =
                stock === 0
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : stock <= 3
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";

              return (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${color}`}
                >
                  {product.stock_qty}
                </span>
              );
            },
          },
          {
            key: "substitute_product_ids",
            label: "Alternatives",
            render: (product) => (
              <span className="text-xs font-bold text-slate-500">
                {product.substitute_product_ids?.length || 0} products
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (product) => (
              <button
                onClick={() => deleteProduct(product.product_id).then(loadProducts)}
                className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-100 dark:bg-red-950 dark:text-red-300"
              >
                Delete
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}