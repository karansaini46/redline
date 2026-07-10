import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import argon2 from "argon2"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...PrismaAdapter(prisma),
    createUser: async (data) => {
      // Atomic transaction: create user, org, and membership (OWNER)
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data,
        })
        
        const org = await tx.organization.create({
          data: {
            name: `${user.name || user.email}'s Organization`,
          }
        })

        await tx.membership.create({
          data: {
            user_id: user.id,
            org_id: org.id,
            role: "OWNER",
          }
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return user as any
      })
    }
  },
  session: {
    strategy: "database", // Use DB sessions to allow rotation and invalidation easily
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password_hash) {
          return null
        }

        const isValid = await argon2.verify(user.password_hash, credentials.password as string)

        if (!isValid) {
          return null
        }

        if (!user.email_verified) {
          throw new Error("Email not verified")
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return user as any
      }
    })
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id
      }
      return session
    }
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      }
    }
  }
})
