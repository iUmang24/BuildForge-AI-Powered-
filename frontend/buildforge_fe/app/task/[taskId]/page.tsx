"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TaskStatusBadge } from "@/components/task-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/lib/config";
import { hardLogout } from "@/lib/hardLogout";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  CheckCircle,
  Lock,
} from "lucide-react";

interface TaskPageProps {
  params: Promise<{ taskId: string }>;
}

export default function TaskPage({ params }: TaskPageProps) {
  const { taskId } = use(params);
  const { authReady, accessToken, refreshUser } = useAuth();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);

  interface ResourceItem {
    url: string;
    title: string;
  }

  interface TaskDetail {
    id: number;
    week: number;
    title: string;
    description: string;
    fullDescription: string;
    deadline: string;
    status: string;
    score: number;
    feedback: string;
    resources: ResourceItem[];
    rubric: string[];
  }

  const { canRender } = useRequireAuth();

  // if (!canRender) return null;

  /* ================= FETCH TASK ================= */

  useEffect(() => {
    if (!authReady || !accessToken) return;

    const fetchTask = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/students/tasks/${taskId}`,
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

        if (!res.ok) {
          setTask(null);
          return;
        }

        const json = await res.json();

        if (json.success) {
          setTask(json.data);
        } else {
          setTask(null);
        }
      } catch (err) {
        console.error("Task fetch error", err);
        setTask(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [authReady, accessToken, taskId]);

  if (!canRender || loading) return null;

  if (!task) {
    hardLogout();
    return false;
  }

  const isLocked = task.status === "locked";

  return (
    <DashboardLayout title={`Week ${task.week}`}>
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {isLocked ? (
          <Card className="bg-card border-border text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Task Locked
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Complete the previous tasks to unlock this task.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Week {task.week}
                  </span>
                  <TaskStatusBadge status={task.status} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {task.title}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {task.description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {task.score ?? 0}/10
                </div>
                <div className="text-sm text-muted-foreground">
                  Your Score
                </div>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Deadline:{" "}
                {new Date(task.deadline).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Description */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Task Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="
    prose prose-invert max-w-none
    prose-ul:list-disc prose-ul:pl-6
    prose-ol:list-decimal prose-ol:pl-6
    prose-li:marker:text-muted-foreground
  "
                  dangerouslySetInnerHTML={{ __html: task.fullDescription }}
                />
              </CardContent>
            </Card>

            {/* Resources */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {Array.isArray(task.resources) &&
                    task.resources.map((resource: any, idx: number) => {
                      if (typeof resource === "object" && resource?.url) {
                        return (
                          <li key={resource.url || idx}>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-primary hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              {resource.title}
                            </a>
                          </li>
                        );
                      }

                      return null;
                    })}
                </ul>
              </CardContent>
            </Card>

            {/* Rubric */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Rubric Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {Array.isArray(task.rubric) &&
                    task.rubric.map((item: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-foreground/90">
                          {typeof item === "string" ? item : item?.title}
                        </span>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>

            {/* Feedback */}
            <Card className="bg-muted/40 border-border">
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {task.feedback ? (
                  <div
                    className={`rounded-md border p-4 ${task.status === "rejected"
                      ? "border-destructive/30 bg-destructive/10"
                      : "border-success/30 bg-success/10"
                      }`}
                  >
                    <p
                      className={`text-sm font-semibold mb-2 ${task.status === "rejected"
                        ? "text-destructive"
                        : "text-success"
                        }`}
                    >
                      {/* {task.status === "rejected" ? "Feedback" : "Evaluation Result"} */}
                    </p>

                    <ul
                      className={`list-disc pl-5 space-y-1 text-sm ${task.status === "rejected"
                        ? "text-destructive"
                        : "text-success"
                        }`}
                    >
                      {task.feedback
                        .replace("Verification failed:", "")
                        .split(",")
                        .map((msg: string, idx: number) => (
                          <li key={idx}>{msg.trim()}</li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No feedback yet. Complete and submit the task to receive evaluation.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {(task.status === "open" || task.status === "rejected") && (
              <Button asChild size="lg">
                <Link href={`/submit/${task.id}`}>
                  {task.status === "rejected" ? "Fix & Resubmit" : "Submit Work"}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
