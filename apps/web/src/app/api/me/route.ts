import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    return NextResponse.json({
        user: session.user,
        message: "You are authenticated!",
    });
}
