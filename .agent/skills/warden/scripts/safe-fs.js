import fs from "fs";

export function safeStatSync(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (e) {
    if (["ENAMETOOLONG", "ENOENT", "EACCES", "ELOOP"].includes(e.code)) {
      console.warn(`Skipping ${filePath} due to ${e.code}`);
      return null;
    }
    throw e;
  }
}
