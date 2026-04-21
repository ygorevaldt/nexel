import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      subscriptionStatus?: string
      systemRole?: 'USER' | 'ADM'
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    subscriptionStatus?: string
    systemRole?: 'USER' | 'ADM'
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    subscriptionStatus?: string
    systemRole?: 'USER' | 'ADM'
  }
}
