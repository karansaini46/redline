"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/server/rbac"
import { createHash } from "crypto"
import { Role } from "@prisma/client"

export async function acceptInvite(token: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("You must be logged in to accept an invite")
  }

  const tokenHash = createHash("sha256").update(token).digest("hex")

  const invite = await prisma.orgInvite.findUnique({
    where: { token_hash: tokenHash }
  })

  if (!invite || invite.accepted_at || invite.expires_at < new Date()) {
    throw new Error("Invalid or expired invite")
  }

  const existingMembership = await prisma.membership.findUnique({
    where: {
      user_id_org_id: {
        user_id: session.user.id,
        org_id: invite.org_id
      }
    }
  })

  if (existingMembership) {
    throw new Error("You are already a member of this organization")
  }

  await prisma.$transaction(async (tx) => {
    const mem = await tx.membership.create({
      data: {
        user_id: session.user.id as string,
        org_id: invite.org_id,
        role: invite.role
      }
    })

    await tx.orgInvite.update({
      where: { id: invite.id },
      data: { accepted_at: new Date() }
    })

    await tx.auditLogEntry.create({
      data: {
        org_id: invite.org_id,
        user_id: session.user.id as string,
        action: "INVITE_ACCEPTED",
        entity_type: "Membership",
        entity_id: mem.id,
        details: { role: invite.role, invite_id: invite.id }
      }
    })
  })

  return { success: true, orgId: invite.org_id }
}

export async function changeMemberRole(orgId: string, targetUserId: string, newRole: Role) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await requireRole(orgId, session.user.id, "ADMIN")

  const targetMembership = await prisma.membership.findUnique({
    where: {
      user_id_org_id: { user_id: targetUserId, org_id: orgId }
    }
  })

  if (!targetMembership) {
    throw new Error("Target user is not a member")
  }

  if (targetMembership.role === "OWNER") {
    await requireRole(orgId, session.user.id, "OWNER")
  }
  
  if (newRole === "OWNER") {
    await requireRole(orgId, session.user.id, "OWNER")
  }

  await prisma.$transaction(async (tx) => {
    await tx.membership.update({
      where: { id: targetMembership.id },
      data: { role: newRole }
    })

    await tx.auditLogEntry.create({
      data: {
        org_id: orgId,
        user_id: session.user.id as string,
        action: "ROLE_CHANGED",
        entity_type: "Membership",
        entity_id: targetMembership.id,
        details: { oldRole: targetMembership.role, newRole }
      }
    })
  })

  return { success: true }
}
