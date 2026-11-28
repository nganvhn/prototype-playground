"use client"

import { useState } from "react"
import { UNSPLASH_UTM } from "./data"
import { paletteGradient } from "./palette"
import type { Combination, Photo } from "./types"
import { trackPhotoShown, usePhoto } from "./use-photo"

export function ReferencePhoto({ combination }: { combination: Combination }) {
  const photo = usePhoto(combination.id)

  return (
    <figure className="flex flex-col gap-2">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted transition-[background] duration-500 ease-out"
        // The palette itself is the placeholder: shown while loading and when there's no photo.
        style={{ background: paletteGradient(combination.colours) }}
      >
        {photo && <PhotoImage key={photo.id} photo={photo} />}
      </div>
      <figcaption className="min-h-5 text-xs text-muted-foreground">
        {photo && (
          <>
            <a href={photo.unsplashUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              Photo
            </a>{" "}
            by{" "}
            <a href={photo.author.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {photo.author.name}
            </a>{" "}
            on{" "}
            <a
              href={`https://unsplash.com/?${UNSPLASH_UTM}`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Unsplash
            </a>
          </>
        )}
      </figcaption>
    </figure>
  )
}

function PhotoImage({ photo }: { photo: Photo }) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading")
  if (state === "failed") return null
  return (
    <>
      {/* Unsplash requires hotlinking their URL, so no next/image optimisation. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={photo.alt}
        draggable={false}
        onLoad={() => {
          setState("loaded")
          trackPhotoShown(photo.id)
        }}
        onError={() => setState("failed")}
        data-loaded={state === "loaded"}
        className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 ease-out data-[loaded=true]:opacity-100"
      />
    </>
  )
}
