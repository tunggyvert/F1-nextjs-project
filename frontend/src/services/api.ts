const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function getDriverStandings(year: number) {
    const res = await fetch(`${API_BASE_URL}/standings/drivers/${year}`);
    if (!res.ok) throw new Error('Failed to fetch driver standings');
    return res.json();
}

export async function getConstructorStandings(year: number) {
    const res = await fetch(`${API_BASE_URL}/standings/constructors/${year}`);
    if (!res.ok) throw new Error('Failed to fetch constructor standings');
    return res.json();
}

export async function getSchedule(year: number) {
    const res = await fetch(`${API_BASE_URL}/schedule/${year}`);
    if (!res.ok) throw new Error('Failed to fetch schedule');
    return res.json();
}

export async function getSessionData(year: number, raceId: string, sessionType: string) {
    const res = await fetch(`${API_BASE_URL}/session/${year}/${raceId}/${sessionType}`);
    if (!res.ok) throw new Error('Failed to fetch session data');
    return res.json();
}

export async function getDriverTelemetry(year: number, raceId: string, sessionType: string, driverNumber: string) {
    const res = await fetch(`${API_BASE_URL}/session/${year}/${raceId}/${sessionType}/driver/${driverNumber}`);
    if (!res.ok) throw new Error('Failed to fetch driver telemetry');
    return res.json();
}

export async function getQualifyingResults(year: number, raceId: string) {
    const res = await fetch(`${API_BASE_URL}/qualifying/${year}/${raceId}`);
    if (!res.ok) throw new Error('Failed to fetch qualifying results');
    return res.json();
}
