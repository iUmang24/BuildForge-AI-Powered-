"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/lib/config";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { hardLogout } from "@/lib/hardLogout";
import { toast } from "sonner";

export default function PaymentsPage() {
    const { canRender } = useRequireAuth();
    const { accessToken, refreshUser } = useAuth();

    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    // ✅ HOOKS MUST ALWAYS RUN
    useEffect(() => {
        if (!accessToken || !canRender) return;

        const fetchPayments = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/students/payments`, {
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
                    setPayments(json.data);
                }
            } catch (err) {
                console.error("Payments fetch failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [accessToken, canRender]);

    // ✅ SAFE RETURN AFTER HOOKS
    if (!canRender) return null;

    const downloadInvoice = async (paymentId: number) => {
        try {

            setDownloadingId(paymentId);

            const res = await fetch(
                `${API_BASE_URL}/payments/${paymentId}/invoice`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (res.status === 401 || res.status === 403) {
                await refreshUser();
                return;
            }

            toast.success("Invoice downloaded");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice_${paymentId}.pdf`;
            document.body.appendChild(a);
            a.click();

            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error("Invoice download failed");
            console.error("Invoice download failed", err);
        } finally {
            setDownloadingId(null); // 🔥 stop loading
        }
    };

    return (
        <DashboardLayout title="Payments">
            <div className="max-w-4xl mx-auto space-y-4">

                {loading && <div>Loading payments...</div>}

                {!loading && payments.length === 0 && (
                    <p className="text-muted-foreground">No payments found</p>
                )}

                {!loading &&
                    payments.map((p) => (
                        <div key={p.id} className="border rounded-lg p-4 space-y-3">

                            <div className="flex justify-between items-center">
                                <p className="font-semibold capitalize">
                                    {p.plan_duration} Plan
                                </p>

                                {p.status === "paid" && <span className="text-green-600">✅ Paid</span>}
                                {p.status === "created" && <span className="text-yellow-600">⏳ Pending</span>}
                                {p.status === "failed" && <span className="text-red-600">❌ Failed</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-muted-foreground">Original Price</div>
                                <div className="text-right">
                                    ₹{Number(p.original_amount).toFixed(2)}
                                </div>
                                {p.coupon_code && p.original_amount && (
                                    <>
                                        <div className="text-success">Discount</div>
                                        <div className="text-right text-success">
                                            -₹{Number(p.discount_amount).toFixed(2)}
                                        </div>
                                    </>
                                )}
                                <div className="text-muted-foreground">Taxable Amount</div>
                                <div className="text-right">
                                    ₹{Number(p.amount).toFixed(2)}
                                </div>

                                <div>Tax / Extra Charges</div>
                                <div className="text-right">₹{Number(p.extra_charges).toFixed(2)}</div>

                                <div className="font-medium">Final Paid</div>
                                <div className="text-right font-semibold">₹{Number(p.final_paid).toFixed(2)}</div>
                            </div>

                            <div className="text-xs text-muted-foreground space-y-1">
                                <div><strong>Order ID:</strong> {p.razorpay_order_id}</div>
                                {p.razorpay_payment_id && (
                                    <div><strong>Payment ID:</strong> {p.razorpay_payment_id}</div>
                                )}
                                {p.coupon_code && (
                                    <div><strong>Coupon:</strong> {p.coupon_code}</div>
                                )}
                                <div>
                                    <strong>Date:</strong>{" "}
                                    {new Date(p.created_at).toLocaleString()}
                                </div>
                                {p.status === "failed" && p.failure_message && (
                                    <div className="text-red-600">
                                        <strong>Failure Reason:</strong> {p.failure_message}
                                    </div>
                                )}
                                {p.status === "paid" && (
                                    <div className="pt-3 border-t">
                                        <button
                                            onClick={() => downloadInvoice(p.id)}
                                            disabled={downloadingId === p.id}
                                            className={`text-sm underline flex items-center gap-2
        ${downloadingId === p.id
                                                    ? "text-muted-foreground cursor-not-allowed"
                                                    : "text-primary hover:opacity-80"
                                                }
    `}
                                        >
                                            {downloadingId === p.id && (
                                                <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                            )}

                                            {downloadingId === p.id
                                                ? "Downloading..."
                                                : " Download Invoice"}
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    ))}
            </div>
        </DashboardLayout>
    );
}
