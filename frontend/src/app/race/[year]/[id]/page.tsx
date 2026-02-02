"use client";

import { useEffect, useState } from "react";
import { getSessionData, getDriverTelemetry, getQualifyingResults } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter } from 'recharts';
import { useParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RacePage() {
    const params = useParams();
    const year = Number(params.year);
    const raceId = String(params.id);

    const [sessionData, setSessionData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Driver Comparison State
    const [driver1, setDriver1] = useState<string>("");
    const [driver2, setDriver2] = useState<string>("");
    const [telemetry1, setTelemetry1] = useState<any[]>([]);
    const [telemetry2, setTelemetry2] = useState<any[]>([]);
    const [qualifyingData, setQualifyingData] = useState<any[]>([]);

    useEffect(() => {
        if (year && raceId) {
            setLoading(true);
            getSessionData(year, raceId, 'R')
                .then(data => {
                    setSessionData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setError("Failed to load session data. It might not be available yet.");
                    setLoading(false);
                });

            getQualifyingResults(year, raceId).then(setQualifyingData).catch(console.error);
        }
    }, [year, raceId]);

    useEffect(() => {
        if (driver1 && year && raceId) {
            getDriverTelemetry(year, raceId, 'R', driver1).then(setTelemetry1).catch(console.error);
        }
    }, [driver1, year, raceId]);

    useEffect(() => {
        if (driver2 && year && raceId) {
            getDriverTelemetry(year, raceId, 'R', driver2).then(setTelemetry2).catch(console.error);
        }
    }, [driver2, year, raceId]);

    if (loading) return <div className="p-10">Loading race data... (This might take a while for the first fetch)</div>;
    if (error) return <div className="p-10 text-red-500">{error}</div>;
    if (!sessionData) return <div className="p-10">No data found</div>;

    // Prepare data for charts
    const driversList = sessionData.results ? sessionData.results.map((r: any) => ({
        number: r.Abbreviation, // Using Abbreviation as ID for simplicity in UI, but API needs number? 
        // Wait, endpoint uses driver number. Results usually have 'Number' or we can map Abbreviation to Number.
        // FastF1 results usually have 'DriverNumber'. Let's check if we included it.
        // We included: BroadcastName, FullName, Abbreviation, TeamName, Position, GridPosition, Status, Points.
        // We missed DriverNumber! We should use Abbreviation for display and maybe Abbreviation works for lookup if FastF1 supports it.
        // FastF1 pick_driver supports abbreviation.
        name: r.FullName,
        team: r.TeamName
    })) : [];

    // Position History Data Processing
    // We need to group laps by lap number and have columns for each driver's position
    const positionHistory: any[] = [];
    if (sessionData.laps) {
        const lapsByNumber = new Map();
        sessionData.laps.forEach((lap: any) => {
            if (!lapsByNumber.has(lap.LapNumber)) {
                lapsByNumber.set(lap.LapNumber, { LapNumber: lap.LapNumber });
            }
            const entry = lapsByNumber.get(lap.LapNumber);
            entry[lap.Driver] = lap.Position;
        });
        lapsByNumber.forEach(val => positionHistory.push(val));
        positionHistory.sort((a, b) => a.LapNumber - b.LapNumber);
    }

    // Tyre Strategy Data Processing (Stints)
    const driverStints: any[] = [];
    let maxStints = 0;

    if (sessionData.laps && sessionData.results) {
        // Group laps by driver
        const lapsByDriver = new Map();
        sessionData.laps.forEach((lap: any) => {
            if (!lapsByDriver.has(lap.Driver)) {
                lapsByDriver.set(lap.Driver, []);
            }
            lapsByDriver.get(lap.Driver).push(lap);
        });

        // Process stints for each driver
        // Sort drivers by finishing position (using results)
        const sortedDrivers = sessionData.results
            .sort((a: any, b: any) => a.Position - b.Position)
            .map((r: any) => r.Abbreviation);

        sortedDrivers.forEach((driver: string) => {
            const laps = lapsByDriver.get(driver);
            if (!laps) return;

            laps.sort((a: any, b: any) => a.LapNumber - b.LapNumber);

            const stints: any = { driver };
            let currentStint = 0;
            let currentCompound = laps[0]?.Compound;
            let currentStintLaps = 0;

            laps.forEach((lap: any, index: number) => {
                if (lap.Compound !== currentCompound) {
                    // End of stint
                    stints[`stint_${currentStint}`] = currentStintLaps;
                    stints[`stint_${currentStint}_compound`] = currentCompound;
                    currentStint++;
                    currentCompound = lap.Compound;
                    currentStintLaps = 0;
                }
                currentStintLaps++;
            });
            // Last stint
            stints[`stint_${currentStint}`] = currentStintLaps;
            stints[`stint_${currentStint}_compound`] = currentCompound;

            if (currentStint + 1 > maxStints) maxStints = currentStint + 1;
            driverStints.push(stints);
        });
    }

    // Color mapping for tyres
    const tyreColors: Record<string, string> = {
        "SOFT": "#ff3333",
        "MEDIUM": "#ffff33",
        "HARD": "#f0f0f0", // White/Light Gray for visibility
        "INTERMEDIATE": "#33cc33",
        "WET": "#3366ff",
        "TEST-UNKNOWN": "#888888"
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Race Analysis (Round {raceId})</h1>
                {sessionData.weather && sessionData.weather.length > 0 && (
                    <div className="flex gap-4 text-sm bg-muted p-4 rounded-lg">
                        <div>
                            <span className="font-semibold">Air Temp:</span> {sessionData.weather[0].AirTemp}°C
                        </div>
                        <div>
                            <span className="font-semibold">Track Temp:</span> {sessionData.weather[0].TrackTemp}°C
                        </div>
                        <div>
                            <span className="font-semibold">Humidity:</span> {sessionData.weather[0].Humidity}%
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs for different analyses */}
            <Tabs defaultValue="race" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="race">Race Summary</TabsTrigger>
                    <TabsTrigger value="strategy">Tyre Strategy</TabsTrigger>
                    <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
                    <TabsTrigger value="qualifying">Qualifying</TabsTrigger>
                </TabsList>

                <TabsContent value="race" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Position History */}
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Position History</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={positionHistory}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="LapNumber" type="number" domain={['dataMin', 'dataMax']} />
                                        <YAxis reversed domain={[1, 20]} />
                                        <Tooltip />
                                        <Legend />
                                        {driversList.slice(0, 10).map((driver: any, index: number) => (
                                            <Line
                                                key={driver.number}
                                                type="monotone"
                                                dataKey={driver.number}
                                                stroke={`hsl(${index * 36}, 70%, 50%)`}
                                                dot={false}
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Team Pace Comparison */}
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Team Pace Comparison</CardTitle>
                                <CardDescription>Average lap time per team (lower is better)</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={sessionData.team_pace || []}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={['dataMin', 'dataMax']} hide />
                                        <YAxis dataKey="Team" type="category" width={100} />
                                        <Tooltip formatter={(value: number) => [value.toFixed(3) + 's', 'Avg Lap Time']} />
                                        <Bar dataKey="LapTime" fill="#8884d8">
                                            {sessionData.team_pace && sessionData.team_pace.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Track Map */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Track Map</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[500px] flex justify-center items-center">
                            {sessionData.track_map ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <XAxis type="number" dataKey="X" hide domain={['dataMin', 'dataMax']} />
                                        <YAxis type="number" dataKey="Y" hide domain={['dataMin', 'dataMax']} />
                                        <Tooltip cursor={false} content={() => null} />
                                        <Scatter name="Track" data={sessionData.track_map.path} fill="#8884d8" line={{ stroke: "#8884d8", strokeWidth: 2 }} shape={<circle r={0} />} />
                                        <Scatter name="Corners" data={sessionData.track_map.corners} fill="red">
                                            {sessionData.track_map.corners.map((entry: any, index: number) => (
                                                <Cell key={`corner-${index}`} fill="red" />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            ) : (
                                <div>No track map data available</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="strategy">
                    {/* Tyre Strategy */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tyre Strategy</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[600px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={driverStints}
                                    layout="vertical"
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="driver" type="category" width={50} />
                                    <Tooltip content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-background border p-2 rounded shadow">
                                                    <p className="font-bold">{payload[0].payload.driver}</p>
                                                    {payload.map((entry: any, index: number) => {
                                                        const stintKey = entry.dataKey as string;
                                                        const compoundKey = `${stintKey}_compound`;
                                                        const compound = entry.payload[compoundKey];
                                                        if (!entry.value) return null;
                                                        return (
                                                            <div key={index} className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tyreColors[compound] || '#888' }}></div>
                                                                <span>{compound}: {entry.value} laps</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }} />
                                    <Legend />
                                    {Array.from({ length: maxStints }).map((_, index) => (
                                        <Bar key={index} dataKey={`stint_${index}`} stackId="a">
                                            {driverStints.map((entry, i) => (
                                                <Cell key={`cell-${i}`} fill={tyreColors[entry[`stint_${index}_compound`]] || "#888888"} stroke="#666" strokeWidth={1} />
                                            ))}
                                        </Bar>
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="telemetry">
                    {/* Driver Comparison */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Driver Comparison (Fastest Lap)</CardTitle>
                            <div className="flex gap-4">
                                <Select onValueChange={setDriver1}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select Driver 1" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {driversList.map((d: any) => (
                                            <SelectItem key={d.number} value={d.number}>{d.number} - {d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={setDriver2}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select Driver 2" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {driversList.map((d: any) => (
                                            <SelectItem key={d.number} value={d.number}>{d.number} - {d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="Time" type="number" domain={['dataMin', 'dataMax']} label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -10 }} />
                                    <YAxis label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip />
                                    <Legend />
                                    {telemetry1.length > 0 && (
                                        <Line data={telemetry1} dataKey="Speed" name={`${driver1} Speed`} stroke="#8884d8" dot={false} />
                                    )}
                                    {telemetry2.length > 0 && (
                                        <Line data={telemetry2} dataKey="Speed" name={`${driver2} Speed`} stroke="#82ca9d" dot={false} />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="qualifying">
                    <Card>
                        <CardHeader>
                            <CardTitle>Qualifying Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pos</TableHead>
                                        <TableHead>Driver</TableHead>
                                        <TableHead>Team</TableHead>
                                        <TableHead>Q1</TableHead>
                                        <TableHead>Q2</TableHead>
                                        <TableHead>Q3</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {qualifyingData.map((row: any) => (
                                        <TableRow key={row.Abbreviation}>
                                            <TableCell>{row.Position}</TableCell>
                                            <TableCell>{row.Abbreviation}</TableCell>
                                            <TableCell>{row.TeamName}</TableCell>
                                            <TableCell>{row.Q1 ? new Date(row.Q1 * 1000).toISOString().substr(14, 9) : '-'}</TableCell>
                                            <TableCell>{row.Q2 ? new Date(row.Q2 * 1000).toISOString().substr(14, 9) : '-'}</TableCell>
                                            <TableCell>{row.Q3 ? new Date(row.Q3 * 1000).toISOString().substr(14, 9) : '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
