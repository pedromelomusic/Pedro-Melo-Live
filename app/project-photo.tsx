"use client";

import { useState } from "react";
import type { PhotoSlot } from "./photography";

export function ProjectPhoto({
  slot,
  alt,
}: {
  slot: PhotoSlot;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      className={"project-photo photo-" + slot}
      src={"/api/public-project-photo?slot=" + slot}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}