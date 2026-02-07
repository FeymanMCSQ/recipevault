/**
 * Test API endpoint for YouTube transcript extraction
 * GET /api/test-transcript?url=<youtube-url>
 */

import { NextRequest, NextResponse } from "next/server";
import { getYoutubeTranscript } from "@/lib/transcript";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json(
            { error: "Missing 'url' query parameter" },
            { status: 400 }
        );
    }

    const result = await getYoutubeTranscript(url);

    return NextResponse.json({
        ...result,
        // Truncate transcript for readability in test
        transcriptPreview: result.transcript?.slice(0, 500) + (result.transcript && result.transcript.length > 500 ? '...' : ''),
        transcriptLength: result.transcript?.length,
        segmentCount: result.segments?.length,
    });
}
