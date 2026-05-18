"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Hidden input name posted with the parent form. */
  name?: string;
  /** Existing image to show initially (data URL or http URL). */
  initial?: string;
  /** Max output width in pixels. */
  maxWidth?: number;
  /** JPEG quality 0..1. */
  quality?: number;
  /** Label for the file input. */
  label?: string;
}

/**
 * Lets a user pick an image; resizes client-side to keep the encoded data URL
 * comfortably under Cosmos's 2 MB document limit. The resulting data URL is
 * written into a hidden input named `name` so the surrounding form can post it.
 */
export function GameImagePicker({
  name = "imageUrl",
  initial,
  maxWidth = 800,
  quality = 0.8,
  label = "Photo (optional)",
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | undefined>(initial);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDataUrl(initial);
  }, [initial]);

  async function handleFile(file: File) {
    setError(undefined);
    setBusy(true);
    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Please choose an image file");
      }
      const url = await readAsDataURL(file);
      const resized = await resizeImage(url, maxWidth, quality);
      // Roughly: bytes ≈ length * 3 / 4. Cap at 1.5 MB.
      if (resized.length > 1_500_000) {
        throw new Error("Photo still too large after resizing — try a smaller one.");
      }
      setDataUrl(resized);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm">
        <span className="text-zinc-300">{label}</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="mt-1 block w-full text-sm text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-fuchsia-500 file:text-black file:font-semibold hover:file:bg-fuchsia-300"
        />
      </label>
      {busy && <p className="text-xs text-zinc-500">Processing…</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {dataUrl && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="Preview"
            className="max-h-40 rounded-md border border-fuchsia-500/40 neon-border"
          />
          <button
            type="button"
            onClick={() => {
              setDataUrl(undefined);
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="absolute top-1 right-1 text-xs px-2 py-0.5 rounded bg-black/70 border border-fuchsia-500/60 text-fuchsia-200 hover:text-white"
          >
            Remove
          </button>
        </div>
      )}
      <input type="hidden" name={name} value={dataUrl ?? ""} />
    </div>
  );
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

function resizeImage(
  src: string,
  maxWidth: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}
