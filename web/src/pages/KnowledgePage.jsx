import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import {
  createKnowledgeEntry,
  getKnowledgeEntries,
} from "../services/knowledgeService";
import {
  KNOWLEDGE_TOPICS,
  buildKnowledgePayload,
  generateKnowledgeId,
  generateKnowledgeSource,
  validateKnowledgeForm,
} from "../utils/knowledge";

const emptyForm = {
  topic: "",
  locale: "tr",
  title: "",
  body: "",
  applies_to: "",
  effective_from: "2026-04-01",
};

export default function KnowledgePage() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");

  const loadEntries = async () => {
    setEntries(await getKnowledgeEntries());
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const generatedId = useMemo(() => {
    return generateKnowledgeId(form.topic, entries);
  }, [form.topic, entries]);

  const generatedSource = useMemo(() => {
    return generateKnowledgeSource(form.topic, form.effective_from);
  }, [form.topic, form.effective_from]);

  const availableTopics = useMemo(() => {
    return [
      "all",
      ...new Set(entries.map((entry) => entry.topic).filter(Boolean)),
    ];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase();

    return entries.filter((entry) => {
      const matchesSearch =
        entry.knowledge_id?.toLowerCase().includes(q) ||
        entry.topic?.toLowerCase().includes(q) ||
        entry.title?.toLowerCase().includes(q) ||
        entry.body?.toLowerCase().includes(q) ||
        entry.source?.toLowerCase().includes(q);

      const matchesTopic = topicFilter === "all" || entry.topic === topicFilter;

      return matchesSearch && matchesTopic;
    });
  }, [entries, search, topicFilter]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateKnowledgeForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setFeedback({
        type: "error",
        message: "Please fix the highlighted fields before saving.",
      });
      return;
    }

    try {
      const payload = buildKnowledgePayload(form, entries);

      await createKnowledgeEntry(payload);

      setFeedback({
        type: "success",
        message: `Knowledge entry ${payload.knowledge_id} was created successfully.`,
      });

      setForm(emptyForm);
      setShowForm(false);
      await loadEntries();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error?.response?.data?.detail ||
          "Knowledge entry could not be created. Please try again.",
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
            Knowledge Base
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage policy, compatibility and fallback sources.
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
          {showForm ? "Close Form" : "+ Add Entry"}
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
                New Knowledge Entry
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                ID and source are generated automatically from topic and date.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Generated ID
                </p>
                <p className="font-black text-blue-900 dark:text-blue-300">
                  {generatedId}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Generated Source
                </p>
                <p className="font-black text-blue-900 dark:text-blue-300">
                  {generatedSource}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Topic
              </label>
              <select
                value={form.topic}
                onChange={(event) => updateForm("topic", event.target.value)}
                className={inputClass("topic")}
              >
                <option value="">Select topic</option>
                {KNOWLEDGE_TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
              {renderError("topic")}
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Locale
              </label>
              <input
                value={form.locale}
                onChange={(event) => updateForm("locale", event.target.value)}
                placeholder="tr"
                className={inputClass("locale")}
              />
              {renderError("locale")}
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Effective From
              </label>
              <input
                type="date"
                value={form.effective_from}
                onChange={(event) =>
                  updateForm("effective_from", event.target.value)
                }
                className={inputClass("effective_from")}
              />
              {renderError("effective_from")}
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Title
              </label>
              <input
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder="Donanım ve yazılım iade politikası"
                className={inputClass("title")}
              />
              {renderError("title")}
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Applies To
              </label>
              <input
                value={form.applies_to}
                onChange={(event) =>
                  updateForm("applies_to", event.target.value)
                }
                placeholder="hardware, software, service"
                className={inputClass("applies_to")}
              />
              {renderError("applies_to")}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Body
            </label>
            <textarea
              value={form.body}
              onChange={(event) => updateForm("body", event.target.value)}
              placeholder="Policy body..."
              className={`${inputClass("body")} h-36 w-full`}
            />
            {renderError("body")}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-2xl bg-blue-900 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-blue-800">
              Save Entry
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
        <div className="grid gap-3 md:grid-cols-2">
          <input
            placeholder="Search by title, topic, source, body..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-900 dark:border-slate-700 dark:bg-slate-950"
          />

          <select
            value={topicFilter}
            onChange={(event) => setTopicFilter(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            {availableTopics.map((topic) => (
              <option key={topic} value={topic}>
                {topic === "all" ? "All topics" : topic}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        title="Knowledge Entries"
        description={`${filteredEntries.length} entries found`}
        rows={filteredEntries}
        columns={[
          { key: "knowledge_id", label: "ID" },
          {
            key: "topic",
            label: "Topic",
            render: (entry) => (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {entry.topic}
              </span>
            ),
          },
          {
            key: "title",
            label: "Title",
            render: (entry) => (
              <div>
                <p className="font-black text-slate-900 dark:text-white">
                  {entry.title}
                </p>
                <p className="line-clamp-1 text-xs text-slate-500">
                  {entry.body}
                </p>
              </div>
            ),
          },
          { key: "locale", label: "Locale" },
          { key: "source", label: "Source" },
          {
            key: "applies_to",
            label: "Applies To",
            render: (entry) => (
              <span className="text-xs font-bold text-slate-500">
                {Array.isArray(entry.applies_to)
                  ? entry.applies_to.join(", ")
                  : entry.applies_to}
              </span>
            ),
          },
          { key: "effective_from", label: "Effective From" },
        ]}
      />
    </div>
  );
}