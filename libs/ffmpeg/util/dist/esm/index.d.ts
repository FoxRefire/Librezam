import { ProgressCallback } from "./types.js";
/**
 * An util function to fetch data from url string, base64, URL, File or Blob format.
 *
 * Examples:
 * ```ts
 * // URL
 * await fetchFile("http://localhost:3000/video.mp4");
 * // base64
 * await fetchFile("data:<type>;base64,wL2dvYWwgbW9yZ...");
 * // URL
 * await fetchFile(new URL("video.mp4", import.meta.url));
 * // File
 * fileInput.addEventListener('change', (e) => {
 *   await fetchFile(e.target.files[0]);
 * });
 * // Blob
 * const blob = new Blob(...);
 * await fetchFile(blob);
 * ```
 */
export declare const fetchFile: (file?: string | File | Blob) => Promise<Uint8Array>;
/**
 * importScript dynamically import a script, useful when you
 * want to use different versions of ffmpeg.wasm based on environment.
 *
 * Example:
 *
 * ```ts
 * await importScript("http://localhost:3000/ffmpeg.js");
 * ```
 */
export declare const importScript: (url: string) => Promise<void>;
/**
 * Download content of a URL with progress.
 *
 * Progress only works when Content-Length is provided by the server.
 *
 */
export declare const downloadWithProgress: (url: string | URL, cb?: ProgressCallback) => Promise<ArrayBuffer>;
/**
 * toBlobURL fetches data from an URL and return a blob URL.
 *
 * Example:
 *
 * ```ts
 * await toBlobURL("http://localhost:3000/ffmpeg.js", "text/javascript");
 * ```
 */
export declare const toBlobURL: (url: string, mimeType: string, progress?: boolean, cb?: ProgressCallback) => Promise<string>;
