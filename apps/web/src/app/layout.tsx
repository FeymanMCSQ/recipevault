import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "RecipeVault",
    description: "Your personal recipe archive",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
