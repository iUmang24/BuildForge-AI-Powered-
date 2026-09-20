"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Search, Calendar } from "lucide-react";

export default function CouponsPage() {

    const { accessToken } = useAdminAuth();

    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 8;

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);

    const emptyCoupon = {
        code: "",
        discount_type: "percent",
        discount_value: 0,
        usage_type: "unlimited",
        max_uses: "",
        expires_at: "",
        is_active: 1
    };

    const [form, setForm] = useState<any>(emptyCoupon);



    /* ================= FETCH ================= */

    const fetchCoupons = async () => {

        if (!accessToken) return;

        setLoading(true);

        try {

            const res = await fetch(`${API_BASE_URL}/admin/coupons`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const json = await res.json();

            let rows = json.data || [];

            if (search) {
                rows = rows.filter((c: any) =>
                    c.code.toLowerCase().includes(search.toLowerCase())
                );
            }

            const start = (page - 1) * limit;
            setCoupons(rows.slice(start, start + limit));

        } catch {

            toast.error("Failed to load coupons");

        }

        setLoading(false);

    };

    useEffect(() => {
        fetchCoupons();
    }, [accessToken, page]);



    /* ================= VALIDATION ================= */

    const validateForm = () => {

        if (!form.code.trim()) {
            toast.error("Coupon code required");
            return false;
        }

        if (!form.discount_value) {
            toast.error("Discount value required");
            return false;
        }

        return true;

    };



    /* ================= SAVE ================= */

    const handleSave = async () => {

        if (!validateForm()) return;

        try {

            if (editing) {

                await fetch(`${API_BASE_URL}/admin/coupons/${editing.id}`, {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(form)
                });

                toast.success("Coupon updated");

            } else {

                await fetch(`${API_BASE_URL}/admin/coupons`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(form)
                });

                toast.success("Coupon created");

            }

            setShowModal(false);
            setEditing(null);
            setForm(emptyCoupon);

            fetchCoupons();

        } catch {

            toast.error("Save failed");

        }

    };



    /* ================= DELETE ================= */

    const handleDelete = async (id: number) => {

        if (!confirm("Delete this coupon?")) return;

        try {

            await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            toast.success("Coupon deleted");

            fetchCoupons();

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
                        Coupons
                    </h1>

                    <p className="text-muted-foreground">
                        Manage discount coupons
                    </p>

                </div>

                <Button
                    onClick={() => {
                        setEditing(null);
                        setForm(emptyCoupon);
                        setShowModal(true);
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Coupon
                </Button>

            </div>



            {/* SEARCH */}

            <div className="flex gap-3 items-center">

                <div className="relative w-72">

                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

                    <input
                        placeholder="Search coupon code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 w-full border rounded-md p-2 bg-background"
                    />

                </div>

                <Button variant="outline" onClick={fetchCoupons}>
                    Search
                </Button>

            </div>



            {/* TABLE */}

            <Card>

                <CardContent className="p-0">

                    {loading ? (
                        <div className="p-6 text-center text-muted-foreground">
                            Loading coupons...
                        </div>
                    ) : (

                        <table className="w-full text-sm">

                            <thead className="bg-muted">

                                <tr>
                                    <th className="p-4">Code</th>
                                    <th className="p-4">Discount</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Usage</th>
                                    <th className="p-4">Used</th>
                                    <th className="p-4">Expires</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>

                            </thead>

                            <tbody>

                                {coupons.map((c) => (
                                    <tr key={c.id} className="border-t hover:bg-muted/40">

                                        <td className="p-4 font-medium">{c.code}</td>

                                        <td className="p-4">
                                            {c.discount_value}{c.discount_type === "percent" ? "%" : "₹"}
                                        </td>

                                        <td className="p-4">{c.discount_type}</td>

                                        <td className="p-4">{c.usage_type}</td>

                                        <td className="p-4">{c.used_count}</td>

                                        <td className="p-4">
                                            {new Date(c.expires_at).toLocaleDateString()}
                                        </td>

                                        <td className="p-4">
                                            {c.is_active ? "Active" : "Disabled"}
                                        </td>

                                        <td className="p-4 text-center space-x-3">

                                            <button
                                                className="text-primary"
                                                onClick={() => {

                                                    setEditing(c);

                                                    setForm({
                                                        ...c,
                                                        expires_at: c.expires_at
                                                            ? c.expires_at.split("T")[0].split(" ")[0]
                                                            : ""
                                                    });

                                                    setShowModal(true);

                                                }}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="text-red-500"
                                                onClick={() => handleDelete(c.id)}
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
                    disabled={coupons.length < limit}
                    onClick={() => setPage((p) => p + 1)}
                >
                    Next
                </Button>

            </div>



            {/* CREATE / EDIT MODAL */}

            {showModal && (

                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                    <div className="bg-card border rounded-lg w-[600px] p-6 space-y-4">

                        <h2 className="text-lg font-bold">
                            {editing ? "Edit Coupon" : "Create Coupon"}
                        </h2>

                        <input
                            placeholder="Coupon Code"
                            className="w-full border p-2 rounded"
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                        />

                        <input
                            type="number"
                            placeholder="Discount Value"
                            className="w-full border p-2 rounded"
                            value={form.discount_value}
                            onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                        />

                        <select
                            className="w-full border p-2 rounded"
                            value={form.discount_type}
                            onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                        >
                            <option value="percent">Percent</option>
                            <option value="amount">Amount</option>
                        </select>

                        <select
                            className="w-full border p-2 rounded"
                            value={form.usage_type}
                            onChange={(e) => setForm({ ...form, usage_type: e.target.value })}
                        >
                            <option value="once">Once</option>
                            <option value="unlimited">Unlimited</option>
                        </select>

                        <input
                            type="number"
                            placeholder="Max Uses"
                            className="w-full border p-2 rounded"
                            value={form.max_uses || ""}
                            onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                        />

                        <div className="flex flex-col gap-1">

                            <label className="text-xs text-muted-foreground">
                                Expiry Date
                            </label>

                            <div className="relative">

                                <input
                                    type="date"
                                    value={form.expires_at || ""}
                                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                                    className="w-full px-3 py-2 pr-10 border rounded-md text-sm bg-background"
                                />

                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                            </div>

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