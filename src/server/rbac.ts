import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export class ForbiddenError extends Error {
  constructor(message: string = "Forbidden") {
    super(message)
    this.name = "ForbiddenError"
  }
}

export const roleLevels: Record<Role, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
}

export async function requireRole(orgId: string, userId: string, minRole: Role) {
  const membership = await prisma.membership.findUnique({
    where: {
      user_id_org_id: {
        user_id: userId,
        org_id: orgId
      }
    }
  })

  if (!membership) {
    throw new ForbiddenError("Not a member of this organization")
  }

  if (roleLevels[membership.role] < roleLevels[minRole]) {
    throw new ForbiddenError(`Requires at least ${minRole} role`)
  }

  return membership
}
