import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import StatCard from "../components/StatCard";
import { getProducts } from "../services/productService";
import { getKnowledgeEntries } from "../services/knowledgeService";
import { getQuotes } from "../services/quoteService";
import { getSessions } from "../services/sessionService";
import { formatTRY } from "../utils/currency";

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    Promise.all([
      getProducts(),
      getKnowledgeEntries(),
      getQuotes(),
      getSessions(),
    ]).then(([productsData, knowledgeData, quotesData, sessionsData]) => {
      setProducts(productsData);
      setKnowledge(knowledgeData);
      setQuotes(quotesData);
      setSessions(sessionsData);
    });
  }, []);

  const totalQuoteValue = useMemo(() => {
    return quotes.reduce((sum, quote) => sum + Number(quote.total_try || 0), 0);
  }, [quotes]);

  const lowStockProducts = products.filter((product) => Number(product.stock_qty) <= 3);

  const recentQuotes = quotes.slice(0, 5);

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-3xl bg-blue-900 p-8 text-white shadow-xl">   
       <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/70">
            The Blue Red
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Yapay Zeka Destekli Teklif Asistanı
          </h1>
          <p className="mt-3 text-white/80">
            Ürünleri, bilgi kayıtlarını, ortak teklif durumunu ve tool-call loglarını tek panelden takip et.
          </p>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Products" value={products.length} helper="Active catalog items" icon="◼" />
        <StatCard title="Knowledge" value={knowledge.length} helper="Policy and fallback records" icon="▤" />
        <StatCard title="Quotes" value={quotes.length} helper="Shared quote drafts" icon="▥" />
        <StatCard title="Quote Value" value={formatTRY(totalQuoteValue)} helper="Total visible quote value" icon="●"/>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DataTable
          title="Low Stock Products"
          description="Products that may need operational attention."
          emptyText="No low stock products"
          columns={[
            {
              key: "name_tr",
              label: "Product",
              render: (product) => (
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{product.name_tr}</p>
                  <p className="text-xs text-slate-500">{product.product_id}</p>
                </div>
              ),
            },
            { key: "category", label: "Category" },
            {
              key: "stock_qty",
              label: "Stock",
              render: (product) => (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  {product.stock_qty}
                </span>
              ),
            },
          ]}
          rows={lowStockProducts}
        />

        <DataTable
          title="Recent Quotes"
          description="Latest quote drafts visible to admin."
          emptyText="No quotes yet"
          columns={[
            { key: "quote_id", label: "Quote" },
            { key: "customer_id", label: "Customer" },
            { key: "status", label: "Status" },
            {
              key: "total_try",
              label: "Total",
              render: (quote) => <span className="font-black">{formatTRY(quote.total_try)}</span>,
            },
          ]}
          rows={recentQuotes}
        />
      </section>
    </div>
  );
}