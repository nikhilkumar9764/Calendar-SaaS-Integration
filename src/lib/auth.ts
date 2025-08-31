// lib/auth.ts
import { NextAuthOptions } from "next-auth"
import  {PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import  AzureADProvider from "next-auth/providers/azure-ad"
import AppleProvider from "next-auth/providers/apple"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        accountType: { label: "Account Type", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { tenant: true }
        })
        
        if (!user || !await bcrypt.compare(credentials.password, user.password)) {
          return null
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          role: user.role
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar"
        }
      }
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid email profile https://graph.microsoft.com/calendars.readwrite"
        }
      }
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "credentials") {
        // Handle OAuth sign-ins - create tenant if first time
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { tenant: true }
        })
        
        if (!existingUser) {
          // Create new tenant and user for OAuth users
          const tenant = await prisma.tenant.create({
            data: {
              name: user.name || user.email!,
              type: "PERSONAL" // Default for OAuth
            }
          })
          
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              tenantId: tenant.id,
              role: "OWNER"
            }
          })
        }
      }
      return true
    },
    async session({ session, token }) {
      if (token?.tenantId) {
        (session.user as any).tenantId = token.tenantId as string;
        (session.user as any).role = token.role as string;
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        const extendedUser = user as any;
        token.tenantId = extendedUser.tenantId;
        token.role = extendedUser.role;
      }
      return token
    }
  },
  pages: {
    signIn: "/login",
    signUp: "/signup"
  },
  session: { strategy: "jwt" }
}