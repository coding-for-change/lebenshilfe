import type { MetadataRoute } from "next";
import { branding } from "@/lib/branding";

// The demo is a public URL with published credentials, so keep it out of search
// results. The real instances are behind a login anyway, but an indexed demo
// invites traffic we have not invited.
export default function robots(): MetadataRoute.Robots {
  if (branding.isDemo) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return { rules: [{ userAgent: "*", allow: "/" }] };
}
