import { load } from "cheerio";

function extractTextFromHTMLHelper(html: string) {
  const $ = load(html);
  const text = $("body").text();
  return text;
}

export { extractTextFromHTMLHelper };
