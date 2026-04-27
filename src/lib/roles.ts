import { Role } from "@/generated/prisma";

export type RoleLike = Role | string | null | undefined;

export function isOwner(role: RoleLike): boolean {
  return role === Role.OWNER;
}

// OWNER is treated as a strict superset of ADMIN — anything an admin may do, an owner may do.
export function isAdmin(role: RoleLike): boolean {
  return role === Role.ADMIN || role === Role.OWNER;
}

export function canManageUsers(role: RoleLike): boolean {
  return isAdmin(role);
}

export function canManageOwners(role: RoleLike): boolean {
  return isOwner(role);
}

export function canInviteAsRole(actor: RoleLike, target: Role): boolean {
  if (target === Role.OWNER) return isOwner(actor);
  if (target === Role.ADMIN) return isAdmin(actor);
  return isAdmin(actor);
}

export function canRemoveTarget(actor: RoleLike, target: RoleLike): boolean {
  if (target === Role.OWNER) return isOwner(actor);
  return isAdmin(actor);
}

export function canPromoteToOwner(actor: RoleLike): boolean {
  return isOwner(actor);
}

// Owners can never be demoted — by product rule "one owner can not make another owner admin".
export function canDemoteOwner(): boolean {
  return false;
}
