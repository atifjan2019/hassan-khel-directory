/** Primary navigation — keys map to messages `nav.*`. */
export const NAV_ITEMS = [
  { href: "/", key: "home" },
  { href: "/directory", key: "directory" },
  { href: "/family-tree", key: "familyTree" },
  { href: "/map", key: "map" },
  { href: "/news", key: "news" },
  { href: "/gallery", key: "gallery" },
  { href: "/about", key: "about" },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
