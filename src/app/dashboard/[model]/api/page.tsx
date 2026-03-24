"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────
interface FieldDef {
  name: string;
  label: string;
  type: string;
  required: boolean;
  unique: boolean;
  options: string[] | null;
}

interface ModelMeta {
  id: string;
  name: string;
  label: string;
  fields: FieldDef[];
  _count: { records: number };
}

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  label: string;
  description: string;
  params?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  body?: string;
  response?: string;
}

// ─── Helpers ────────────────────────────────────────────
const METHOD_COLOR: Record<string, string> = {
  GET: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  POST: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  PUT: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  DELETE:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold tracking-wide shrink-0",
        METHOD_COLOR[method] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {method}
    </span>
  );
}

function exampleBody(fields: FieldDef[]): string {
  const obj: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === "TEXT") obj[f.name] = `example ${f.label.toLowerCase()}`;
    else if (f.type === "NUMBER") obj[f.name] = 0;
    else if (f.type === "BOOLEAN") obj[f.name] = false;
    else if (f.type === "DATE") obj[f.name] = "2024-01-01";
    else if (f.type === "SELECT") obj[f.name] = f.options?.[0] ?? "option_a";
    else if (f.type === "MULTI_SELECT")
      obj[f.name] = f.options?.slice(0, 1) ?? ["option_a"];
    else if (f.type === "JSON") obj[f.name] = {};
  }
  return JSON.stringify(obj, null, 2);
}

function exampleRecord(fields: FieldDef[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    id: "clxyz123",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  for (const f of fields) {
    if (f.type === "TEXT") obj[f.name] = `example ${f.label.toLowerCase()}`;
    else if (f.type === "NUMBER") obj[f.name] = 42;
    else if (f.type === "BOOLEAN") obj[f.name] = true;
    else if (f.type === "DATE") obj[f.name] = "2024-01-01";
    else if (f.type === "SELECT") obj[f.name] = f.options?.[0] ?? "option_a";
    else if (f.type === "MULTI_SELECT")
      obj[f.name] = f.options?.slice(0, 2) ?? ["a", "b"];
    else if (f.type === "JSON") obj[f.name] = { key: "value" };
  }
  return obj;
}

// ─── Code snippet generators ────────────────────────────
function snippetFetch(method: string, url: string, body?: string): string {
  const hasBody = body && ["POST", "PUT", "PATCH"].includes(method);
  return `const res = await fetch("${url}", {
  method: "${method}",${
    hasBody
      ? `
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${body}),`
      : ""
  }
});
const data = await res.json();`;
}

function snippetAxios(method: string, url: string, body?: string): string {
  const m = method.toLowerCase();
  const hasBody = body && ["post", "put", "patch"].includes(m);
  if (hasBody) return `const { data } = await axios.${m}("${url}", ${body});`;
  return `const { data } = await axios.${m}("${url}");`;
}

function snippetCurl(method: string, url: string, body?: string): string {
  const hasBody = body && ["POST", "PUT", "PATCH"].includes(method);
  return `curl -X ${method} "${url}"${
    hasBody
      ? ` \\
  -H "Content-Type: application/json" \\
  -d '${body}'`
      : ""
  }`;
}

// ─── Copy button ─────────────────────────────────────────
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Code block ─────────────────────────────────────────
function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  return (
    <div className="relative group rounded-lg bg-muted/60 border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
        <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
          {lang}
        </span>
        <CopyButton text={code} />
      </div>
      <ScrollArea className="max-h-64">
        <pre className="p-4 text-xs font-mono leading-relaxed text-foreground overflow-x-auto whitespace-pre">
          {code}
        </pre>
      </ScrollArea>
    </div>
  );
}

// ─── Response viewer ────────────────────────────────────
function ResponseViewer({
  status,
  body,
  duration,
}: {
  status: number | null;
  body: string | null;
  duration: number | null;
}) {
  if (status === null)
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Hit Run to see the response
        </p>
      </div>
    );

  const isOk = status >= 200 && status < 300;
  const colored = isOk
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/40 border-b border-border">
        <span className={cn("text-sm font-bold tabular-nums", colored)}>
          {status}
        </span>
        <span className="text-xs text-muted-foreground">
          {isOk ? "OK" : "Error"}
        </span>
        {duration !== null && (
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">
            {duration}ms
          </span>
        )}
        {body && <CopyButton text={body} />}
      </div>
      <ScrollArea className="max-h-72">
        <pre className="p-4 text-xs font-mono leading-relaxed text-foreground whitespace-pre overflow-x-auto">
          {body ?? ""}
        </pre>
      </ScrollArea>
    </div>
  );
}

// ─── Endpoint card ───────────────────────────────────────
function EndpointCard({
  endpoint,
  baseUrl,
  model,
  fields,
  defaultOpen,
}: {
  endpoint: Endpoint;
  baseUrl: string;
  model: string;
  fields: FieldDef[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [urlOverride, setUrlOverride] = useState("");
  const [bodyOverride, setBodyOverride] = useState(
    endpoint.body
      ? JSON.stringify(
          JSON.parse(
            endpoint.body
              .replace(/"example [^"]+"/g, '"test"')
              .replace(/0/g, "1"),
          ),
          null,
          2,
        )
      : "",
  );

  const fullUrl = `${baseUrl}${endpoint.path}`;
  const runUrl = urlOverride || fullUrl;

  const run = async () => {
    setRunning(true);
    const start = Date.now();
    try {
      const opts: RequestInit = { method: endpoint.method };
      if (bodyOverride && ["POST", "PUT", "PATCH"].includes(endpoint.method)) {
        opts.headers = { "Content-Type": "application/json" };
        opts.body = bodyOverride;
      }
      const res = await fetch(runUrl, opts);
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
      setStatus(res.status);
      setBody(pretty);
      setDuration(Date.now() - start);
    } catch (e) {
      setStatus(0);
      setBody(e instanceof Error ? e.message : "Network error");
      setDuration(Date.now() - start);
    } finally {
      setRunning(false);
    }
  };

  const hasBody = ["POST", "PUT", "PATCH"].includes(endpoint.method);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header — always visible */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-mono text-foreground flex-1 truncate">
          {endpoint.path}
        </code>
        <span className="text-xs text-muted-foreground hidden sm:block shrink-0">
          {endpoint.label}
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-border">
          {/* Description */}
          <div className="px-4 py-3 bg-muted/20 border-b border-border">
            <p className="text-sm text-muted-foreground">
              {endpoint.description}
            </p>
          </div>

          <div className="p-4 flex flex-col gap-5">
            {/* URL bar */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">URL</Label>
              <div className="flex gap-2">
                <Input
                  value={urlOverride || fullUrl}
                  onChange={(e) => setUrlOverride(e.target.value)}
                  className="font-mono text-xs flex-1"
                />
                <Button
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={run}
                  disabled={running}
                >
                  <Play
                    className={cn("w-3.5 h-3.5", running && "animate-pulse")}
                  />
                  {running ? "Running…" : "Run"}
                </Button>
              </div>
            </div>

            {/* Query params */}
            {endpoint.params && endpoint.params.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs">Query parameters</Label>
                <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
                  {endpoint.params.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-start gap-3 px-3 py-2.5 text-sm"
                    >
                      <code className="text-xs font-mono text-foreground w-28 shrink-0 pt-0.5">
                        {p.name}
                      </code>
                      <span className="text-xs text-muted-foreground w-16 shrink-0 pt-0.5">
                        {p.type}
                      </span>
                      <span className="text-xs text-muted-foreground flex-1">
                        {p.description}
                      </span>
                      {p.required && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 h-4 shrink-0"
                        >
                          required
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request body */}
            {hasBody && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Request body</Label>
                <Textarea
                  value={bodyOverride}
                  onChange={(e) => setBodyOverride(e.target.value)}
                  className="font-mono text-xs resize-y min-h-30"
                  placeholder='{"field": "value"}'
                />
              </div>
            )}

            {/* Code snippets */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs">Code snippets</Label>
              <Tabs defaultValue="fetch">
                <TabsList className="h-7">
                  <TabsTrigger value="fetch" className="text-xs px-3 h-6">
                    fetch
                  </TabsTrigger>
                  <TabsTrigger value="axios" className="text-xs px-3 h-6">
                    axios
                  </TabsTrigger>
                  <TabsTrigger value="curl" className="text-xs px-3 h-6">
                    curl
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="fetch" className="mt-2">
                  <CodeBlock
                    lang="javascript"
                    code={snippetFetch(
                      endpoint.method,
                      runUrl,
                      hasBody ? bodyOverride : undefined,
                    )}
                  />
                </TabsContent>
                <TabsContent value="axios" className="mt-2">
                  <CodeBlock
                    lang="javascript"
                    code={snippetAxios(
                      endpoint.method,
                      runUrl,
                      hasBody ? bodyOverride : undefined,
                    )}
                  />
                </TabsContent>
                <TabsContent value="curl" className="mt-2">
                  <CodeBlock
                    lang="bash"
                    code={snippetCurl(
                      endpoint.method,
                      runUrl,
                      hasBody ? bodyOverride : undefined,
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Response example */}
            {endpoint.response && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Example response</Label>
                <CodeBlock code={endpoint.response} />
              </div>
            )}

            {/* Live response */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Response</Label>
              <ResponseViewer status={status} body={body} duration={duration} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────
export default function ApiPage() {
  const { model: modelName } = useParams<{ model: string }>();
  const [modelData, setModelData] = useState<ModelMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then(async (all: ModelMeta[]) => {
        const found = all.find((m) => m.name === modelName);
        if (!found) {
          setLoading(false);
          return;
        }
        const detail = await fetch(`/api/models/${found.id}`).then((r) =>
          r.json(),
        );
        setModelData(detail);
      })
      .finally(() => setLoading(false));
  }, [modelName]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const endpoints: Endpoint[] = modelData
    ? [
        {
          method: "GET",
          path: `/api/dynamic/${modelName}`,
          label: "List records",
          description:
            "Returns a paginated list of all records. Supports sorting, filtering, and full-text search via the RecordIndex.",
          params: [
            {
              name: "page",
              type: "number",
              required: false,
              description: "Page number (default: 1)",
            },
            {
              name: "limit",
              type: "number",
              required: false,
              description: "Records per page, max 100 (default: 50)",
            },
            {
              name: "sort",
              type: "string",
              required: false,
              description: "Field to sort by (default: createdAt)",
            },
            {
              name: "dir",
              type: "asc|desc",
              required: false,
              description: "Sort direction (default: desc)",
            },
            {
              name: "search",
              type: "string",
              required: false,
              description: "Full-text search across all indexed fields",
            },
            {
              name: "filter[field]",
              type: "string",
              required: false,
              description: "Filter by a specific field value",
            },
          ],
          response: JSON.stringify(
            {
              data: [exampleRecord(modelData.fields)],
              meta: {
                page: 1,
                limit: 50,
                total: modelData._count.records,
                totalPages: 1,
                count: 1,
                sort: "createdAt",
                dir: "desc",
              },
            },
            null,
            2,
          ),
        },
        {
          method: "GET",
          path: `/api/dynamic/${modelName}/:id`,
          label: "Get record",
          description: "Returns a single record by its ID.",
          response: JSON.stringify(exampleRecord(modelData.fields), null, 2),
        },
        {
          method: "POST",
          path: `/api/dynamic/${modelName}`,
          label: "Create record",
          description:
            "Creates a new record. Required fields must be provided. Automatically syncs the RecordIndex.",
          body: exampleBody(modelData.fields),
          response: JSON.stringify(
            { ...exampleRecord(modelData.fields) },
            null,
            2,
          ),
        },
        {
          method: "PUT",
          path: `/api/dynamic/${modelName}/:id`,
          label: "Update record",
          description:
            "Updates a record by ID. Merges the provided fields with existing data — you only need to send changed fields.",
          body: exampleBody(modelData.fields.slice(0, 2)),
          response: JSON.stringify(exampleRecord(modelData.fields), null, 2),
        },
        {
          method: "DELETE",
          path: `/api/dynamic/${modelName}/:id`,
          label: "Delete record",
          description:
            "Permanently deletes a record and removes it from the RecordIndex. Returns 204 No Content.",
        },
        {
          method: "DELETE",
          path: `/api/dynamic/${modelName}/bulk-delete`,
          label: "Bulk delete",
          description:
            "Deletes multiple records in a single transaction. Pass an array of IDs in the request body.",
          body: JSON.stringify({ ids: ["clxyz123", "clxyz456"] }, null, 2),
          response: JSON.stringify({ deleted: 2 }, null, 2),
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="p-8 max-w-4xl space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (!modelData) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive">Model not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/dashboard/${modelName}`}>
          <Button variant="ghost" size="icon" className="w-8 h-8 -ml-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            href={`/dashboard/${modelName}`}
            className="hover:text-foreground transition-colors"
          >
            {modelData.label}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            API
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-medium tracking-tight">
          {modelData.label} API
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live REST endpoints for{" "}
          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
            {modelName}
          </code>
          . All endpoints are immediately available — no setup required.
        </p>
      </div>

      {/* Base URL */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 mb-6 flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground shrink-0">
          Base URL
        </span>
        <code className="font-mono text-sm flex-1 truncate">
          {baseUrl}/api/dynamic/{modelName}
        </code>
        <CopyButton text={`${baseUrl}/api/dynamic/${modelName}`} />
      </div>

      {/* Field schema */}
      <div className="rounded-xl border border-border overflow-hidden mb-6">
        <div className="px-4 py-3 bg-muted/40 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Schema — {modelData.fields.length} field
            {modelData.fields.length !== 1 ? "s" : ""}
          </p>
        </div>
        {modelData.fields.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            No fields defined yet.{" "}
            <Link
              href={`/dashboard/${modelName}/fields`}
              className="underline underline-offset-2"
            >
              Add fields
            </Link>
          </p>
        ) : (
          <div className="divide-y divide-border">
            {modelData.fields.map((field) => (
              <div
                key={field.name}
                className="flex items-center gap-3 px-4 py-2.5 text-sm"
              >
                <code className="font-mono text-xs w-32 shrink-0 text-foreground">
                  {field.name}
                </code>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium w-24 text-center shrink-0">
                  {field.type.replace("_", " ")}
                </span>
                <div className="flex items-center gap-1.5 flex-1">
                  {field.required && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 h-4 font-normal"
                    >
                      required
                    </Badge>
                  )}
                  {field.unique && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 h-4 font-normal"
                    >
                      unique
                    </Badge>
                  )}
                  {field.options && field.options.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {field.options.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {/* System fields */}
            {["id", "createdAt", "updatedAt"].map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 px-4 py-2.5 text-sm opacity-50"
              >
                <code className="font-mono text-xs w-32 shrink-0">{f}</code>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium w-24 text-center shrink-0">
                  {f === "id" ? "cuid" : "datetime"}
                </span>
                <span className="text-xs text-muted-foreground">
                  auto-generated
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator className="mb-6" />

      {/* Endpoints */}
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Endpoints
      </p>
      <div className="flex flex-col gap-3">
        {endpoints.map((ep, i) => (
          <EndpointCard
            key={ep.method + ep.path}
            endpoint={ep}
            baseUrl={baseUrl}
            model={modelName}
            fields={modelData.fields}
            defaultOpen={i === 0}
          />
        ))}
      </div>
    </div>
  );
}
