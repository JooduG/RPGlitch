import fs from "fs";

export function safeStatSync(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (e) {
    if (e.code === 'ENAMETOOLONG') {
      console.warn(`Skipping ${filePath} due to ENAMETOOLONG`);
      return null;
    }
    throw e;
  }
}
