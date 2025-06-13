// app/loading.tsx
"use client"

import EggLoading from "./components/egg-loading"

export default function Loading() {
  // Next.js will mount this on every client-side transition
  // and unmount it as soon as the new UI is ready.
  return (
    <EggLoading
      isLoading={true}
      onComplete={() => {
        /* no-op—unmount happens automatically */
      }}
      context={{
        title: "Loading…",
        icon: null,
        destination: "",
      }}
    />
  )
}
