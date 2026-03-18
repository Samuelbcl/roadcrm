import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  // Get session from NextAuth
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get("token");

  if (!accessToken) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Get today's date range
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const timeMin = startOfDay.toISOString();
  const timeMax = endOfDay.toISOString();

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        new URLSearchParams({
          timeMin,
          timeMax,
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "20",
        }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: "Erreur Google Calendar", details: err },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Transform events into our format
    const appointments = (data.items || [])
      .filter((e) => e.start?.dateTime) // Only timed events, not all-day
      .map((e) => ({
        id: e.id,
        name: e.summary || "Sans titre",
        address: e.location || "",
        date: e.start.dateTime.slice(0, 10),
        time: new Date(e.start.dateTime).toLocaleTimeString("fr-BE", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        timeEnd: e.end?.dateTime
          ? new Date(e.end.dateTime).toLocaleTimeString("fr-BE", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : null,
        description: e.description || "",
        notes: [],
        done: false,
        source: "google",
      }));

    return NextResponse.json({ appointments });
  } catch (err) {
    return NextResponse.json(
      { error: "Erreur serveur", message: err.message },
      { status: 500 }
    );
  }
}
