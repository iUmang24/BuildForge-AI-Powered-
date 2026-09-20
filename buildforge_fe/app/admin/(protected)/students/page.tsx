"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { adminhardLogout } from "@/lib/adminhardLogout";
import Link from "next/link";

export default function AdminStudentsPage() {
    const { accessToken } = useAdminAuth();

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    /* ================= FETCH ================= */

    const fetchStudents = async () => {
        if (!accessToken) return;

        setLoading(true);

        try {
            const res = await fetch(
                `${API_BASE_URL}/admin/students?search=${search}&page=${page}&limit=${limit}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    credentials: "include",
                }
            );

            if (res.status === 401 || res.status === 403) {
                adminhardLogout();
                return;
            }

            const json = await res.json();
            setStudents(json.data?.rows || []);
        } catch (err) {
            console.error("Failed to fetch students");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [accessToken, page]);

    /* ================= TOGGLE ACTIVE ================= */

    const toggleActive = async (id: number) => {
        await fetch(`${API_BASE_URL}/admin/students/${id}/toggle-active`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        fetchStudents();
    };

    /* ================= BADGES ================= */

    const ActiveBadge = ({ active }: { active: number }) =>
        active ? (
            <span className="px-2 py-1 text-xs bg-green-500/10 text-green-600 rounded-full">
                Active
            </span>
        ) : (
            <span className="px-2 py-1 text-xs bg-red-500/10 text-red-600 rounded-full">
                Disabled
            </span>
        );

    const PaidBadge = ({ paid }: { paid: number }) =>
        paid ? (
            <span className="text-green-600 font-semibold">✅</span>
        ) : (
            <span className="text-red-600 font-semibold">❌</span>
        );

    /* ================= UI ================= */

    return (
        <div className="space-y-8">

            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    Students
                </h1>
                <p className="text-muted-foreground">
                    Manage student accounts
                </p>
            </div>

            {/* SEARCH */}
            <div className="flex gap-3 items-center">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input
                        placeholder="Search name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 w-full border rounded-md p-2 bg-background"
                    />
                </div>

                <Button variant="outline" onClick={fetchStudents}>
                    Search
                </Button>
            </div>

            {/* TABLE */}
            <Card>
                <CardContent className="p-0">

                    {loading ? (
                        <div className="p-6 text-center text-muted-foreground">
                            Loading students...
                        </div>
                    ) : students.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                            No students found
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="p-4 text-left">Name</th>
                                    <th className="p-4 text-left">Email</th>
                                    <th className="p-4 text-center">College</th>
                                    <th className="p-4 text-center">Training Paid</th>
                                    <th className="p-4 text-center">Certificate Paid</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id} className="border-t hover:bg-muted/40">

                                        <td className="p-4 font-medium">
                                            {s.full_name}
                                        </td>

                                        <td className="p-4 text-muted-foreground">
                                            {s.email}
                                        </td>

                                        <td className="p-4 text-center">
                                            {s.college_name || "-"}
                                        </td>

                                        <td className="p-4 text-center">
                                            <PaidBadge paid={s.training_paid} />
                                        </td>

                                        <td className="p-4 text-center">
                                            <PaidBadge paid={s.certificate_paid} />
                                        </td>

                                        <td className="p-4 text-center">
                                            <ActiveBadge active={s.is_active} />
                                        </td>

                                        <td className="p-4 text-center">
                                            <Link
                                                href={`/admin/students/${s.id}`}
                                                className="text-primary hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                </CardContent>
            </Card>

            {/* PAGINATION */}
            <div className="flex justify-between items-center">

                <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                >
                    Previous
                </Button>

                <div className="text-sm text-muted-foreground">
                    Page {page}
                </div>

                <Button
                    variant="outline"
                    disabled={students.length < limit}
                    onClick={() => setPage((p) => p + 1)}
                >
                    Next
                </Button>

            </div>

        </div>
    );
}