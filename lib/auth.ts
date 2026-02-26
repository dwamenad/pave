import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { Session } from "next-auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || ""
    })
  ],
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      await db.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          image: user.image
        },
        create: {
          email: user.email,
          name: user.name,
          image: user.image,
          username: user.email.split("@")[0]
        }
      });
      return true;
    },
    async jwt({ token, user }) {
      const email = user?.email || token.email;
      if (!email) return token;
      const dbUser = await db.user.findUnique({ where: { email } });
      if (dbUser) {
        token.sub = dbUser.id;
        token.name = dbUser.name || token.name;
        token.picture = dbUser.image || token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
      }
      return session;
    }
  }
};

export async function getCurrentSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
