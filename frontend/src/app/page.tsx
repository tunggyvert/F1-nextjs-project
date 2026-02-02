import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">F1 Insights</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        <Link href="/standings">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Standings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>View Driver and Constructor standings for the current season.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/schedule">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Check the race calendar and upcoming events.</p>
            </CardContent>
          </Card>
        </Link>

      </div>
    </main>
  );
}
