/**
 * Message inbox for abdulbasitbehlim.github.io
 *
 * A Cloudflare Worker. The contact form on the website sends each message here,
 * and this Worker saves it as a Markdown file in a GitHub repository, under
 * messages/<year>/<month>/, with the sender's name, IP address and country.
 *
 * Settings (see server/README.md):
 *   GITHUB_TOKEN    secret   fine-grained token with "Contents: read and write" on the inbox repo
 *   GITHUB_REPO     variable owner/name of the repo that stores messages (keep it PRIVATE)
 *   GITHUB_BRANCH   variable optional, defaults to the repo's default branch
 *   ALLOWED_ORIGIN  variable optional, defaults to https://abdulbasitbehlim.github.io
 */

const DEFAULT_ORIGIN = "https://abdulbasitbehlim.github.io";
const LIMITS = { name: 80, email: 120, message: 4000, page: 300 };

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGIN || DEFAULT_ORIGIN).replace(/\/$/, "");
    const cors = {
      "Access-Control-Allow-Origin": allowed,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };
    const reply = (status, body) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return reply(405, { error: "Only POST is accepted." });
    if ((request.headers.get("Origin") || "").replace(/\/$/, "") !== allowed) {
      return reply(403, { error: "Messages are only accepted from the website." });
    }
    if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return reply(500, { error: "The inbox is not set up yet." });

    let data;
    try {
      const text = await request.text();
      if (text.length > 12000) return reply(413, { error: "That message is too long." });
      data = JSON.parse(text);
    } catch {
      return reply(400, { error: "The message could not be read." });
    }

    const clean = (value, max) => String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
    const name = clean(data.name, LIMITS.name).replace(/[\r\n]+/g, " ");
    const email = clean(data.email, LIMITS.email).replace(/[\r\n]+/g, " ");
    const message = clean(data.message, LIMITS.message);
    const page = clean(data.page, LIMITS.page).replace(/[\r\n]+/g, " ");

    // Hidden field that people never see; bots fill it in. Pretend it worked.
    if (clean(data.website, 200)) return reply(200, { ok: true });

    if (!name) return reply(400, { error: "Please add your name." });
    if (message.length < 5) return reply(400, { error: "Please write a message." });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { error: "That email address doesn't look right." });

    const now = new Date();
    const stamp = now.toISOString().replace(/\.\d+Z$/, "Z");
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const country = (request.cf && request.cf.country) || "unknown";
    const city = (request.cf && request.cf.city) || "";
    const agent = clean(request.headers.get("User-Agent"), 300).replace(/[\r\n]+/g, " ");

    const slug = name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "visitor";
    const random = Math.random().toString(36).slice(2, 8);
    const path = `messages/${stamp.slice(0, 4)}/${stamp.slice(5, 7)}/${stamp.replace(/:/g, "-")}-${slug}-${random}.md`;

    const file = [
      "---",
      `name: ${JSON.stringify(name)}`,
      `email: ${JSON.stringify(email)}`,
      `received: ${stamp}`,
      `ip: ${JSON.stringify(ip)}`,
      `country: ${JSON.stringify(country)}`,
      `city: ${JSON.stringify(city)}`,
      `page: ${JSON.stringify(page)}`,
      `browser: ${JSON.stringify(agent)}`,
      "---",
      "",
      `# Message from ${name}`,
      "",
      message,
      "",
    ].join("\n");

    const body = { message: `Message from ${name}`, content: toBase64(file) };
    if (env.GITHUB_BRANCH) body.branch = env.GITHUB_BRANCH;

    const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "website-message-inbox",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("GitHub refused the message:", response.status, await response.text());
      return reply(502, { error: "The message could not be saved." });
    }
    return reply(200, { ok: true });
  },
};

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
