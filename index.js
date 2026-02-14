export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/callback") return new Response("Not found", { status: 404 });

    const code = url.searchParams.get("code");
    if (!code) return new Response("No code provided", { status: 400 });

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: env.CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: env.REDIRECT_URI
      }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const accessToken = (await tokenRes.json()).access_token;
    if (!accessToken) return new Response("Failed to get token");

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const user = await userRes.json();

    const guildRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const guilds = await guildRes.json();

    let message = `**User:** ${user.username}#${user.discriminator}\n**Guilds:**\n`;
    guilds.forEach(g => message += `- ${g.name} (ID: ${g.id})\n`);

    await fetch(env.WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });

    return new Response("Authorized! You can close this tab.");
  }
}
