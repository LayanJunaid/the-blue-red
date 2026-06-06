const TOPIC_PREFIX_MAP = {
  return_policy: "RET",
  delivery_policy: "SHIP",
  warranty: "WAR",
  quote_validity: "QUOTE",
  discount_policy: "DIS",
  stock_policy: "STOCK",
  compatibility: "COMP",
  fallback: "FB",
  installation: "INS",
  pricing: "PRICE",
  payment_policy: "PAY",
};

const SOURCE_SLUG_MAP = {
  return_policy: "returns",
  delivery_policy: "delivery",
  warranty: "warranty",
  quote_validity: "quotes",
  discount_policy: "discounts",
  stock_policy: "stock",
  compatibility: "compatibility",
  fallback: "fallback",
  installation: "installation",
  pricing: "pricing",
  payment_policy: "payment",
};

export const KNOWLEDGE_TOPICS = [
  "return_policy",
  "delivery_policy",
  "warranty",
  "quote_validity",
  "discount_policy",
  "stock_policy",
  "compatibility",
  "fallback",
  "installation",
  "pricing",
  "payment_policy",
];

export function getKnowledgePrefix(topic) {
  if (!topic) return "GEN";

  return (
    TOPIC_PREFIX_MAP[topic] ||
    topic
      .replace(/[^a-zA-Z0-9]/g, "_")
      .split("_")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 6)
      .toUpperCase() ||
    "GEN"
  );
}

export function generateKnowledgeId(topic, entries) {
  const prefix = getKnowledgePrefix(topic);

  const existingNumbers = entries
    .map((entry) => entry.knowledge_id)
    .filter((id) => id?.startsWith(`KNE-${prefix}-`))
    .map((id) => Number(id.split("-").pop()))
    .filter((num) => !Number.isNaN(num));

  const nextNumber =
    existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

  return `KNE-${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

export function generateKnowledgeSource(topic, effectiveFrom) {
  if (!topic || !effectiveFrom) return "Select topic and date";

  const slug = SOURCE_SLUG_MAP[topic] || topic.replaceAll("_", "-");
  const date = new Date(effectiveFrom);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `policy/${slug}/v${year}-${month}`;
}

export function splitCommaText(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateKnowledgeForm(form) {
  const errors = {};

  if (!form.topic) {
    errors.topic = "Topic is required.";
  }

  if (!form.locale.trim()) {
    errors.locale = "Locale is required.";
  }

  if (!form.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!form.body.trim()) {
    errors.body = "Body is required.";
  }

  if (splitCommaText(form.applies_to).length === 0) {
    errors.applies_to = "At least one applies_to value is required.";
  }

  if (!form.effective_from.trim()) {
    errors.effective_from = "Effective date is required.";
  }

  if (
    form.effective_from &&
    Number.isNaN(new Date(form.effective_from).getTime())
  ) {
    errors.effective_from = "Effective date must be a valid date.";
  }

  return errors;
}

export function buildKnowledgePayload(form, entries) {
  return {
    knowledge_id: generateKnowledgeId(form.topic, entries),
    topic: form.topic,
    locale: form.locale.trim(),
    title: form.title.trim(),
    body: form.body.trim(),
    source: generateKnowledgeSource(form.topic, form.effective_from),
    applies_to: splitCommaText(form.applies_to),
    effective_from: form.effective_from,
  };
}