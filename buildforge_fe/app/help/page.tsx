"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { API_BASE_URL } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard-layout";
import { hardLogout } from "@/lib/hardLogout";
import { toast } from "sonner";
import { LifeBuoy } from "lucide-react";

export default function HelpPage() {
    const { user, accessToken, authReady, refreshUser } = useAuth();
    const { canRender } = useRequireAuth();

    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [tickets, setTickets] = useState<any[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);


    /* ================= FETCH TICKETS ================= */

    const fetchTickets = async () => {
        if (!accessToken) return;

        try {
            const res = await fetch(`${API_BASE_URL}/support`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (res.status === 401 || res.status === 403) {
                await refreshUser();
                return;
            }

            const json = await res.json();
            if (json.success) {
                setTickets(json.data);
            }
        } catch {
            toast.error("Failed to load tickets");
        } finally {
            setLoadingTickets(false);
        }
    };

    useEffect(() => {
        if (accessToken) fetchTickets();
    }, [accessToken]);

    /* ================= VALIDATION ================= */

    const validate = () => {
        const newErrors: any = {};

        if (!subject.trim()) {
            newErrors.subject = "Subject is required";
        }

        if (!message.trim()) {
            newErrors.message = "Message is required";
        } else if (message.trim().length < 10) {
            newErrors.message = "Message must be at least 10 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /* ================= SUBMIT ================= */

    const handleSubmit = async () => {
        if (!validate()) return;

        if (!accessToken) {
            hardLogout();
            return;
        }

        try {
            setSubmitting(true);

            const res = await fetch(`${API_BASE_URL}/support`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ subject, message }),
            });

            if (res.status === 401 || res.status === 403) {
                await refreshUser();
                return;
            }

            const json = await res.json();

            if (!json.success) {
                toast.error(json.message || "Failed to submit request");
                return;
            }

            toast.success("Support request submitted successfully ✅");

            setSubject("");
            setMessage("");
            setErrors({});
            fetchTickets(); // 🔥 refresh list
        } catch {
            toast.error("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    if (!canRender || !authReady) {
        return null;
    }

    /* ================= RENDER ================= */

    return (
        <DashboardLayout title="Need Help">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Page Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">
                        Need Help?
                    </h1>
                    <p className="text-muted-foreground">
                        If you’re facing any issues with tasks, payments, or certificates,
                        submit your query below and our team will assist you.
                    </p>
                </div>

                {/* Help Form */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LifeBuoy className="w-5 h-5" />
                            Submit Support Request
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-5">

                        <div className="text-sm text-muted-foreground">
                            Logged in as <strong>{user?.full_name}</strong> ({user?.email})
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="text-sm font-medium">Subject *</label>
                            <input
                                value={subject}
                                onChange={(e) => {
                                    setSubject(e.target.value);
                                    if (errors.subject)
                                        setErrors((p: any) => ({ ...p, subject: undefined }));
                                }}
                                className={`mt-1 w-full px-3 py-2 rounded-md border bg-background text-foreground
                  ${errors.subject ? "border-red-500" : "border-border"}`}
                                placeholder="Example: Unable to submit Week 4"
                            />
                            {errors.subject && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.subject}
                                </p>
                            )}
                        </div>

                        {/* Message */}
                        <div>
                            <label className="text-sm font-medium">Message *</label>
                            <textarea
                                rows={5}
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    if (errors.message)
                                        setErrors((p: any) => ({ ...p, message: undefined }));
                                }}
                                className={`mt-1 w-full px-3 py-2 rounded-md border bg-background text-foreground
                  ${errors.message ? "border-red-500" : "border-border"}`}
                                placeholder="Describe your issue in detail..."
                            />
                            {errors.message && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.message}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex items-center gap-2"
                            >
                                {submitting && (
                                    <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                                )}
                                {submitting ? "Submitting..." : "Submit Request"}
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Our support team usually responds within 24 hours.
                        </p>

                    </CardContent>
                </Card>

                {/* ================= TICKET LIST ================= */}

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">My Support Tickets</h2>

                    {loadingTickets && <p>Loading tickets...</p>}

                    {!loadingTickets && tickets.length === 0 && (
                        <p className="text-muted-foreground">
                            No support tickets yet.
                        </p>
                    )}

                    {tickets.map((ticket) => (
                        <Card key={ticket.id} className="bg-card border-border">
                            <CardContent className="p-4 space-y-3">

                                <div className="flex justify-between">
                                    <div className="font-bold uppercase tracking-wide">
                                        {ticket.subject}
                                    </div>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full
            ${ticket.status === "open"
                                                ? "bg-yellow-500/10 text-yellow-600"
                                                : ticket.status === "closed"
                                                    ? "bg-gray-500/10 text-gray-600"
                                                    : "bg-green-500/10 text-green-600"
                                            }`}
                                    >
                                        {ticket.status}
                                    </span>
                                </div>

                                {/* 🔥 SCROLLABLE CONVERSATION BLOCK */}
                                <div className="max-h-64 overflow-y-auto space-y-3 border rounded-md p-3 bg-muted/30">

                                    {(!ticket.messages || ticket.messages.length === 0) && (
                                        <div className="text-sm text-muted-foreground text-center">
                                            No messages yet.
                                        </div>
                                    )}
                                    {ticket.messages?.map((msg: any, index: number) => (
                                        <div
                                            key={index}
                                            className={`text-sm p-2 rounded-md max-w-[80%]
              ${msg.sender === "student"
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

                                {/* 🔥 STUDENT REPLY BOX */}
                                {ticket.status === "open" && (
                                    <div className="pt-3 border-t space-y-2">
                                        <textarea
                                            rows={2}
                                            placeholder="Type your reply..."
                                            className="w-full px-3 py-2 rounded-md border bg-background text-foreground text-sm"
                                            value={ticket.replyMessage || ""}
                                            onChange={(e) => {
                                                setTickets((prev) =>
                                                    prev.map((t) =>
                                                        t.id === ticket.id
                                                            ? { ...t, replyMessage: e.target.value }
                                                            : t
                                                    )
                                                );
                                            }}
                                        />

                                        <div className="flex justify-end">
                                            <Button
                                                size="sm"
                                                onClick={async () => {
                                                    const reply = ticket.replyMessage?.trim();

                                                    if (!reply) {
                                                        toast.error("Reply cannot be empty");
                                                        return;
                                                    }

                                                    if (reply.length < 2) {
                                                        toast.error("Reply is too short");
                                                        return;
                                                    }

                                                    try {
                                                        const res = await fetch(
                                                            `${API_BASE_URL}/support/${ticket.id}/reply`,
                                                            {
                                                                method: "POST",
                                                                headers: {
                                                                    "Content-Type": "application/json",
                                                                    Authorization: `Bearer ${accessToken}`,
                                                                },
                                                                body: JSON.stringify({ message: reply }),
                                                            }
                                                        );

                                                        if (res.status === 401 || res.status === 403) {
                                                            await refreshUser();
                                                            return;
                                                        }

                                                        const json = await res.json();

                                                        if (!json.success) {
                                                            toast.error(json.message);
                                                            return;
                                                        }

                                                        toast.success("Reply sent");
                                                        setTickets((prev) =>
                                                            prev.map((t) =>
                                                                t.id === ticket.id ? { ...t, replyMessage: "" } : t
                                                            )
                                                        );

                                                        fetchTickets();
                                                    } catch {
                                                        toast.error("Failed to send reply");
                                                    }
                                                }}
                                            >
                                                Send
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="text-xs text-muted-foreground">
                                    {new Date(ticket.created_at).toLocaleString()}
                                </div>

                            </CardContent>
                        </Card>
                    ))}
                </div>

            </div>
        </DashboardLayout>
    );
}
