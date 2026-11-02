import type { NextConfig } from "next"
import { ANALYTICS_PATH, posthogHosts, posthogRegion } from "./src/analytics/posthogHosts"

const POSTHOG = posthogHosts(posthogRegion(process.env.NEXT_PUBLIC_POSTHOG_REGION))

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: `${ANALYTICS_PATH}/static/:path*`, destination: `${POSTHOG.assets}/static/:path*` },
      { source: `${ANALYTICS_PATH}/:path*`, destination: `${POSTHOG.ingest}/:path*` },
    ]
  },
}

export default nextConfig
