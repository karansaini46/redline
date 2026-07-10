"use server"

import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import argon2 from "argon2"
import { randomBytes, createHash } from "crypto"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function signup(data: { email: string, password: string, name?: string }) {
  if (!data.email || !data.password) {
    throw new Error("Email and password are required")
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  })

  if (existingUser) {
    throw new Error("Email already in use")
  }

  const password_hash = await argon2.hash(data.password)

  // Atomic transaction
  const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        password_hash,
        name: data.name,
      }
    })

    const org = await tx.organization.create({
      data: {
        name: `${newUser.name || newUser.email}'s Organization`,
      }
    })

    await tx.membership.create({
      data: {
        user_id: newUser.id,
        org_id: org.id,
        role: "OWNER",
      }
    })
    
    return newUser
  })

  // Generate verification token
  const token = randomBytes(32).toString("hex")
  const tokenHash = createHash("sha256").update(token).digest("hex")

  await prisma.authToken.create({
    data: {
      userId: user.id,
      type: "VERIFY_EMAIL",
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    }
  })

  const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/verify?token=${token}`
  
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'dummy_resend_api_key') {
    await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: user.email,
      subject: "Verify your email",
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify.</p>`
    })
  } else {
    console.log(`[Mock Email] Verify email for ${user.email}: ${verifyUrl}`)
  }

  return { success: true }
}

export async function verifyEmail(token: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex")
  
  const authToken = await prisma.authToken.findUnique({
    where: { tokenHash }
  })

  if (!authToken || authToken.type !== "VERIFY_EMAIL" || authToken.invalidatedAt || authToken.expiresAt < new Date()) {
    throw new Error("Invalid or expired token")
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: authToken.userId },
      data: { email_verified: new Date() }
    })

    await tx.authToken.update({
      where: { id: authToken.id },
      data: { invalidatedAt: new Date() }
    })
  })

  return { success: true }
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    // Return success to avoid email enumeration
    return { success: true }
  }

  const token = randomBytes(32).toString("hex")
  const tokenHash = createHash("sha256").update(token).digest("hex")

  await prisma.authToken.create({
    data: {
      userId: user.id,
      type: "RESET_PASSWORD",
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 min TTL
    }
  })

  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`

  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'dummy_resend_api_key') {
    await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: user.email,
      subject: "Reset your password",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 15 minutes.</p>`
    })
  } else {
    console.log(`[Mock Email] Password reset for ${user.email}: ${resetUrl}`)
  }

  return { success: true }
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex")
  
  const authToken = await prisma.authToken.findUnique({
    where: { tokenHash }
  })

  if (!authToken || authToken.type !== "RESET_PASSWORD" || authToken.invalidatedAt || authToken.expiresAt < new Date()) {
    throw new Error("Invalid or expired token")
  }

  const password_hash = await argon2.hash(newPassword)

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: authToken.userId },
      data: { password_hash }
    })

    await tx.authToken.update({
      where: { id: authToken.id },
      data: { invalidatedAt: new Date() }
    })
  })

  return { success: true }
}
