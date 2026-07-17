import { PageContent } from "@/ui/layout/page-content";

// Analytics is powered by the self-hosted traffic-source tool (Dub's own analytics
// need Tinybird, which isn't self-hostable). Embedded here so it lives inside Dub's
// shell — same Dub interface, working analytics underneath.
export default function WorkspaceAnalytics() {
  const base = process.env.NEXT_PUBLIC_TRAFFIC_SOURCE_URL || "";
  const siteId = process.env.NEXT_PUBLIC_TRAFFIC_SOURCE_SITE_ID || "1";
  const src = base ? `${base}/analytics/${siteId}?embed=1` : "";

  return (
    <PageContent title="Analytics">
      <div className="h-[calc(100vh-5.5rem)] w-full overflow-hidden bg-white">
        {src ? (
          <iframe
            src={src}
            className="h-full w-full border-0 bg-white"
            title="Analytics"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Analytics service not configured.
          </div>
        )}
      </div>
    </PageContent>
  );
}
