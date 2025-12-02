import {clsx, type ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ROLE_KEYWORDS: Array<{keyword: string; slug: string}> = [
  {keyword: "admin", slug: "admin"},
  {keyword: "coordinador", slug: "coordinador"},
  {keyword: "coordinadora", slug: "coordinador"},
  {keyword: "profesor", slug: "profesor"},
  {keyword: "profesora", slug: "profesor"},
  {keyword: "docente", slug: "profesor"},
  {keyword: "usuario", slug: "usuario"},
  {keyword: "estudiante", slug: "usuario"},
];

function matchRoleSlug(candidate: string) {
  const normalized = candidate.trim().toLowerCase();
  if (!normalized) return "";
  for (const {keyword, slug} of ROLE_KEYWORDS) {
    if (normalized === slug || normalized.includes(keyword)) {
      return slug;
    }
  }
  return normalized;
}

export function normalizeRoleSlug(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") {
    return matchRoleSlug(value);
  }
  if (
    typeof value === "object" &&
    "nombre" in (value as Record<string, unknown>) &&
    typeof (value as Record<string, unknown>).nombre === "string"
  ) {
    return matchRoleSlug((value as {nombre: string}).nombre);
  }
  return matchRoleSlug(String(value));
}
