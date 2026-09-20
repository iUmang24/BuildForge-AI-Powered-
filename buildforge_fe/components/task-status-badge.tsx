import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/data/tasks";
import type { LucideIcon } from "lucide-react";
import {
  Lock,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; className: string; icon: LucideIcon }
> = {
  locked: {
    label: "Locked",
    className: "bg-muted text-muted-foreground",
    icon: Lock,
  },
  open: {
    label: "Open",
    className: "bg-info/10 text-info",
    icon: Clock,
  },
  submitted: {
    label: "Submitted",
    className: "bg-warning/10 text-warning",
    icon: Send,
  },
  reviewed: {
    label: "Reviewed",
    className: "bg-success/10 text-success",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive",
    icon: XCircle,
  },
};

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const config =
    statusConfig[status as keyof typeof statusConfig] ?? {
      label: status,
      className: "bg-muted text-muted-foreground",
      icon: HelpCircle,
    };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}