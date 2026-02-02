"use client";

import { useEffect, useState } from "react";
import { useYear } from "@/context/YearContext";
import { getSchedule } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SchedulePage() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const { year } = useYear();

    useEffect(() => {
        getSchedule(year).then(setSchedule).catch(console.error);
    }, [year]);

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">F1 Schedule {year}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schedule.map((race: any) => (
                    <Link href={`/race/${year}/${race.RoundNumber}`} key={`${race.RoundNumber}-${race.EventDate}`}>
                        <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle>{race.EventName}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{race.Location}</p>
                                <p className="mt-2 font-semibold">{new Date(race.EventDate).toLocaleDateString()}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
