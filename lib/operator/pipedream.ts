import { fetchWithTimeout } from "@/lib/http";

type PipedreamToken = {
  access_token: string;
  expires_in?: number;
};

type ConnectToken = {
  token: string;
  expires_at?: string;
  connect_link_url?: string;
};

let cachedAccessToken: { value: string; expiresAt: number } | null = null;

function config() {
  const projectId = process.env.PIPEDREAM_PROJECT_ID;
  const clientId = process.env.PIPEDREAM_CLIENT_ID;
  const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET;
  const environment =
    process.env.PIPEDREAM_ENVIRONMENT === "development"
      ? "development"
      : "production";

  if (!projectId || !clientId || !clientSecret) {
    throw new Error("Pipedream Connect is not configured.");
  }
  return { projectId, clientId, clientSecret, environment };
}

export function pipedreamConfigured() {
  return Boolean(
    process.env.PIPEDREAM_PROJECT_ID &&
    process.env.PIPEDREAM_CLIENT_ID &&
    process.env.PIPEDREAM_CLIENT_SECRET,
  );
}

async function accessToken() {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60_000) {
    return cachedAccessToken.value;
  }

  const { clientId, clientSecret } = config();
  const response = await fetchWithTimeout("https://api.pipedream.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const payload = await response.json().catch(() => ({})) as Partial<PipedreamToken> & {
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ?? payload.error ?? "Unable to authenticate Pipedream Connect.",
    );
  }

  const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : 3600;
  cachedAccessToken = {
    value: payload.access_token,
    expiresAt: now + expiresIn * 1000,
  };
  return payload.access_token;
}

function baseHeaders(token: string) {
  const { environment } = config();
  return {
    Authorization: "Bearer " + token,
    "X-PD-Environment": environment,
  };
}

export async function createPipedreamConnectLink(input: {
  externalUserId: string;
  appSlug: string;
  allowedOrigin: string;
  successRedirectUri?: string;
}) {
  const { projectId } = config();
  const token = await accessToken();

  const response = await fetchWithTimeout(
    "https://api.pipedream.com/v1/connect/" +
      encodeURIComponent(projectId) +
      "/tokens",
    {
      method: "POST",
      headers: {
        ...baseHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_user_id: input.externalUserId,
        allowed_origins: [input.allowedOrigin],
        ...(input.successRedirectUri
          ? { success_redirect_uri: input.successRedirectUri }
          : {}),
      }),
    },
  );

  const raw = await response.json().catch(() => ({})) as Record<string, unknown>;
  const data =
    raw.data && typeof raw.data === "object"
      ? raw.data as Record<string, unknown>
      : raw;

  if (!response.ok || typeof data.token !== "string") {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Unable to create Pipedream connection link.",
    );
  }

  const connectToken: ConnectToken = {
    token: data.token,
    expires_at: typeof data.expires_at === "string" ? data.expires_at : undefined,
    connect_link_url:
      typeof data.connect_link_url === "string"
        ? data.connect_link_url
        : undefined,
  };

  const base =
    connectToken.connect_link_url ??
    "https://pipedream.com/_static/connect.html?token=" +
      encodeURIComponent(connectToken.token) +
      "&connectLink=true";
  const url = new URL(base);
  url.searchParams.set("app", input.appSlug);

  return {
    url: url.toString(),
    expiresAt: connectToken.expires_at ?? null,
  };
}

export async function listPipedreamAccounts(externalUserId: string) {
  const { projectId } = config();
  const token = await accessToken();
  const url = new URL(
    "https://api.pipedream.com/v1/connect/" +
      encodeURIComponent(projectId) +
      "/accounts",
  );
  url.searchParams.set("external_user_id", externalUserId);

  const response = await fetchWithTimeout(url.toString(), {
    headers: baseHeaders(token),
  });
  const raw = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error("Unable to list connected app accounts.");

  const data = Array.isArray(raw.data)
    ? raw.data
    : Array.isArray(raw.accounts)
      ? raw.accounts
      : Array.isArray(raw)
        ? raw
        : [];

  return data
    .map((account) => {
      if (!account || typeof account !== "object") return null;
      const value = account as Record<string, unknown>;
      const app =
        typeof value.app === "string"
          ? value.app
          : value.app && typeof value.app === "object" &&
              typeof (value.app as Record<string, unknown>).name_slug === "string"
            ? String((value.app as Record<string, unknown>).name_slug)
            : null;
      const id =
        typeof value.id === "string"
          ? value.id
          : typeof value.authProvisionId === "string"
            ? value.authProvisionId
            : null;
      if (!id || !app) return null;
      return {
        id,
        app,
        name:
          typeof value.name === "string"
            ? value.name
            : typeof value.email === "string"
              ? value.email
              : app,
      };
    })
    .filter((value): value is { id: string; app: string; name: string } => Boolean(value));
}

export async function runPipedreamAction(input: {
  externalUserId: string;
  actionId: string;
  configuredProps: Record<string, unknown>;
}) {
  const { projectId } = config();
  const token = await accessToken();

  const response = await fetchWithTimeout(
    "https://api.pipedream.com/v1/connect/" +
      encodeURIComponent(projectId) +
      "/actions/run",
    {
      method: "POST",
      headers: {
        ...baseHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_user_id: input.externalUserId,
        id: input.actionId,
        configured_props: input.configuredProps,
      }),
    },
  );
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : "Pipedream action failed.",
    );
  }
  return payload;
}


export async function disconnectPipedreamAccount(input: {
  externalUserId: string;
  accountId: string;
}) {
  const { projectId } = config();
  const token = await accessToken();
  const url = new URL(
    "https://api.pipedream.com/v1/connect/" +
      encodeURIComponent(projectId) +
      "/accounts/" +
      encodeURIComponent(input.accountId),
  );
  url.searchParams.set("external_user_id", input.externalUserId);

  const response = await fetchWithTimeout(url.toString(), {
    method: "DELETE",
    headers: baseHeaders(token),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error("Unable to disconnect app account.");
  }
  return { ok: true };
}


export type PipedreamActionSummary = {
  id: string;
  name: string;
  description: string | null;
  app: string;
  props: Array<{
    name: string;
    label: string | null;
    description: string | null;
    type: string | null;
    optional: boolean;
    hidden: boolean;
    remoteOptions: boolean;
  }>;
  readOnly: boolean;
  destructive: boolean;
};

function componentArray(raw: Record<string, unknown>) {
  if (Array.isArray(raw.data)) return raw.data;
  if (
    raw.data &&
    typeof raw.data === "object" &&
    Array.isArray((raw.data as Record<string, unknown>).data)
  ) {
    return (raw.data as Record<string, unknown>).data as unknown[];
  }
  if (Array.isArray(raw.components)) return raw.components;
  return [] as unknown[];
}

export async function listPipedreamActions(appSlug: string, limit = 30) {
  const { projectId } = config();
  const token = await accessToken();
  const url = new URL(
    "https://api.pipedream.com/v1/connect/" +
      encodeURIComponent(projectId) +
      "/components",
  );
  url.searchParams.set("app", appSlug);
  url.searchParams.set("component_type", "action");

  const response = await fetchWithTimeout(url.toString(), {
    headers: baseHeaders(token),
  });
  const raw = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error("Unable to discover connected app tools.");

  return componentArray(raw)
    .slice(0, Math.max(1, Math.min(limit, 60)))
    .map((entry): PipedreamActionSummary | null => {
      if (!entry || typeof entry !== "object") return null;
      const component = entry as Record<string, unknown>;
      const id =
        typeof component.key === "string"
          ? component.key
          : typeof component.id === "string"
            ? component.id
            : null;
      if (!id) return null;

      const rawProps = Array.isArray(component.configurable_props)
        ? component.configurable_props
        : Array.isArray(component.configurableProps)
          ? component.configurableProps
          : [];
      const annotations =
        component.annotations && typeof component.annotations === "object"
          ? component.annotations as Record<string, unknown>
          : {};

      return {
        id,
        name:
          typeof component.name === "string"
            ? component.name
            : typeof annotations.title === "string"
              ? annotations.title
              : id,
        description:
          typeof component.description === "string"
            ? component.description
            : null,
        app: appSlug,
        props: rawProps
          .map((prop) => {
            if (!prop || typeof prop !== "object") return null;
            const value = prop as Record<string, unknown>;
            if (typeof value.name !== "string") return null;
            return {
              name: value.name,
              label: typeof value.label === "string" ? value.label : null,
              description:
                typeof value.description === "string" ? value.description : null,
              type: typeof value.type === "string" ? value.type : null,
              optional: value.optional === true,
              hidden: value.hidden === true,
              remoteOptions: value.remoteOptions === true,
            };
          })
          .filter((prop): prop is PipedreamActionSummary["props"][number] => Boolean(prop))
          .filter((prop) => !prop.hidden),
        readOnly: annotations.readOnlyHint === true,
        destructive: annotations.destructiveHint === true,
      };
    })
    .filter((action): action is PipedreamActionSummary => Boolean(action));
}

export async function retrievePipedreamAction(actionId: string) {
  const { projectId } = config();
  const token = await accessToken();
  const response = await fetchWithTimeout(
    "https://api.pipedream.com/v1/connect/" +
      encodeURIComponent(projectId) +
      "/components/" +
      encodeURIComponent(actionId),
    { headers: baseHeaders(token) },
  );
  const raw = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error("Unable to retrieve connected app tool.");

  const component =
    raw.data && typeof raw.data === "object"
      ? raw.data as Record<string, unknown>
      : raw;
  return component;
}

export async function runPipedreamAppAction(input: {
  externalUserId: string;
  app: string;
  actionId: string;
  configuredProps: Record<string, unknown>;
  accountId?: string | null;
}) {
  const accounts = await listPipedreamAccounts(input.externalUserId);
  const account =
    (input.accountId
      ? accounts.find((candidate) => candidate.id === input.accountId)
      : null) ??
    accounts.find((candidate) => candidate.app === input.app);

  if (!account) {
    throw new Error(
      "No connected " + input.app + " account exists for this workspace.",
    );
  }

  const props: Record<string, unknown> = {
    ...input.configuredProps,
  };
  if (
    !props[input.app] ||
    typeof props[input.app] !== "object"
  ) {
    props[input.app] = { authProvisionId: account.id };
  }

  return runPipedreamAction({
    externalUserId: input.externalUserId,
    actionId: input.actionId,
    configuredProps: props,
  });
}
