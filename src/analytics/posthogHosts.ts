export const ANALYTICS_PATH = "/relay"

export type PosthogRegion = "us" | "eu"

export function posthogRegion(region: string | undefined): PosthogRegion {
  return region === "eu" ? "eu" : "us"
}

export function posthogHosts(region: PosthogRegion) {
  return {
    ingest: `https://${region}.i.posthog.com`,
    assets: `https://${region}-assets.i.posthog.com`,
    ui: `https://${region}.posthog.com`,
  }
}
