"use client";

import { useEffect, useState } from "react";
import { TaskCard } from "@/components/task-card";
import { ProgressBar } from "@/components/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
// import { tasks } from "@/lib/data/tasks";
// import { internship } from "@/lib/data/user";
import { Calendar, Target, Award, Clock } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import { hardLogout } from "@/lib/hardLogout";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { startPayment } from "@/lib/razorpay";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, authReady, accessToken, refreshUser } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [dateError, setDateError] = useState("");

  const [coupon, setCoupon] = useState("");
  type PricingType = {
    originalAmount: number;
    baseAmount: number;
    gstAmount: number;
    discountAmount: number;
    finalAmount: number;
  };

  const [trainingPricing, setTrainingPricing] = useState<PricingType | null>(null);
  const [certificatePricing, setCertificatePricing] = useState<PricingType | null>(null);
  const [directCertificatePricing, setDirectCertificatePricing] = useState<PricingType | null>(null);
  const [manualStartDate, setManualStartDate] = useState("");
  const [manualEndDate, setManualEndDate] = useState("");
  const [dcStatus, setDcStatus] = useState<any>(null);
  const [projectName, setProjectName] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [submittingDC, setSubmittingDC] = useState(false);

  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const { canRender } = useRequireAuth();


  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/students/announcements`, {
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
        setAnnouncements(json.data);
      }
    } catch (err) {
      console.error("Announcements error", err);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/students/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // 🔥 TOKEN EXPIRED
      if (res.status === 401 || res.status === 403) {
        await refreshUser();
        return false;
      }

      const json = await res.json();

      if (json.success) {
        setDashboardData(json.data);
      }
    } catch (err) {
      console.error("Dashboard API error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async (
    plan: string,
    setter: React.Dispatch<React.SetStateAction<PricingType | null>>
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plan }),
      });

      if (res.status === 401 || res.status === 403) {
        await refreshUser();
        return;
      }

      const json = await res.json();

      if (json.success) {
        setter(json.data);
      }
    } catch (err) {
      console.error("Failed to load pricing", err);
    }
  };

  const fetchDirectCertificateStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/students/directcertstatus`, {
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
        setDcStatus(json.data);
      }
    } catch (err) {
      console.error("DC status error", err);
    }
  };

  const submitDirectCertificate = async () => {
    if (!projectName.trim()) {
      toast.error("Enter project name");
      return;
    }

    if (!githubLink.startsWith("https://github.com/")) {
      toast.error("Enter valid GitHub link");
      return;
    }

    if (!manualStartDate || !manualEndDate) {
      toast.error("Select internship dates");
      return;
    }

    /* ✅ NEW VALIDATION: End date must be before today */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedEndDate = new Date(manualEndDate);
    selectedEndDate.setHours(0, 0, 0, 0);

    // if (selectedEndDate >= today) {
    //   toast.error("Internship end date cannot be today or future date");
    //   return;
    // }
    if (selectedEndDate >= today) {
      setDateError(
        "You are submitting your internship project for evaluation today. Please select internship start and end dates that have already passed. The dates you provide will be printed on your certificate if approved. The internship end date must be earlier than today and cannot be today's date or any future date. Certificates cannot be issued in advance. Please verify all dates carefully before submission."
      );
      return;
    }

    setDateError("");

    try {
      setSubmittingDC(true);

      const res = await fetch(`${API_BASE_URL}/students/directcertsubmit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          project_name: projectName,
          github_link: githubLink,
          start_date: manualStartDate,
          end_date: manualEndDate,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        await refreshUser();
        return;
      }

      const json = await res.json();

      if (!json.success) {
        toast.error(json.message);
        return;
      }

      toast.success("Submitted for admin approval");
      fetchDirectCertificateStatus();

    } catch {
      toast.error("Submission failed");
    } finally {
      setSubmittingDC(false);
    }
  };

  const recoverPayment = async (plan: "training" | "certificate" | "direct_certificate") => {
    try {

      const res = await fetch(`${API_BASE_URL}/payments/recover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ plan })
      });

      if (res.status === 401 || res.status === 403) {
        await refreshUser();
        return;
      }

      const json = await res.json();

      if (!json.success) {
        toast.error(json.message || "Recovery failed");
        return;
      }

      toast.success("Payment verified successfully");

      await refreshUser();
      await fetchDashboard();

    } catch {
      toast.error("Payment recovery failed");
    }
  };

  const header = dashboardData?.header;
  const week8Task = dashboardData?.tasks?.find(
    (t: any) => t.week_number === 8
  );
  const week8Submitted = week8Task?.status === "submitted";
  const week8Reviewed = week8Task?.status === "reviewed";
  const activePlan =
    !user?.training_paid && header?.current_week >= 2
      ? "training"
      : user?.training_paid && week8Reviewed && !user?.certificate_paid
        ? "certificate"
        : null;
  const showDirectCertificateOption =
    !user?.training_paid && !user?.certificate_paid;

  const directCertificatePlan = showDirectCertificateOption
    ? "direct_certificate"
    : null;

  useEffect(() => {
    if (!authReady || !user || !accessToken) return;

    fetchDashboard();
    fetchAnnouncements();
    fetchDirectCertificateStatus();
  }, [authReady, user, accessToken]);

  useEffect(() => {
    if (!accessToken || !dashboardData) return;

    // Training pricing
    if (!user?.training_paid && header?.current_week >= 2) {
      fetchPreview("training", setTrainingPricing);
    }

    // Direct certificate pricing
    if (!user?.training_paid && !user?.certificate_paid) {
      fetchPreview("direct_certificate", setDirectCertificatePricing);
    }

    // Certificate pricing
    if (user?.training_paid && week8Reviewed && !user?.certificate_paid) {
      fetchPreview("certificate", setCertificatePricing);
    }

  }, [accessToken, dashboardData]);

  useEffect(() => {
    if (dcStatus) {
      setProjectName(dcStatus.project_name || "");
      setGithubLink(dcStatus.github_link || "");

      setManualStartDate(
        dcStatus.start_date
          ? dcStatus.start_date.slice(0, 10)
          : ""
      );

      setManualEndDate(
        dcStatus.end_date
          ? dcStatus.end_date.slice(0, 10)
          : ""
      );
    }
  }, [dcStatus]);

  if (!authReady || !canRender || loading) {
    return <div className="text-center p-6">Loading dashboard...</div>;
  }

  if (!user) return null;


  const statsApi = dashboardData?.stats;
  const tasks = dashboardData?.tasks || [];
  const currentTaskApi = dashboardData?.currentTask;

  const completedTasks = statsApi?.completed_tasks ?? 0;
  const submittedTasks = statsApi?.pending_review ?? 0;
  const currentTask = currentTaskApi;



  const mapTaskForCard = (task: any) => ({
    id: task.student_task_id,
    week: task.week_number,
    status: task.status,
    title: task.title,
    description: task.description,
    deadline: task.due_date,
    score: task.score ?? 0,
  });

  const stats = [
    {
      label: "Completed Tasks",
      value: completedTasks,
      total: tasks.length,
      icon: Target,
      color: "text-success",
    },
    {
      label: "Pending Review",
      value: submittedTasks,
      icon: Clock,
      color: "text-warning",
    },
    {
      label: "Current Week",
      value: header?.current_week ?? 1,
      total: header?.total_weeks ?? 1,
      icon: Calendar,
      color: "text-info",
    },
    {
      label: "Avg Score",
      value: Number(statsApi?.avg_score ?? 0),
      suffix: "/10",
      icon: Award,
      color: "text-primary",
    },
  ];

  const currentPaymentPlan =
    activePlan ?? directCertificatePlan;
  // 🔹 APPLY COUPON (PRICE PREVIEW ONLY)
  const applyCoupon = async (plan: string) => {
    if (!coupon.trim()) {
      toast.error("Enter a coupon code");
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
          plan,
          coupon_code: coupon.trim(),
        }),
      });

      if (res.status === 401 || res.status === 403) {
        await refreshUser();
        return;
      }

      const json = await res.json();

      if (!json.success) {
        toast.error(json.message);
        return;
      }

      if (plan === "training") {
        setTrainingPricing(json.data);
      }

      if (plan === "direct_certificate") {
        setDirectCertificatePricing(json.data);
      }

      if (plan === "certificate") {
        setCertificatePricing(json.data);
      }

      toast.success("Coupon applied");
    } catch {
      toast.error("Failed to apply coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleTrainingPayment = async () => {
    try {
      setPaying(true);
      await startPayment("training", accessToken!, coupon || undefined);

      toast.success("Training unlocked");

      await refreshUser();      // ✅ UPDATE AUTH USER
      await fetchDashboard();   // ✅ UPDATE DASHBOARD DATA

    } catch (err: any) {
      if (err.message === "SESSION_EXPIRED") return;
      if (err.message === "PAYMENT_CANCELLED") {
        toast.info("Payment cancelled");
        return;
      }
      toast.error(err.message || "Payment failed");
    } finally {
      setPaying(false); // 🔄 STOP LOADING
    }
  };

  console.log("CAN RENDER:", canRender);
  console.log("STATS API:", statsApi);



  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 🔔 GLOBAL ANNOUNCEMENTS */}
      {announcements.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-primary text-primary-foreground py-2 px-4">
          <div className="animate-marquee whitespace-nowrap">
            {announcements.map((a, index) => (
              <span key={a.id} className="mr-12 font-medium">
                📢 {a.title} — {a.message}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Welcome, {user.full_name}!
        </h1>
        <p className="text-muted-foreground">
          {header?.project_title} - {header?.total_weeks} Weeks
        </p>
      </div>

      {/* Progress Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar
            value={header?.current_week ?? 1}
            max={header?.total_weeks ?? 1}
          />
        </CardContent>
      </Card>

      {/* 🔒 TRAINING PAYMENT BLOCK */}
      {!user.training_paid && header?.current_week >= 2 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-warning">
              Unlock Full Training
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* INFO */}
            <p className="text-sm text-muted-foreground">
              Week 1 is free. Unlock weeks 2–8 with one-time payment.
            </p>

            {/* PRICE BREAKDOWN */}
            {trainingPricing && (
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Original Price</span>
                  <span>₹{trainingPricing.originalAmount.toFixed(2)}</span>
                </div>

                {trainingPricing.discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-₹{trainingPricing.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Taxable Amount</span>
                  <span>₹{trainingPricing.baseAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>₹{trainingPricing.gstAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Net Payable (Inc. of taxes)</span>
                  <span>₹{trainingPricing.finalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* COUPON */}
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Coupon code"
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <button
                onClick={() => applyCoupon("training")}
                disabled={applyingCoupon}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {applyingCoupon ? "Applying..." : "Apply"}
              </button>
            </div>


            {/* PAY BUTTON */}
            <div className="flex justify-end">
              <button
                onClick={handleTrainingPayment}
                disabled={paying || applyingCoupon || !trainingPricing}
                className={`
            px-5 py-2 rounded-md font-medium flex items-center gap-2
            ${paying
                    ? "bg-warning/60 cursor-not-allowed"
                    : "bg-warning text-warning-foreground"}
          `}
              >
                {paying && (
                  <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                )}
                {paying
                  ? "Opening payment..."
                  : trainingPricing
                    ? `Pay ₹${trainingPricing.finalAmount.toFixed(2)}`
                    : "Loading price..."
                }

              </button>
            </div>

            {/* VERIFY PAYMENT BELOW */}
            {!user.training_paid && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => recoverPayment("training")}
                  className="text-xs underline text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Already paid? Verify payment
                </button>
              </div>
            )}

            {/* FOOTER NOTE */}
            <p className="text-xs text-muted-foreground">
              * Invoice will be available after payment.
            </p>

          </CardContent>
        </Card>
      )}

      {/* 🎓 DIRECT CERTIFICATE OPTION */}
      {showDirectCertificateOption && directCertificatePricing && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">
              Project Evaluation & Certificate Request
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* DESCRIPTION */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Students who wish to obtain an Internship Certificate through project evaluation
                may submit their independently developed project for academic review.
              </p>

              <p>
                Your submitted project will be reviewed by our academic team. Once the project meets the required standards and is formally approved, the certificate payment option will be activated.
              </p>

              <p>
                The payment button will remain disabled until your project is formally approved.
              </p>

              <p>
                After approval, you may proceed with payment to generate and download your official Internship Certificate.
              </p>
            </div>

            {/* ================= NO REQUEST YET ================= */}
            {!dcStatus && (
              <div className="space-y-4">

                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project Name"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />

                <input
                  value={githubLink}
                  onChange={(e) => setGithubLink(e.target.value)}
                  placeholder="https://github.com/user/frontend,https://github.com/user/backend,https://myfrontend.vercel.app,https://mybackend.onrender.com"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Format: Frontend GitHub link, Backend GitHub link, Frontend Live URL, Backend Live URL
                  <br />
                  (Comma separated, in this exact order)
                </p>

                <div className="grid sm:grid-cols-2 gap-4">

                  <div className="flex flex-col gap-1"> <label className="text-xs text-muted-foreground"> Internship Start Date </label> <div className="relative"> <input
                    type="date"
                    value={manualStartDate}
                    onChange={(e) => {
                      setManualStartDate(e.target.value);
                      setDateError("");
                    }}
                    className="w-full px-3 py-2 pr-10 border rounded-md text-sm bg-background text-foreground appearance-none"
                  /> <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" /> </div> </div>

                  <div className="flex flex-col gap-1"> <label className="text-xs text-muted-foreground"> Internship End Date </label> <div className="relative"> <input
                    type="date"
                    value={manualEndDate}
                    onChange={(e) => {
                      setManualEndDate(e.target.value);
                      setDateError("");
                    }}
                    className="w-full px-3 py-2 pr-10 border rounded-md text-sm bg-background text-foreground appearance-none"
                  /> <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" /> </div> </div>
                </div>

                {dateError && (
                  <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 mt-2">
                    <p className="text-sm text-yellow-400">
                      {dateError}
                    </p>
                  </div>
                )}

                <button
                  onClick={submitDirectCertificate}
                  disabled={submittingDC}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-md"
                >
                  {submittingDC ? "Submitting..." : "Submit for Approval"}
                </button>

              </div>
            )}

            {/* ================= PENDING ================= */}
            {dcStatus?.status === "pending" && (
              <div className="bg-warning/10 p-4 rounded-md text-warning text-sm">
                ⏳ Your project is under admin review.
                You will be able to proceed to payment once approved.
              </div>
            )}

            {/* ================= REJECTED ================= */}
            {dcStatus?.status === "rejected" && (
              <div className="space-y-4">

                <div className="bg-destructive/10 p-3 rounded text-destructive text-sm">
                  ❌ Rejected: {dcStatus.admin_feedback}
                </div>

                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project Name"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />

                <input
                  value={githubLink}
                  onChange={(e) => setGithubLink(e.target.value)}
                  placeholder="https://github.com/user/frontend,https://github.com/user/backend,https://myfrontend.vercel.app,https://mybackend.onrender.com"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Format: Frontend GitHub link, Backend GitHub link, Frontend Live URL, Backend Live URL
                  <br />
                  (Comma separated, in this exact order)
                </p>

                <div className="grid sm:grid-cols-2 gap-4">

                  <div className="flex flex-col gap-1"> <label className="text-xs text-muted-foreground"> Internship Start Date </label> <div className="relative"> <input type="date" value={manualStartDate} onChange={(e) => setManualStartDate(e.target.value)} className=" w-full px-3 py-2 pr-10 border rounded-md text-sm bg-background text-foreground appearance-none " /> <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" /> </div> </div>

                  <div className="flex flex-col gap-1"> <label className="text-xs text-muted-foreground"> Internship End Date </label> <div className="relative"> <input type="date" value={manualEndDate} onChange={(e) => setManualEndDate(e.target.value)} className=" w-full px-3 py-2 pr-10 border rounded-md text-sm bg-background text-foreground appearance-none " /> <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" /> </div> </div>

                </div>

                <button
                  onClick={submitDirectCertificate}
                  disabled={submittingDC}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-md"
                >
                  {submittingDC ? "Resubmitting..." : "Resubmit"}
                </button>

              </div>
            )}

            {/* ================= APPROVED ================= */}
            {dcStatus?.status === "approved" && (
              <div className="space-y-4">

                <div className="bg-success/10 p-3 rounded text-success text-sm">
                  🎉 Congratulations! Your project is approved.
                  You can now proceed to payment.
                </div>

                {/* PRICE BREAKDOWN */}
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Original Price</span>
                    <span>₹{directCertificatePricing.originalAmount.toFixed(2)}</span>
                  </div>

                  {directCertificatePricing.discountAmount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount</span>
                      <span>-₹{directCertificatePricing.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Taxable Amount</span>
                    <span>₹{directCertificatePricing.baseAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>GST (18%)</span>
                    <span>₹{directCertificatePricing.gstAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Net Payable</span>
                    <span>₹{directCertificatePricing.finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* ================= COUPON SECTION ================= */}
                <div className="flex gap-2 pr-4">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Coupon code"
                    className="flex-1 px-3 py-2 border rounded-md text-sm bg-background text-foreground"
                  />

                  <button
                    onClick={() => applyCoupon("direct_certificate")}
                    disabled={applyingCoupon || !coupon}
                    className="px-4 py-2 border rounded-md text-sm"
                  >
                    {applyingCoupon ? "Applying..." : "Apply"}
                  </button>
                </div>

              </div>


            )}

          </CardContent>
          {/* ================= PAYMENT SECTION ================= */}

          <div className="space-y-3 border-t pt-4 mt-4">

            <div className="flex justify-end pr-4">
              <button
                onClick={async () => {
                  if (!accessToken) {
                    hardLogout();
                    return;
                  }

                  // 🔒 Block if not approved
                  if (dcStatus?.status !== "approved") {
                    toast.error("Payment will be enabled after project approval");
                    return;
                  }

                  try {
                    if (!manualStartDate || !manualEndDate) {
                      toast.error("Please select internship start and end date");
                      return;
                    }

                    setPaying(true);

                    await startPayment(
                      "direct_certificate",
                      accessToken,
                      coupon || undefined,
                      {
                        manual_start_date: manualStartDate,
                        manual_end_date: manualEndDate,
                      }
                    );

                    toast.success("Certificate unlocked 🎓");
                    window.location.reload();

                  } catch (err: any) {
                    toast.error(err.message || "Payment failed");
                  } finally {
                    setPaying(false);
                  }
                }}
                disabled={
                  paying ||
                  applyingCoupon ||
                  !directCertificatePricing ||
                  dcStatus?.status !== "approved"
                }
                className={`
        px-5 py-2 rounded-md font-medium flex items-center gap-2
        ${dcStatus?.status !== "approved"
                    ? "bg-primary/40 text-primary-foreground cursor-not-allowed"
                    : paying
                      ? "bg-primary/60 cursor-not-allowed"
                      : "bg-primary text-primary-foreground"
                  }
      `}
              >
                {paying && (
                  <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                )}

                {dcStatus?.status !== "approved"
                  ? `Pay ₹${directCertificatePricing?.finalAmount?.toFixed(2) || "2000"}`
                  : paying
                    ? "Opening payment..."
                    : `Pay ₹${directCertificatePricing.finalAmount.toFixed(2)}`
                }
              </button>

            </div>
            {/* VERIFY PAYMENT LINK BELOW */}
            {!user.certificate_paid && (
              <div className="flex justify-end pr-4 mt-2">
                <button
                  onClick={() => recoverPayment("direct_certificate")}
                  className="text-xs underline text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Already paid? Verify payment
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ⏳ WAITING FOR ADMIN REVIEW */}
      {Boolean(user.training_paid) && week8Submitted && (
        <Card className="border-info/30 bg-info/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-info">
              <Clock className="w-5 h-5" />
              Final Project Under Review
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your final (Week 8) project has been submitted successfully.
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

      {/* 🎓 CERTIFICATE PAYMENT */}
      {Boolean(user.training_paid) &&
        Boolean(week8Reviewed) &&
        !Boolean(user.certificate_paid) &&
        certificatePricing && (
          <Card className="border-success/30 bg-success/5">
            <CardHeader>
              <CardTitle className="text-success">
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
                  <span>₹{certificatePricing.originalAmount.toFixed(2)}</span>
                </div>

                {certificatePricing.discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-₹{certificatePricing.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Taxable Amount</span>
                  <span>₹{certificatePricing.baseAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>₹{certificatePricing.gstAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Net Payable (Inc. of taxes)</span>
                  <span>₹{certificatePricing.finalAmount.toFixed(2)}</span>
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
                  onClick={() => applyCoupon("certificate")}
                  disabled={applyingCoupon}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  {applyingCoupon ? "Applying..." : "Apply"}
                </button>
              </div>

              {/* PAY BUTTON */}
              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    if (!accessToken) {
                      hardLogout();
                      return;
                    }

                    try {
                      setPaying(true);
                      await startPayment("certificate", accessToken, coupon || undefined);

                      toast.success("Certificate unlocked 🎓");

                      await refreshUser();
                      await fetchDashboard();

                    } catch (err: any) {
                      if (err.message === "SESSION_EXPIRED") return;
                      if (err.message === "PAYMENT_CANCELLED") {
                        toast.info("Payment cancelled");
                        return;
                      }
                      toast.error(err.message || "Payment failed");
                    } finally {
                      setPaying(false);
                    }
                  }}
                  disabled={paying || applyingCoupon || !certificatePricing}
                  className={`
              px-5 py-2 rounded-md font-medium flex items-center gap-2
              ${paying
                      ? "bg-success/60 cursor-not-allowed"
                      : "bg-success text-success-foreground"
                    }
            `}
                >
                  {paying && (
                    <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                  )}

                  {paying
                    ? "Opening payment..."
                    : `Pay ₹${certificatePricing.finalAmount.toFixed(2)}`}
                </button>
              </div>

              {/* VERIFY PAYMENT BELOW */}
              {!user.certificate_paid && (
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => recoverPayment("certificate")}
                    className="text-xs underline text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Already paid? Verify payment
                  </button>
                </div>
              )}

              {/* FOOTER NOTE */}
              <p className="text-xs text-muted-foreground">
                * Invoice will be available after payment.
              </p>

            </CardContent>
          </Card>
        )}


      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {Number.isFinite(stat.value)
                      ? stat.value % 1 !== 0
                        ? stat.value.toFixed(1)
                        : stat.value
                      : 0}

                    {stat.total !== undefined && stat.total > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {" / "}{stat.total}
                      </span>
                    )}

                    {stat.suffix && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Task */}
      {currentTask && (currentTask.status === "open" ||
        currentTask.status === "rejected") && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Current Task
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskCard task={mapTaskForCard(currentTask)} />
            </CardContent>
          </Card>
        )}

      {/* All Tasks */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          All Tasks
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task: any) => (
            <TaskCard key={task.student_task_id} task={mapTaskForCard(task)} />
          ))}
        </div>
      </div>

    </div>


  );
}


