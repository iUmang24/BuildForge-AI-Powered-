"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { API_BASE_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { adminhardLogout } from "@/lib/adminhardLogout";
import { toast } from "sonner";

export default function AdminSupportPage() {
    const { accessToken, authReady } = useAdminAuth();

    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState("open");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const [selected, setSelected] = useState<any>(null);
    const [reply, setReply] = useState("");
    const [replyError, setReplyError] = useState("");
    const [replyLoading, setReplyLoading] = useState(false);

    /* ================= FETCH ================= */

    const fetchTickets = async () => {
        if (!accessToken) return;

        setLoading(true);

        try {
            const res = await fetch(
                `${API_BASE_URL}/admin/support?status=${statusFilter}&search=${search}&page=${page}&limit=10`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (res.status === 401 || res.status === 403) {
                adminhardLogout();
                return;
            }

            const json = await res.json();
            setTickets(json.data?.rows || []);
        } catch {
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authReady && accessToken) {
            fetchTickets();
        }
    }, [statusFilter, page, authReady, accessToken]);

    /* ================= STATUS BADGE ================= */

    const StatusBadge = ({ status }: { status: string }) => {
        const base = "px-2 py-1 text-xs rounded-full font-medium";

        if (status === "open")
            return (
                <span className={`${base} bg-yellow-500/10 text-yellow-600`}>
                    Open
                </span>
            );

        if (status === "closed")
            return (
                <span className={`${base} bg-gray-500/10 text-gray-600`}>
                    Closed
                </span>
            );

        return <span className={base}>{status}</span>;
    };

    /* ================= RENDER ================= */

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">

            <h1 className="text-2xl font-bold">Support Tickets</h1>

            {/* SEARCH + FILTER */}
            <div className="flex gap-4 flex-wrap items-center">
                <input
                    placeholder="Search by name, email or subject..."
                    className="border bg-background px-3 py-2 rounded-md w-72"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <Button onClick={() => fetchTickets()}>
                    Search
                </Button>

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    className="border bg-background text-foreground px-3 py-2 rounded-md"
                >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="all">All</option>
                </select>
            </div>

            {/* TABLE */}
            {loading ? (
                <div className="text-muted-foreground">
                    Loading tickets...
                </div>
            ) : (
                <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm table-fixed">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-3 text-left w-[20%]">Student</th>
                                <th className="p-3 text-left w-[20%]">Email</th>
                                <th className="p-3 text-left w-[25%]">Subject</th>
                                <th className="p-3 text-center w-[10%]">Status</th>
                                <th className="p-3 text-center w-[15%]">Created</th>
                                <th className="p-3 text-center w-[10%]">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {tickets.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                        No tickets found
                                    </td>
                                </tr>
                            )}

                            {tickets.map((t) => (
                                <tr key={t.id} className="border-t hover:bg-muted/40">
                                    <td className="p-3">{t.full_name}</td>
                                    <td className="p-3">{t.email}</td>
                                    <td className="p-3 font-semibold uppercase">
                                        {t.subject}
                                    </td>
                                    <td className="p-3 text-center">
                                        <StatusBadge status={t.status} />
                                    </td>
                                    <td className="p-3 text-center">
                                        {new Date(t.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-3 text-center">
                                        <Button
                                            size="sm"
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(
                                                        `${API_BASE_URL}/admin/support/${t.id}`,
                                                        {
                                                            headers: {
                                                                Authorization: `Bearer ${accessToken}`,
                                                            },
                                                        }
                                                    );

                                                    if (res.status === 401 || res.status === 403) {
                                                        adminhardLogout();
                                                        return;
                                                    }

                                                    const json = await res.json();

                                                    if (json.success) {
                                                        setSelected(json.data); // ✅ full ticket with messages
                                                    }
                                                } catch {
                                                    toast.error("Failed to load ticket");
                                                }
                                            }}
                                        >
                                            View
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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
                    disabled={tickets.length < 10}
                    onClick={() => setPage((p) => p + 1)}
                >
                    Next
                </Button>
            </div>

            {/* MODAL */}
            {selected && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-card border rounded-lg w-[800px] max-h-[90vh] overflow-y-auto p-6 space-y-4">

                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold uppercase">
                                {selected.subject}
                            </h2>

                            <span
                                className={`px-2 py-1 text-xs rounded-full font-medium ${selected.status === "open"
                                    ? "bg-yellow-500/10 text-yellow-600"
                                    : "bg-gray-500/10 text-gray-600"
                                    }`}
                            >
                                {selected.status}
                            </span>
                        </div>

                        <div className="border rounded-md p-4 space-y-3 max-h-72 overflow-y-auto bg-muted/30">

                            {selected.messages?.map((msg: any, i: number) => (
                                <div
                                    key={i}
                                    className={`p-2 rounded-md text-sm max-w-[80%] ${msg.sender === "admin"
                                        ? "bg-primary/10 ml-auto text-right"
                                        : "bg-muted"
                                        }`}
                                >
                                    <div>{msg.message}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {new Date(msg.created_at).toLocaleString()}
                                    </div>
                                </div>
                            ))}

                        </div>

                        <>
                            {/* Textarea */}
                            <textarea
                                rows={3}
                                disabled={selected.status === "closed"}
                                className={`w-full rounded-md p-2 border ${replyError ? "border-red-500" : "border-border"
                                    } ${selected.status === "closed"
                                        ? "bg-muted cursor-not-allowed opacity-70"
                                        : ""
                                    }`}
                                placeholder={
                                    selected.status === "closed"
                                        ? "This ticket is closed"
                                        : "Type reply..."
                                }
                                value={reply}
                                onChange={(e) => {
                                    if (selected.status === "closed") return;
                                    setReply(e.target.value);
                                    setReplyError("");
                                }}
                            />

                            {replyError && (
                                <p className="text-xs text-red-500">{replyError}</p>
                            )}

                            <div className="flex justify-end gap-3">

                                {/* ✅ ALWAYS VISIBLE */}
                                <Button
                                    variant="outline"
                                    onClick={() => setSelected(null)}
                                >
                                    Cancel
                                </Button>

                                {/* ❌ Only when OPEN */}
                                {selected.status === "open" && (
                                    <>
                                        <Button
                                            disabled={replyLoading}
                                            onClick={async () => {
                                                if (!reply.trim()) {
                                                    setReplyError("Reply required");
                                                    return;
                                                }

                                                setReplyLoading(true);

                                                try {
                                                    const res = await fetch(
                                                        `${API_BASE_URL}/admin/support/${selected.id}/reply`,
                                                        {
                                                            method: "POST",
                                                            headers: {
                                                                Authorization: `Bearer ${accessToken}`,
                                                                "Content-Type": "application/json",
                                                            },
                                                            body: JSON.stringify({ message: reply }),
                                                        }
                                                    );

                                                    const json = await res.json();

                                                    if (!json.success) {
                                                        toast.error(json.message);
                                                        return;
                                                    }

                                                    toast.success("Reply sent");
                                                    setReply("");

                                                    const reload = await fetch(
                                                        `${API_BASE_URL}/admin/support/${selected.id}`,
                                                        {
                                                            headers: {
                                                                Authorization: `Bearer ${accessToken}`,
                                                            },
                                                        }
                                                    );

                                                    const reloadJson = await reload.json();
                                                    if (reloadJson.success) {
                                                        setSelected(reloadJson.data);
                                                    }

                                                    fetchTickets();

                                                } catch {
                                                    toast.error("Failed to send reply");
                                                } finally {
                                                    setReplyLoading(false);
                                                }
                                            }}
                                        >
                                            Send
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            onClick={async () => {
                                                await fetch(
                                                    `${API_BASE_URL}/admin/support/${selected.id}/close`,
                                                    {
                                                        method: "POST",
                                                        headers: {
                                                            Authorization: `Bearer ${accessToken}`,
                                                        },
                                                    }
                                                );

                                                toast.success("Ticket closed");

                                                const reload = await fetch(
                                                    `${API_BASE_URL}/admin/support/${selected.id}`,
                                                    {
                                                        headers: {
                                                            Authorization: `Bearer ${accessToken}`,
                                                        },
                                                    }
                                                );

                                                const reloadJson = await reload.json();
                                                if (reloadJson.success) {
                                                    setSelected(reloadJson.data);
                                                }

                                                fetchTickets();
                                            }}
                                        >
                                            Close Ticket
                                        </Button>
                                    </>
                                )}
                            </div>
                        </>

                    </div>
                </div>
            )}
        </div>
    );
}
