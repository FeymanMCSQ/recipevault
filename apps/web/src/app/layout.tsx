import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "RecipeVault",
    description: "Your personal recipe archive",
    icons: {
        icon: "/icon.png",
        apple: "/apple-icon.png",
    },
};

import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body>{children}</body>
            </html>
        </ClerkProvider>
    );
}
