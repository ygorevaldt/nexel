import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Preencha todos os campos.");
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        await dbConnect();
        const user = await User.findOne({ email }).lean();

        if (!user || !user.passwordHash) {
          throw new Error("Credenciais inválidas.");
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          throw new Error("Credenciais inválidas.");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          subscriptionStatus: user.subscriptionStatus,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      const { token, user } = params;

      // On login: populate from the user object returned by authorize()
      if (user) {
        token.role = (user as { role: string }).role;
        token.subscriptionStatus = (user as { subscriptionStatus: string }).subscriptionStatus;
        token.id = user.id;
      }

      // Handle name updates from profile settings
      if ("trigger" in params && params.trigger === "update" && "session" in params) {
        const session = params.session as { name?: string };
        if (session?.name) token.name = session.name;
      }

      // Always sync subscriptionStatus and role from DB so any plan change
      // (e.g. after Stripe webhook) is reflected immediately on next session fetch,
      // without requiring re-login. The jwt callback only runs when the session is
      // actively fetched (page load, window focus), not on every HTTP request.
      if (token.id) {
        try {
          await dbConnect();
          const freshUser = await User.findById(token.id)
            .select('subscriptionStatus role')
            .lean();
          if (freshUser) {
            token.subscriptionStatus = freshUser.subscriptionStatus;
            token.role = freshUser.role;
          }
        } catch {
          // DB unreachable — keep existing token values until next fetch
        }
      }

      return token;
    },
  },
});
