import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import { getQuoteById, getQuotes } from "../services/quoteService";
import { formatTRY } from "../utils/currency";

export default function QuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);

  useEffect(() => {
    getQuotes().then(setQuotes);
  }, []);

  const openQuote = async (quoteId) => {
    setSelectedQuote(await getQuoteById(quoteId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Quotes</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Web and mobile read the same persistent quote state.
        </p>
      </div>

      <DataTable
        title="Quote Drafts"
        description="Click a quote ID to inspect its items."
        rows={quotes}
        columns={[
          {
            key: "quote_id",
            label: "Quote",
            render: (quote) => (
              <button
                onClick={() => openQuote(quote.quote_id)}
                className="font-black text-blue-600 hover:underline"
              >
                {quote.quote_id}
              </button>
            ),
          },
          { key: "customer_id", label: "Customer" },
          {
            key: "status",
            label: "Status",
            render: (quote) => (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {quote.status}
              </span>
            ),
          },
          { key: "created_by_channel", label: "Channel" },
          {
            key: "subtotal_try",
            label: "Subtotal",
            render: (quote) => formatTRY(quote.subtotal_try),
          },
          {
            key: "discount_percent",
            label: "Discount",
            render: (quote) => `${quote.discount_percent}%`,
          },
          {
            key: "total_try",
            label: "Total",
            render: (quote) => (
              <span className="font-black">{formatTRY(quote.total_try)}</span>
            ),
          },
        ]}
      />

      {selectedQuote && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">{selectedQuote.quote_id}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Customer: {selectedQuote.customer_id} · Currency: {selectedQuote.currency}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Subtotal</p>
                <p className="font-black">{formatTRY(selectedQuote.subtotal_try)}</p>
              </div>

              <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Discount</p>
                <p className="font-black">{selectedQuote.discount_percent}%</p>
              </div>

              <div className="rounded-2xl bg-blue-600 px-4 py-3 text-white">
                <p className="text-xs text-white/70">Total</p>
                <p className="font-black">{formatTRY(selectedQuote.total_try)}</p>
              </div>
            </div>
          </div>

          <DataTable
            title="Quote Items"
            rows={selectedQuote.items || []}
            columns={[
              { key: "quote_item_id", label: "Item ID" },
              { key: "product_id", label: "Product" },
              { key: "quantity", label: "Qty" },
              {
                key: "unit_price_try",
                label: "Unit Price",
                render: (item) => formatTRY(item.unit_price_try),
              },
              {
                key: "status",
                label: "Status",
                render: (item) => (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {item.status}
                  </span>
                ),
              },
            ]}
          />
        </section>
      )}
    </div>
  );
}