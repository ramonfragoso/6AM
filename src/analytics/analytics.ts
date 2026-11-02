import type { PostHog, PostHogConfig } from "posthog-js/dist/module.slim"
import { IN_DEVELOPMENT } from "@/debug/development"
import { ANALYTICS_PATH, posthogHosts, posthogRegion } from "./posthogHosts"

type Properties = Record<string, unknown>

type QueuedEvent = { event: string; properties: Properties }

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

const ENVIRONMENT = process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development"

const SENDS_IN_DEVELOPMENT = process.env.NEXT_PUBLIC_ANALYTICS_IN_DEV === "true"

const HOSTS = posthogHosts(posthogRegion(process.env.NEXT_PUBLIC_POSTHOG_REGION))

const CONFIG: Partial<PostHogConfig> = {
  api_host: ANALYTICS_PATH,
  ui_host: HOSTS.ui,
  person_profiles: "identified_only",
  capture_pageview: true,
  capture_pageleave: false,
  autocapture: false,
  rageclick: false,
  capture_heatmaps: false,
  capture_dead_clicks: false,
  capture_performance: false,
  capture_exceptions: false,
  disable_session_recording: true,
  disable_surveys: true,
  disable_web_experiments: true,
  disable_product_tours: true,
  disable_conversations: true,
  advanced_disable_flags: true,
  disable_external_dependency_loading: true,
}

const queued: QueuedEvent[] = []

let client: PostHog | null = null

let started = false

export function analyticsEnabled() {
  return Boolean(KEY) && (!IN_DEVELOPMENT || SENDS_IN_DEVELOPMENT)
}

export function startAnalytics() {
  if (started || !KEY || !analyticsEnabled()) return
  started = true
  void import("posthog-js/dist/module.slim").then(({ posthog }) => {
    posthog.init(KEY, CONFIG)
    posthog.register({ environment: ENVIRONMENT })
    client = posthog
    for (const { event, properties } of queued.splice(0)) posthog.capture(event, properties)
  })
}

export function track(event: string, properties: Properties = {}) {
  if (!analyticsEnabled()) return
  if (client) client.capture(event, properties)
  else queued.push({ event, properties })
}

export function trackLeaving(event: string, properties: Properties) {
  client?.capture(event, properties, { transport: "sendBeacon" })
}
