const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  if (!line.trim()) return;
  try {
    const response = await fetch("https://mcp.deepwiki.com/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: line,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Bridge Error] Server returned ${response.status}: ${errText}`);
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined) {
          process.stdout.write(
            JSON.stringify({
              jsonrpc: "2.0",
              id: msg.id,
              error: {
                code: -32603,
                message: `DeepWiki returned ${response.status}: ${errText}`,
              },
            }) + "\n",
          );
        }
      } catch (_) {
        // Ignore JSON parse errors for invalid input
      }
      return;
    }

    const text = await response.text();
    const lines = text.split("\n");
    for (const l of lines) {
      if (l.startsWith("data: ")) {
        const data = l.slice(6).trim();
        process.stdout.write(data + "\n");
      }
    }
  } catch (err) {
    console.error(`[Bridge Error] ${err.message}`);
    try {
      const msg = JSON.parse(line);
      if (msg.id !== undefined) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: msg.id,
            error: {
              code: -32603,
              message: `Bridge error: ${err.message}`,
            },
          }) + "\n",
        );
      }
    } catch (_) {
      // Ignore JSON parse errors for invalid input
    }
  }
});
