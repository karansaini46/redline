import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/rbac";
import { randomBytes, createHash } from "crypto";
import { Resend } from "resend";
import { Prisma } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: Request,
  { params }: { params: { orgId: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const orgId = params.orgId;
    // Require ADMIN+ to send invites
    await requireRole(orgId, userId, "ADMIN");

    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return new NextResponse("Missing email or role", { status: 400 });
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const invite = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const inv = await tx.orgInvite.create({
        data: {
          org_id: orgId,
          email,
          role,
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        },
      });

      await tx.auditLogEntry.create({
        data: {
          org_id: orgId,
          user_id: userId,
          action: "INVITE_SENT",
          entity_type: "OrgInvite",
          entity_id: inv.id,
          details: { email, role },
        },
      });

      return inv;
    });

    const inviteUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/invite/${token}`;

    if (
      process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY !== "dummy_resend_api_key"
    ) {
      await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: email,
        subject: "You've been invited!",
        html: `<p>Click <a href="${inviteUrl}">here</a> to join.</p>`,
      });
    } else {
      console.log(`[Mock Email] Invite to ${email}: ${inviteUrl}`);
    }

    return NextResponse.json({ success: true, inviteId: invite.id });
  } catch (error) {
    const err = error as Error;
    if (err.name === "ForbiddenError") {
      return new NextResponse(err.message, { status: 403 });
    }
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
