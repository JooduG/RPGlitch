import fs from "fs";
import path from "path";

const filePath = path.resolve("ANEX_Lorebook_Readable.md");

try {
  let content = fs.readFileSync(filePath, "utf8");

  const tags = [
    "ANEX_BLACKTIDE",
    "SYSTEM_BOOT_SEQUENCE",
    "BLACKTIDE_AUXILIARY",
    "CHRONO_KINETICS",
    "PSYCHOLOGICAL_DEPTH",
    "SOCIOCULTURAL_ENGINE",
    "ENTROPY_SYSTEM",
    "NPC_ECOLOGY",
    "ENSEMBLE_DYNAMICS",
    "CROWD_DENSITY_PROTOCOL",
    "CINEMATIC_DIRECTOR",
    "top",
    "SCENE_STATE",
    "hud",
    "VISUAL_STORYTELLING_ENGINE",
    "FATE_BRANCHING",
  ];

  let count = 0;

  tags.forEach((tag) => {
    // Regex to find the tag block.
    // Opening tag: <TAG ... > or <TAG>
    // Content: Anything including newlines
    // Closing tag: </TAG>
    // We look for the literal string.

    // Use a simpler approach than complex regex if possible, but regex is best here.
    // We use [\s\S]*? for non-greedy match across newlines.
    const regex = new RegExp(
      `(<${tag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tag}>)`,
      "gi",
    );

    content = content.replace(regex, (match) => {
      count++;
      return "```xml\n" + match + "\n```";
    });
  });

  fs.writeFileSync(filePath, content);
  console.log(
    `Successfully formatted ${count} blocks in ANEX_Lorebook_Readable.md`,
  );
} catch (error) {
  console.error("Error formatting file:", error);
  process.exit(1);
}
