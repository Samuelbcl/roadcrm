import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get("token");

  if (!accessToken) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endRange = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarView?` +
        new URLSearchParams({
          startDateTime: startOfMonth.toISOString(),
          endDateTime: endRange.toISOString(),
          $top: "100",
          $orderby: "start/dateTime",
          $select: "id,subject,location,start,end,bodyPreview,isAllDay",
        }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'outlook.timezone="Europe/Brussels"',
        },
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: "Erreur Outlook Calendar", details: err }, { status: res.status });
    }

    const data = await res.json();

    const appointments = (data.value || [])
      .filter((e) => !e.isAllDay)
      .map((e) => ({
        id: `outlook_${e.id}`,
        name: e.subject || "Sans titre",
        address: e.location?.displayName || "",
        date: e.start.dateTime.slice(0, 10),
        time: e.start.dateTime.slice(11, 16),
        timeEnd: e.end?.dateTime ? e.end.dateTime.slice(11, 16) : null,
        description: e.bodyPreview || "",
        notes: [],
        done: false,
        source: "outlook",
      }));

    return NextResponse.json({ appointments });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur", message: err.message }, { status: 500 });
  }
}
