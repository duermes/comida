export const ROLES = {
  ADMIN: "admin",
  COORD: "coordinador",
  USER: "usuario",
  PROFESOR: "profesor",
};

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const ROLE_KEYWORDS = [
  { keyword: "admin", slug: ROLES.ADMIN },
  { keyword: "administrador", slug: ROLES.ADMIN },
  { keyword: "administradora", slug: ROLES.ADMIN },
  { keyword: "coordinador", slug: ROLES.COORD },
  { keyword: "coordinadora", slug: ROLES.COORD },
  { keyword: "profesor", slug: ROLES.PROFESOR },
  { keyword: "profesora", slug: ROLES.PROFESOR },
  { keyword: "docente", slug: ROLES.PROFESOR },
  { keyword: "usuario", slug: ROLES.USER },
  { keyword: "estudiante", slug: ROLES.USER },
];

// Algunos entornos legados guardaron el nombre del rol como el propio ObjectId.
// Este mapa permite reasignar esos IDs conocidos al slug correcto sin tocar la BD manualmente.
const ROLE_ID_ALIASES = {
  "692665a8147c21b1537b4895": ROLES.PROFESOR,
};

function normalizeRoleCandidate(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || objectIdRegex.test(trimmed)) return null;

  const lower = trimmed.toLowerCase();
  for (const { keyword, slug } of ROLE_KEYWORDS) {
    if (lower === slug || lower.includes(keyword)) {
      return slug;
    }
  }
  return lower;
}

export function resolveRoleName(role) {
  if (!role) return null;

  const candidates = [];
  if (typeof role === "string") {
    candidates.push(role);
  } else {
    if (typeof role.nombre === "string") candidates.push(role.nombre);
    if (typeof role.descripcion === "string") candidates.push(role.descripcion);
  }

  for (const candidate of candidates) {
    const normalized = normalizeRoleCandidate(candidate);
    if (normalized) return normalized;
  }

  if (typeof role === "string") {
    return ROLE_ID_ALIASES[role] ?? role;
  }

  const id = role?._id?.toString?.();
  if (id && ROLE_ID_ALIASES[id]) {
    return ROLE_ID_ALIASES[id];
  }

  return candidates.find(Boolean) ?? id ?? null;
}