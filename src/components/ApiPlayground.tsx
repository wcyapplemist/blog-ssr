"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PresetApi {
  label: string;
  url: string;
  description: string;
}

const presetApis: PresetApi[] = [
  {
    label: "Random Joke",
    url: "https://official-joke-api.appspot.com/random_joke",
    description: "Get a random joke",
  },
  {
    label: "Random Dog",
    url: "https://dog.ceo/api/breeds/image/random",
    description: "Get a random dog image",
  },
  {
    label: "GitHub User",
    url: "https://api.github.com/users/wcyapplemist",
    description: "Query GitHub user info",
  },
  {
    label: "Cat Fact",
    url: "https://catfact.ninja/fact",
    description: "Get a random cat fact",
  },
  {
    label: "Random Advice",
    url: "https://api.adviceslip.com/advice",
    description: "Get a random piece of advice",
  },
  {
    label: "Random Fact",
    url: "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en",
    description: "Get a random fun fact",
  },
];

interface ApiResponse {
  status: number;
  statusText: string;
  elapsed: number;
  data: unknown;
}

function statusColor(code: number): string {
  if (code >= 200 && code < 300) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (code >= 400 && code < 500) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
}

export default function ApiPlayground() {
  const [url, setUrl] = useState(presetApis[0].url);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendRequest() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(url.trim())}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Request failed");
        return;
      }

      setResponse(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  function selectPreset(preset: PresetApi) {
    setUrl(preset.url);
    setResponse(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Preset APIs (click to select)
        </div>
        <div className="flex flex-wrap gap-2">
          {presetApis.map((preset) => (
            <Button
              key={preset.label}
              variant={url === preset.url ? "default" : "outline"}
              size="sm"
              onClick={() => selectPreset(preset)}
              title={preset.description}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Badge variant="outline" className="shrink-0 self-center px-3 py-1 text-xs font-mono">
          GET
        </Badge>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter an API URL..."
          className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-50"
          onKeyDown={(e) => e.key === "Enter" && sendRequest()}
        />
        <Button onClick={sendRequest} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {response && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className={statusColor(response.status)}>
              {response.status} {response.statusText}
            </Badge>
            <span className="text-xs text-zinc-500">
              {response.elapsed}ms
            </span>
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <pre className="overflow-x-auto text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
