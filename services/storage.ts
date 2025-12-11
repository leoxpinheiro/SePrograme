const baseURL = "https://se-programe.vercel.app";

export async function getEvents() {
  const res = await fetch(`${baseURL}/api/events`);
  return await res.json();
}

export async function addEvent(event: any) {
  const res = await fetch(`${baseURL}/api/addEvent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  return await res.json();
}
