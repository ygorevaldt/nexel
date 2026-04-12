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

      // Self-heal stale tokens: if subscriptionStatus is missing from this JWT
      // (issued before the field was added), refresh from DB once.
      if (token.id && !token.subscriptionStatus) {
        try {
          await dbConnect();
          const freshUser = await User.findById(token.id).lean();
          if (freshUser) {
            token.role = freshUser.role;
            token.subscriptionStatus = freshUser.subscriptionStatus;
          }
        } catch {
          // DB lookup failed — leave token as-is
        }
      }

      if ("trigger" in params && params.trigger === "update" && "session" in params) {
        const session = params.session as { name?: string };
        if (session?.name) token.name = session.name;
      }

      return token;
    },
  },
});
