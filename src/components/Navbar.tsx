"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Profile", href: "/" },
  { label: "Reading Notes", href: "/reading-notes" },
  { label: "Favorite Food", href: "/favorite-food" },
  { label: "Guestbook", href: "/guestbook" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between bg-zinc-950 px-6 py-3 text-sm text-white">
      <span className="text-zinc-400">E1554094@u.nus.edu</span>
      <div className="flex items-center gap-4">
        {navItems.map((item, index) => (
          <span key={item.href} className="flex items-center gap-4">
            {index > 0 && <span className="text-zinc-600">|</span>}
            <Link
              href={item.href}
              className={
                pathname === item.href
                  ? "font-medium underline underline-offset-4 text-white"
                  : "text-zinc-400 transition-colors hover:text-white"
              }
            >
              {item.label}
            </Link>
          </span>
        ))}
      </div>
    </nav>
  );
}
