"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";

export default function PricingPage() {

    const { accessToken } = useAdminAuth();

    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 8;

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);

    const emptyPlan = {
        plan_duration: "",
        mrp: "",
        gst_rate: "",
        is_active: 1
    };

    const [form, setForm] = useState<any>(emptyPlan);



    /* ================= FETCH ================= */

    const fetchPricing = async () => {

        if (!accessToken) return;

        setLoading(true);

        try {

            const res = await fetch(`${API_BASE_URL}/admin/pricing`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const json = await res.json();

            let rows = json.data || [];

            if (search) {
                rows = rows.filter((p: any) =>
                    p.plan_duration.toLowerCase().includes(search.toLowerCase())
                );
            }

            const start = (page - 1) * limit;
            setPlans(rows.slice(start, start + limit));

        } catch {

            toast.error("Failed to load pricing");

        }

        setLoading(false);

    };

    useEffect(() => {
        fetchPricing();
    }, [accessToken, page]);



    /* ================= VALIDATION ================= */

    const validateForm = () => {

        if (!form.plan_duration.trim()) {
            toast.error("Plan duration required");
            return false;
        }

        if (!form.mrp) {
            toast.error("MRP required");
            return false;
        }

        if (!form.gst_rate) {
            toast.error("GST rate required");
            return false;
        }

        return true;

    };



    /* ================= SAVE ================= */

    const handleSave = async () => {

        if (!validateForm()) return;

        try {

            if (editing) {

                await fetch(`${API_BASE_URL}/admin/pricing/${editing.id}`, {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(form)
                });

                toast.success("Pricing updated");

            } else {

                await fetch(`${API_BASE_URL}/admin/pricing`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(form)
                });

                toast.success("Pricing created");

            }

            setShowModal(false);
            setEditing(null);
            setForm(emptyPlan);

            fetchPricing();

        } catch {

            toast.error("Save failed");

        }

    };



    /* ================= DELETE ================= */

    const handleDelete = async (id: number) => {

        if (!confirm("Delete this plan?")) return;

        try {

            await fetch(`${API_BASE_URL}/admin/pricing/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            toast.success("Plan deleted");

            fetchPricing();

        } catch {

            toast.error("Delete failed");

        }

    };



    /* ================= UI ================= */

    return (

        <div className="space-y-8">

            {/* HEADER */}

            <div className="flex justify-between items-center">

                <div>

                    <h1 className="text-2xl font-bold">
                        Pricing Plans
                    </h1>

                    <p className="text-muted-foreground">
                        Manage platform pricing
                    </p>

                </div>

                <Button
                    onClick={() => {
                        setEditing(null);
                        setForm(emptyPlan);
                        setShowModal(true);
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Plan
                </Button>

            </div>



            {/* SEARCH */}

            <div className="flex gap-3 items-center">

                <div className="relative w-72">

                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

                    <input
                        placeholder="Search plan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 w-full border rounded-md p-2 bg-background"
                    />

                </div>

                <Button variant="outline" onClick={fetchPricing}>
                    Search
                </Button>

            </div>



            {/* TABLE */}

            <Card>

                <CardContent className="p-0">

                    {loading ? (
                        <div className="p-6 text-center text-muted-foreground">
                            Loading pricing...
                        </div>
                    ) : (

                        <table className="w-full text-sm">

                            <thead className="bg-muted">

                                <tr>
                                    <th className="p-4 text-left">Plan</th>
                                    <th className="p-4">MRP</th>
                                    <th className="p-4">GST</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>

                            </thead>

                            <tbody>

                                {plans.map((p) => (
                                    <tr key={p.id} className="border-t hover:bg-muted/40">

                                        <td className="p-4 font-medium">
                                            {p.plan_duration}
                                        </td>

                                        <td className="p-4">
                                            ₹{p.mrp}
                                        </td>

                                        <td className="p-4">
                                            {p.gst_rate}%
                                        </td>

                                        <td className="p-4">
                                            {p.is_active ? "Active" : "Disabled"}
                                        </td>

                                        <td className="p-4 text-center space-x-3">

                                            <button
                                                className="text-primary"
                                                onClick={() => {
                                                    setEditing(p);
                                                    setForm(p);
                                                    setShowModal(true);
                                                }}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="text-red-500"
                                                onClick={() => handleDelete(p.id)}
                                            >
                                                Delete
                                            </button>

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
                    disabled={plans.length < limit}
                    onClick={() => setPage((p) => p + 1)}
                >
                    Next
                </Button>

            </div>



            {/* CREATE / EDIT MODAL */}

            {showModal && (

                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                    <div className="bg-card border rounded-lg w-[500px] p-6 space-y-4">

                        <h2 className="text-lg font-bold">
                            {editing ? "Edit Pricing" : "Create Pricing"}
                        </h2>

                        <input
                            placeholder="Plan Name (training / certificate)"
                            className="w-full border p-2 rounded"
                            value={form.plan_duration}
                            onChange={(e) => setForm({ ...form, plan_duration: e.target.value })}
                        />

                        <input
                            type="number"
                            placeholder="MRP"
                            className="w-full border p-2 rounded"
                            value={form.mrp}
                            onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                        />

                        <input
                            type="number"
                            placeholder="GST Rate"
                            className="w-full border p-2 rounded"
                            value={form.gst_rate}
                            onChange={(e) => setForm({ ...form, gst_rate: e.target.value })}
                        />

                        <div className="flex items-center gap-2">

                            <input
                                type="checkbox"
                                checked={form.is_active === 1}
                                onChange={(e) =>
                                    setForm({ ...form, is_active: e.target.checked ? 1 : 0 })
                                }
                            />

                            <span>Active</span>

                        </div>

                        <div className="flex justify-end gap-3">

                            <Button variant="outline" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>

                            <Button onClick={handleSave}>
                                Save
                            </Button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}