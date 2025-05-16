import { promises as fs } from "fs";
import path from "path";

export async function loadGoogleFont(font: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(
    text
  )}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/
  );

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status == 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error("failed to load font data");
}

export async function loadImage(url: string): Promise<ArrayBuffer> {
  const logoImageRes = await fetch(url);

  if (!logoImageRes.ok) {
    throw new Error(`Failed to fetch logo image: ${logoImageRes.statusText}`);
  }

  return await logoImageRes.arrayBuffer();
}

/**
 * Load a local font file
 * @param filePath - Path to the font file relative to the public directory
 * @returns ArrayBuffer containing the font data
 */
export async function loadLocalFont(filePath: string): Promise<ArrayBuffer> {
  // Construct absolute path from project root
  const fontPath = path.join(process.cwd(), "public", filePath);
  try {
    // Read file and return as ArrayBuffer
    const fontData = await fs.readFile(fontPath);
    return fontData as unknown as ArrayBuffer;
  } catch (error) {
    console.error(`Failed to load font from ${fontPath}:`, error);
    throw new Error(`Failed to load font: ${error}`);
  }
}
