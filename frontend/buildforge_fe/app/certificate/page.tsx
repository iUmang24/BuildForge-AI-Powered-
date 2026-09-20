"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/lib/config";
import { startPayment } from "@/lib/razorpay";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Clock, Download, Award } from "lucide-react";
import { toast } from "sonner";
import { hardLogout } from "@/lib/hardLogout";
import { useRef } from "react";

export default function CertificatePage() {
  const { accessToken, authReady, refreshUser } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const [pricing, setPricing] = useState<any>(null);
  const [coupon, setCoupon] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  /* ================= FETCH STATUS ================= */

  useEffect(() => {
    if (!authReady) return;

    if (!accessToken) {
      hardLogout();
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/students/certificate`,
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

        const json = await res.json();

        if (!json.success) {
          toast.error(json.message || "Failed to load certificate");
          return;
        }

        setData(json.data);

        /* 🔥 If payment required → load pricing preview */
        if (json.data.status === "payment_required") {
          const previewRes = await fetch(`${API_BASE_URL}/payments/preview`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ plan: "certificate" }),
          });

          const previewJson = await previewRes.json();

          if (previewJson.success) {
            setPricing(previewJson.data);
          }
        }
      } catch (err) {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [authReady, accessToken]);

  /* ================= APPLY COUPON ================= */

  const applyCoupon = async () => {
    if (!coupon.trim()) {
      toast.error("Enter coupon code");
      return;
    }

    try {
      setApplyingCoupon(true);

      const res = await fetch(`${API_BASE_URL}/payments/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          plan: "certificate",
          coupon_code: coupon.trim(),
        }),
      });

      const json = await res.json();

      if (!json.success) {
        toast.error(json.message);
        return;
      }

      setPricing(json.data);
      toast.success("Coupon applied");
    } catch {
      toast.error("Failed to apply coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <DashboardLayout title="Certificate">
      {/* AUTH NOT READY */}
      {!authReady && (
        <div className="p-6 text-muted-foreground">
          Checking session…
        </div>
      )}

      {/* LOADING */}
      {authReady && loading && (
        <div className="p-6">Loading certificate…</div>
      )}

      {/* ERROR */}
      {authReady && !loading && !data && (
        <div className="p-6 text-center text-muted-foreground">
          Unable to load certificate status
        </div>
      )}

      {/* LOCKED */}
      {data?.status === "locked" && (
        <Card className="max-w-xl mx-auto border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Certificate Locked
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground space-y-2">

            {/* If backend sent custom message (end date restriction) */}
            {data?.message ? (
              <>
                <p>{data.message}</p>

                {data?.issue_date && (
                  <p className="text-foreground font-medium">
                    Expected Issue Date:{" "}
                    {new Date(data.issue_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </>
            ) : (
              // Default message (week 8 not completed)
              <p>
                Submit and complete your Week 8 project to unlock the certificate.
              </p>
            )}

          </CardContent>
        </Card>
      )}

      {/* UNDER REVIEW */}
      {data?.status === "under_review" && (
        <Card className="max-w-xl mx-auto border-info/30 bg-info/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-info">
              <Clock className="w-5 h-5" />
              Final Project Under Review
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your final project has been submitted successfully.
            </p>

            <p className="text-sm text-muted-foreground">
              Our team is currently reviewing your submission.
              This usually takes up to <strong>24 hours</strong>.
            </p>

            <p className="text-xs text-muted-foreground">
              Certificate payment will be enabled once approved.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 💳 CERTIFICATE PAYMENT */}
      {data?.status === "payment_required" && pricing && (
        <Card className="max-w-xl mx-auto border-success/30 bg-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <Award className="w-5 h-5" />
              Get Your Internship Certificate
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* INFO */}
            <p className="text-sm text-muted-foreground">
              🎉 Your final project has been approved!
              Complete the certificate payment to download your official internship certificate.
            </p>

            {/* PRICE BREAKDOWN */}
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Original Price</span>
                <span>₹{pricing.originalAmount.toFixed(2)}</span>
              </div>

              {pricing.discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-₹{pricing.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Taxable Amount</span>
                <span>₹{pricing.baseAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>₹{pricing.gstAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Net Payable</span>
                <span>₹{pricing.finalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* COUPON */}
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Coupon code"
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <button
                onClick={applyCoupon}
                disabled={applyingCoupon}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {applyingCoupon ? "Applying..." : "Apply"}
              </button>
            </div>

            {/* PAY BUTTON */}
            <div className="flex justify-end">
              <button
                disabled={paying || applyingCoupon}
                onClick={async () => {
                  try {
                    setPaying(true);
                    await startPayment("certificate", accessToken!, coupon || undefined);
                    toast.success("Certificate unlocked 🎓");
                    window.location.reload();
                  } catch (err: any) {
                    toast.error(err.message || "Payment failed");
                  } finally {
                    setPaying(false);
                  }
                }}
                className={`
                  px-5 py-2 rounded-md font-medium flex items-center gap-2
                  ${paying
                    ? "bg-success/60 cursor-not-allowed"
                    : "bg-success text-success-foreground"}
                `}
              >
                {paying && (
                  <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                )}

                {paying
                  ? "Opening payment..."
                  : `Pay ₹${pricing.finalAmount.toFixed(2)}`}
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              * Invoice will be available after payment.
            </p>

          </CardContent>
        </Card>
      )}

      {/* AVAILABLE */}
      {data?.status === "available" && (
        <CertificatePreview
          accessToken={accessToken!}
          downloadUrl={data.download_url}
        />
      )}
    </DashboardLayout>
  );
}

function CertificatePreview({
  accessToken,
  downloadUrl,
}: {
  accessToken: string;
  downloadUrl: string;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false); // 👈 guard

  useEffect(() => {
    if (hasFetched.current) return; // 👈 prevent second call
    hasFetched.current = true;

    const fetchPdf = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}${downloadUrl}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to load certificate");
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        setPdfUrl(url);
      } catch (err) {
        toast.error("Failed to load certificate");
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();
  }, [accessToken, downloadUrl]);

  return (
    <Card className="max-w-5xl mx-auto border-success">
      <CardHeader>
        <CardTitle className="text-success">
          Certificate Ready 🎉
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        {loading && <p>Loading certificate preview...</p>}

        {pdfUrl && (
          <iframe
            src={pdfUrl}
            className="w-full h-[800px] border rounded-md"
          />
        )}

        {pdfUrl && (
          <div className="flex justify-end">
            <Button
              onClick={() => {
                const link = document.createElement("a");
                link.href = pdfUrl;
                link.download = "certificate.pdf";
                link.click();
              }}
            >
              <Download className="mr-2" />
              Download Certificate
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  );
}