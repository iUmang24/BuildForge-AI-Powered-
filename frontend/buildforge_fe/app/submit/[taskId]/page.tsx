"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hardLogout } from "@/lib/hardLogout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/useRequireAuth";

interface SubmitPageProps {
  params: Promise<{ taskId: string }>;
}

export default function SubmitPage({ params }: SubmitPageProps) {
  const { taskId } = use(params);
  const router = useRouter();
  const { accessToken, refreshUser } = useAuth();

  const [task, setTask] = useState<any>(null);
  const [loadingTask, setLoadingTask] = useState(true);

  const [formData, setFormData] = useState({
    frontendRepo: "",
    backendRepo: "",
    frontendLive: "",
    backendLive: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const { canRender } = useRequireAuth();

  if (!canRender) return null;

  /* ================= FETCH TASK ================= */

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/students/tasks/${taskId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        // 🔥 TOKEN EXPIRED
        if (res.status === 401 || res.status === 403) {
          await refreshUser();
          return false;
        }

        const json = await res.json();
        if (!json.success) {
          hardLogout();
          router.replace("/login");
          return;
        }
        setTask(json.data);
      } catch {
        notFound();
      } finally {
        setLoadingTask(false);
      }
    };
    fetchTask();
  }, [taskId, accessToken]);

  useEffect(() => {
    if (!task) return;

    setFormData({
      frontendRepo: task.frontend_repo || "",
      backendRepo: task.backend_repo || "",
      frontendLive: task.frontend_live_url || "",
      backendLive: task.backend_live_url || "",
      notes: task.submission_notes || "",
    });
  }, [task]);

  if (loadingTask) {
    return (
      <DashboardLayout title="Loading">
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    hardLogout();
    return false;
  }
  if (task.status === "locked") {
    router.push("/dashboard");
    return null;
  }

  const canSubmit =
    task.status === "open" || task.status === "rejected";

  /* ================= VALIDATION ================= */

  const validateForm = () => {
    const e: Record<string, string> = {};

    // BOTH repos are required
    if (!formData.frontendRepo) {
      e.frontendRepo = "Frontend GitHub repository is required.";
    }

    if (!formData.backendRepo) {
      e.backendRepo = "Backend GitHub repository is required.";
    }

    if (formData.frontendRepo && !formData.frontendRepo.includes("github.com")) {
      e.frontendRepo = "Invalid GitHub URL";
    }

    if (formData.backendRepo && !formData.backendRepo.includes("github.com")) {
      e.backendRepo = "Invalid GitHub URL";
    }

    /* 🔴 WEEK 8 ONLY: LIVE URL VALIDATION */
    if (task?.week === 8) {
      if (!formData.frontendLive) {
        e.frontendLive = "Frontend live URL is required for final submission.";
      }

      if (!formData.backendLive) {
        e.backendLive = "Backend live URL is required for final submission.";
      }

      if (
        formData.frontendLive &&
        !formData.frontendLive.startsWith("http")
      ) {
        e.frontendLive = "Invalid frontend live URL";
      }

      if (
        formData.backendLive &&
        !formData.backendLive.startsWith("http")
      ) {
        e.backendLive = "Invalid backend live URL";
      }
    }

    // Notes length
    if (formData.notes && formData.notes.length > 1000) {
      e.notes = "Notes must be under 1000 characters.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch(
        `${API_BASE_URL}/students/tasks/${taskId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            frontend_repo: formData.frontendRepo || null,
            backend_repo: formData.backendRepo || null,
            frontend_live_url: formData.frontendLive || null,
            backend_live_url: formData.backendLive || null,
            submission_notes: formData.notes || null,
          }),
        }
      );

      // 🔥 TOKEN EXPIRED
      if (res.status === 401 || res.status === 403) {
        await refreshUser();
        return false;
      }

      const json = await res.json();
      if (json.success) {
        setSuccessMessage(json.message || "Submission successful.");
        setIsSubmitted(true);
      }
      else setErrors({ submit: json.message });
    } catch {
      setErrors({ submit: "Submission failed" });
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= SUCCESS ================= */

  if (isSubmitted) {
    return (
      <DashboardLayout title="Submission Complete">
        <div className="max-w-lg mx-auto text-center py-12">
          <CheckCircle className="w-12 h-12 mx-auto text-success mb-4" />
          <h2 className="text-xl font-bold mb-2">Submission Successful</h2>
          <p className="text-muted-foreground mb-6">
            {successMessage}
          </p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  /* ================= UI ================= */

  return (
    <DashboardLayout title="Submit Work">
      <div className="max-w-2xl mx-auto">
        <Link href={`/task/${taskId}`} className="inline-flex gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Task
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Submit Your Work</CardTitle>
            <CardDescription>
              Week {task.week}: {task.title}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* 🔴 Rejection Message */}
            {task.status === "rejected" && task.feedback && (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-4">
                <p className="text-sm font-semibold text-destructive mb-2">
                  Submission Rejected
                </p>

                <ul className="list-disc pl-5 space-y-1 text-sm text-destructive">
                  {task.feedback
                    .replace("Verification failed:", "")
                    .split(",")
                    .map((issue: string, idx: number) => (
                      <li key={idx}>{issue.trim()}</li>
                    ))}
                </ul>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <Label>Frontend GitHub Repository</Label>
                <Input
                  placeholder="https://github.com/username/frontend"
                  value={formData.frontendRepo}
                  onChange={(e) =>
                    setFormData({ ...formData, frontendRepo: e.target.value })
                  }
                />
                {errors.frontendRepo && (
                  <p className="text-xs text-destructive">{errors.frontendRepo}</p>
                )}
              </div>

              <div>
                <Label>Backend GitHub Repository</Label>
                <Input
                  placeholder="https://github.com/username/backend"
                  value={formData.backendRepo}
                  onChange={(e) =>
                    setFormData({ ...formData, backendRepo: e.target.value })
                  }
                />
                {errors.backendRepo && (
                  <p className="text-xs text-destructive">{errors.backendRepo}</p>
                )}
              </div>

              {errors.repo && (
                <p className="text-sm text-destructive">{errors.repo}</p>
              )}

              <div>
                <Label>Frontend Live URL (optional)</Label>
                <Input
                  placeholder="https://project.vercel.app"
                  value={formData.frontendLive}
                  onChange={(e) =>
                    setFormData({ ...formData, frontendLive: e.target.value })
                  }
                />
              </div>
              {errors.frontendLive && (
                <p className="text-xs text-destructive">{errors.frontendLive}</p>
              )}

              <div>
                <Label>Backend Live URL (optional)</Label>
                <Input
                  placeholder="https://api.example.com"
                  value={formData.backendLive}
                  onChange={(e) =>
                    setFormData({ ...formData, backendLive: e.target.value })
                  }
                />
              </div>

              {errors.backendLive && (
                <p className="text-xs text-destructive">{errors.backendLive}</p>
              )}

              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              {errors.submit && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4">
                  <p className="text-sm font-semibold text-destructive mb-2">
                    Submission Error
                  </p>

                  <ul className="list-disc pl-5 space-y-1 text-sm text-destructive">
                    {errors.submit
                      .replace("Verification failed:", "")
                      .split(",")
                      .map((msg, idx) => (
                        <li key={idx}>{msg.trim()}</li>
                      ))}
                  </ul>
                </div>
              )}

              {canSubmit ? (
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Work"}
                </Button>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-2">
                  {task.status === "submitted" && "Submission already sent. Awaiting review."}
                  {task.status === "reviewed" && "Task already reviewed."}
                </div>
              )}

            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
