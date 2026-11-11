# Message inbox

The contact form on the website can save each visitor's message as a file in a GitHub repository. GitHub Pages only serves static files, so a small free service does the saving: a Cloudflare Worker (`worker.js`).

```
Visitor fills in the form  →  Cloudflare Worker  →  new file in your inbox repo
                                                    messages/2026/11/2026-11-11T17-25-15Z-name-ab12cd.md
```

Each file holds the visitor's name, optional email, message, the time, their IP address, country and browser.

Until this is set up, the form still works: it opens the visitor's email app with the message filled in.

## Keep the inbox private

Use a **separate private repository** for messages, not the website repository. The website repository is public, so anything saved there (messages, email addresses, IP addresses) could be read by anyone.

## Set-up (about 10 minutes, free)

1. **Create the inbox repository.** On GitHub, create a new **private** repository, for example `website-messages`.

2. **Create a token for it.** GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.
   - Repository access: *Only select repositories* → `website-messages`
   - Permissions: *Contents* → *Read and write*
   - Copy the token. Never put it in this repository or on the website.

3. **Deploy the Worker.** Create a free Cloudflare account, then from this `server/` folder run:

   ```bash
   npx wrangler login
   ```

   ```bash
   npx wrangler secret put GITHUB_TOKEN
   ```

   ```bash
   npx wrangler deploy
   ```

   Check `wrangler.toml` first: `GITHUB_REPO` must be your inbox repository (`owner/name`). The deploy prints the Worker's address, like `https://website-message-inbox.<your-subdomain>.workers.dev`.

4. **Connect the form.** In `contact.html`, find `data-endpoint=""` on the form and put the Worker's address between the quotes. Commit and push.

Send yourself a test message from the live site; a new file should appear in the inbox repository within a few seconds.

## Protections built in

- Only requests from `https://abdulbasitbehlim.github.io` are accepted.
- Name, email and message have length limits, and the email format is checked.
- A hidden field catches simple spam bots.
- The token lives only in Cloudflare's secret store.

For extra protection against floods, add a rate-limiting rule for the Worker in the Cloudflare dashboard.

## Tell visitors

The form tells visitors that their IP address and country are stored with the message. Keep that note if you keep storing them.
