import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "test" },
                password: { label: "Password", type: "password", placeholder: "test" },
            },
            async authorize(credentials) {
                // Stub user for MVP (Quest 1.3)
                if (
                    credentials?.username === "test" &&
                    credentials?.password === "test"
                ) {
                    return { id: "1", name: "Test User", email: "test@example.com" };
                }
                return null;
            },
        }),
    ],
    session: {
        strategy: "jwt", // Database-less for now
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
};
