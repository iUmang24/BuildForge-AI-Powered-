"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EmailTemplateEditPage() {
    const { id } = useParams();
    const { accessToken } = useAdminAuth();

    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testEmail, setTestEmail] = useState("");

    /* ================= LOAD TEMPLATE ================= */

    useEffect(() => {
        if (!accessToken || !id) return;

        fetch(`${API_BASE_URL}/admin/email-templates/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
            .then((res) => res.json())
            .then((json) => setTemplate(json.data))
            .finally(() => setLoading(false));
    }, [accessToken, id]);

    /* ================= SAVE ================= */

    const handleSave = async () => {
        if (!template) return;

        setSaving(true);

        await fetch(`${API_BASE_URL}/admin/email-templates/${id}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                subject: template.subject,
                body: template.body,
                description: template.description,
                is_active: template.is_active,
            }),
        });

        setSaving(false);
        alert("Template updated successfully");
    };

    /* ================= SEND TEST ================= */

    const handleTest = async () => {
        if (!testEmail) return alert("Enter test email");

        await fetch(
            `${API_BASE_URL}/admin/email-templates/${id}/test`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ testEmail }),
            }
        );

        alert("Test email sent");
    };

    if (loading) {
        return <div>Loading template...</div>;
    }

    if (!template) {
        return <div>Template not found</div>;
    }

    return (
        <div className="space-y-8">

            {/* BACK BUTTON */}
            <Link
                href="/admin/email-templates"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Email Templates
            </Link>
            <div>
                <h1 className="text-2xl font-bold">
                    Edit Email Template
                </h1>
                <p className="text-muted-foreground">
                    Template Key: {template.template_key}
                </p>
            </div>


            {/* 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* LEFT SIDE - EDITOR */}
                <Card>
                    <CardContent className="p-6 space-y-4">

                        {/* Subject */}
                        <div>
                            <label className="text-sm font-medium">
                                Subject
                            </label>
                            <input
                                className="mt-1 w-full border rounded-md p-2 bg-background"
                                value={template.subject}
                                onChange={(e) =>
                                    setTemplate({
                                        ...template,
                                        subject: e.target.value,
                                    })
                                }
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-sm font-medium">
                                Description
                            </label>
                            <input
                                className="mt-1 w-full border rounded-md p-2 bg-background"
                                value={template.description || ""}
                                onChange={(e) =>
                                    setTemplate({
                                        ...template,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </div>

                        {/* Body */}
                        <div>
                            <label className="text-sm font-medium">
                                HTML Body
                            </label>
                            <textarea
                                rows={14}
                                className="mt-1 w-full border rounded-md p-2 bg-background font-mono text-sm"
                                value={template.body}
                                onChange={(e) =>
                                    setTemplate({
                                        ...template,
                                        body: e.target.value,
                                    })
                                }
                            />
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={template.is_active}
                                onChange={(e) =>
                                    setTemplate({
                                        ...template,
                                        is_active: e.target.checked ? 1 : 0,
                                    })
                                }
                            />
                            <span className="text-sm">Active</span>
                        </div>

                        {/* Save Button */}
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full"
                        >
                            {saving ? "Saving..." : "Save Template"}
                        </Button>

                    </CardContent>
                </Card>

                {/* RIGHT SIDE - LIVE PREVIEW */}
                <Card>
                    <CardContent className="p-6 space-y-4">

                        <h2 className="font-semibold text-lg">
                            Live Preview
                        </h2>

                        <div className="border rounded-md p-4 bg-white text-black overflow-auto max-h-[500px]">
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: template.body,
                                }}
                            />
                        </div>

                        {/* Test Email Section */}
                        <div className="pt-4 border-t space-y-2">
                            <label className="text-sm font-medium">
                                Send Test Email
                            </label>

                            <div className="flex gap-2">
                                <input
                                    placeholder="Enter email address"
                                    className="flex-1 border rounded-md p-2 bg-background"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                />

                                <Button onClick={handleTest}>
                                    Send
                                </Button>
                            </div>
                        </div>

                    </CardContent>
                </Card>

            </div>

        </div>
    );
}