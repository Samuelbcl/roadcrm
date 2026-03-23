import { NextResponse } from "next/server";

export async function POST(request) {
  const { token, summary, location, date, time } = await request.json();
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const startDateTime = `${date}T${time}:00`;
  const [h, m] = time.split(":").map(Number);
  const endH = h + 1;
  const endDateTime = `${date}T${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;

  try {
    const res = await fetch("https://graph.microsoft.com/v1.0/me/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: summary,
        location: location ? { displayName: location } : undefined,
        start: { dateTime: startDateTime, timeZone: "Europe/Brussels" },
        end: { dateTime: endDateTime, timeZone: "Europe/Brussels" },
      }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });
    return NextResponse.json({ id: data.id, success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
