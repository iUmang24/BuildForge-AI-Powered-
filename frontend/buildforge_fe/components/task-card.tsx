"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/task-status-badge";
import type { Task } from "@/lib/data/tasks";
import { Calendar, ArrowRight } from "lucide-react";

export interface DashboardTask {
  id: number;
  week: number;
  status: "open" | "submitted" | "reviewed" | "rejected" | "locked";
  title: string;
  description: string;
  deadline: string;
  score?: number;
}

interface TaskCardProps {
  task: DashboardTask;
}



export function TaskCard({ task }: TaskCardProps) {
  const isAccessible = task.status !== "locked";

  const canView = task.status !== "locked";
  const canSubmit =
    task.status === "open" || task.status === "rejected";

  return (
    <Card
      className={`bg-card border-border transition-all ${isAccessible ? "hover:border-primary/50" : "opacity-60"
        }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Week {task.week}
            </span>
            <TaskStatusBadge status={task.status} />
          </div>
          {task.score !== undefined && (
            <div className="text-sm font-medium text-primary">{task.score}/10</div>
          )}
        </div>

        <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{task.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{task.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
          </div>

          {canView && (
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href={`/task/${task.id}`}>
                {canSubmit ? "Open Task" : "View Task"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
