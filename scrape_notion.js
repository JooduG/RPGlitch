import fs from "node:fs";

const token = "ntn_G88285873721qxg9rblWEklLtZ23kefD8UQx1aspS6L4qE";
const version = "2022-06-28";

async function notionRequest(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": version,
      "Content-Type": "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(
    `https://api.notion.com/v1/${endpoint}`,
    options,
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Notion API Error: ${JSON.stringify(error)}`);
  }
  return response.json();
}

async function getBlockChildren(blockId) {
  let results = [];
  let cursor = undefined;

  do {
    const data = await notionRequest(
      `blocks/${blockId}/children${cursor ? `?start_cursor=${cursor}` : ""}`,
    );
    results = results.concat(data.results);
    cursor = data.next_cursor;
  } while (cursor);

  return results;
}

function blockToMarkdown(block) {
  const type = block.type;
  const content = block[type];

  if (!content.rich_text) return "";
  const text = content.rich_text.map((t) => t.plain_text).join("");

  switch (type) {
    case "paragraph":
      return text + "\n\n";
    case "heading_1":
      return "# " + text + "\n\n";
    case "heading_2":
      return "## " + text + "\n\n";
    case "heading_3":
      return "### " + text + "\n\n";
    case "bulleted_list_item":
      return "- " + text + "\n";
    case "numbered_list_item":
      return "1. " + text + "\n";
    case "to_do":
      return `- [${content.checked ? "x" : " "}] ` + text + "\n";
    case "toggle":
      return `<details><summary>${text}</summary>\n\n`;
    case "code":
      return `\`\`\`${content.language}\n${text}\n\`\`\`\n\n`;
    case "quote":
      return `> ${text}\n\n`;
    case "callout":
      return `> [!NOTE]\n> ${text}\n\n`;
    default:
      return "";
  }
}

async function scrapePage(pageId) {
  const children = await getBlockChildren(pageId);
  let md = "";
  for (const child of children) {
    md += blockToMarkdown(child);
    if (child.has_children) {
      md += await scrapePage(child.id);
    }
  }
  return md;
}

async function main() {
  const queries = ["ANEX Core", "ANEX Essentia", "Kazuma's Secret Sauce"];
  let finalOutput = "# 📚 NOTION ARCHIVE SCRAPE (TITAN DATA)\n\n";

  for (const query of queries) {
    console.log(`Searching for: ${query}...`);
    try {
      const searchResult = await notionRequest("search", "POST", { query });

      for (const page of searchResult.results) {
        if (page.object === "page" || page.object === "database") {
          const title =
            page.properties?.title?.title?.[0]?.plain_text ||
            page.properties?.Name?.title?.[0]?.plain_text ||
            "Untitled";
          console.log(`Scraping page: ${title} (${page.id})...`);
          finalOutput += `\n## 📁 Source: ${title}\n`;
          finalOutput += await scrapePage(page.id);
          finalOutput += "\n---\n";
        }
      }
    } catch (e) {
      console.error(`Error searching/scraping for ${query}:`, e.message);
    }
  }

  fs.writeFileSync("NOTION_SCRAPE.md", finalOutput);
  console.log("Scrape complete. Saved to NOTION_SCRAPE.md");
}

main().catch(console.error);
