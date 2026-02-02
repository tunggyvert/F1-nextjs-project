"use client";

import { useYear } from "@/context/YearContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function YearSelector() {
    const { year, setYear } = useYear();
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => currentYear - i);

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Season:</span>
            <Select value={String(year)} onValueChange={(val) => setYear(Number(val))}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                    {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                            {y}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
