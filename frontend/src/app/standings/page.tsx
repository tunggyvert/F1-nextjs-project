"use client";

import { useEffect, useState } from "react";
import { useYear } from "@/context/YearContext";
import { getDriverStandings, getConstructorStandings } from "@/services/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StandingsPage() {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [constructors, setConstructors] = useState<any[]>([]);
    const { year } = useYear();

    useEffect(() => {
        getDriverStandings(year).then(setDrivers).catch(console.error);
        getConstructorStandings(year).then(setConstructors).catch(console.error);
    }, [year]);

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">F1 Standings {year}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Driver Standings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Pos</TableHead>
                                    <TableHead>Driver</TableHead>
                                    <TableHead>Constructor</TableHead>
                                    <TableHead className="text-right">Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {drivers.map((driver: any) => (
                                    <TableRow key={driver.driverId}>
                                        <TableCell className="font-medium">{driver.position}</TableCell>
                                        <TableCell>{driver.givenName} {driver.familyName}</TableCell>
                                        <TableCell>{driver.constructorName}</TableCell>
                                        <TableCell className="text-right">{driver.points}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Constructor Standings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Pos</TableHead>
                                    <TableHead>Constructor</TableHead>
                                    <TableHead className="text-right">Points</TableHead>
                                    <TableHead className="text-right">Wins</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {constructors.map((constructor: any) => (
                                    <TableRow key={constructor.constructorId}>
                                        <TableCell className="font-medium">{constructor.position}</TableCell>
                                        <TableCell>{constructor.constructorName}</TableCell>
                                        <TableCell className="text-right">{constructor.points}</TableCell>
                                        <TableCell className="text-right">{constructor.wins}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
