/**
 * src/utils/xml.js
 * 📋 XML ESCAPE UTILITIES
 * Pure, stateless XML escaping helper.
 * ZERO dependencies on any architectural layer.
 */

/**
 * Escapes characters for safe use in XML.
 * @param {string|null|undefined} str
 * @returns {string}
 */
export const escape_xml = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\[/g, "&#91;")
    .replace(/\]/g, "&#93;");
};

/**
 * Escapes content destined for LLM prompt text nodes: keeps XML-tag and Perchance
 * square-bracket safety, but leaves quotes raw so dialogue and names render as real
 * characters instead of &apos;/&quot; noise the model has to decode.
 * Do NOT use inside XML attribute values (e.g. name="...") — those need escape_xml.
 * @param {string|null|undefined} str
 * @returns {string}
 */
export const prompt_escape = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;");
};
