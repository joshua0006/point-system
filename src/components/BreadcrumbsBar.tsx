import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const TITLE_MAP: Record<string, string> = {
  "marketplace": "Marketplace",
  "messages": "Messages",
  "ai-assistant": "AI Assistant",
  "ad-copy-generator": "Ad Copy",
  "dashboard": "Dashboard",
  "consultant-dashboard": "Consultant Dashboard",
  "admin-dashboard": "Admin Dashboard",
  "settings": "Settings",
  "service": "Service",
  "profile": "Profile",
  "buyer": "Buyer",
  "consultant": "Consultant",
};

function toTitle(segment: string) {
  if (TITLE_MAP[segment]) return TITLE_MAP[segment];
  // Heuristic: UUID-like segments => Details
  const isUUID = /^[0-9a-fA-F-]{10,}$/i.test(segment);
  if (isUUID) return "Details";
  return decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function BreadcrumbsBar() {
  const location = useLocation();

  const crumbs = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const items: { name: string; href: string }[] = [];

    // Home
    items.push({ name: "Home", href: "/" });

    let pathAcc = "";
    for (const part of parts) {
      pathAcc += `/${part}`;
      items.push({ name: toTitle(part), href: pathAcc });
    }

    return items;
  }, [location.pathname]);

  const jsonLd = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const itemListElement = crumbs.map((c, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: c.name,
      item: `${origin}${c.href}`,
    }));
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement,
    };
  }, [crumbs]);

  if (crumbs.length <= 1) return null;

  return (
    <div className="border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="container mx-auto px-2 sm:px-4 py-2">
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((c, idx) => (
              <span key={c.href} className="contents">
                <BreadcrumbItem>
                  {idx < crumbs.length - 1 ? (
                    <BreadcrumbLink asChild>
                      <Link to={c.href}>{c.name}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{c.name}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {idx < crumbs.length - 1 && <BreadcrumbSeparator />}
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

export default BreadcrumbsBar;
