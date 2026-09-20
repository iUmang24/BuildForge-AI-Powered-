"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock } from "lucide-react";
import { useRequireAuth } from "@/lib/useRequireAuth";

const Field = ({ label, value }: { label: string; value?: string }) => (
    <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">
            {value && value.trim() ? value : "Not set"}
        </p>
    </div>
);

export default function ProfilePage() {
    const { canRender } = useRequireAuth();
    const { user } = useAuth();

    // 🔒 AUTH GUARD (same as dashboard/tasks)
    if (!canRender) return null;

    if (!user) return null;
    const initials =
        user.full_name
            ?.trim()
            .split(/\s+/)
            .map((n: string) => n[0])
            .join("")
            .toUpperCase() || "U";

    return (
        <DashboardLayout title="Profile">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* LEFT COLUMN */}
                <div className="space-y-6">

                    {/* USER CARD */}
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <Avatar className="w-24 h-24 mx-auto mb-4">
                                <AvatarFallback className="text-3xl bg-muted">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <h2 className="text-lg font-semibold">
                                {user.full_name}
                            </h2>

                            <p className="text-sm text-muted-foreground">
                                {user.email}
                            </p>

                            <div className="mt-6 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Joined</span>
                                    <span>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <span
                                        className={
                                            user.is_active ? "text-success" : "text-destructive"
                                        }
                                    >
                                        {user.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN */}
                <div className="md:col-span-2 space-y-6">

                    {/* PERSONAL INFO */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>

                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Field label="Full Name" value={user.full_name} />
                            <Field label="Email" value={user.email} />
                            <Field label="Phone" value={user.phone} />
                            <Field label="WhatsApp" value={user.phone} />
                            {/* <Field label="Gender" value={user.gender} /> */}
                            <Field label="State" value={user.state} />
                            <Field label="College" value={user.college_name} />
                            <Field label="Program" value={user.project_title} />
                            <Field label="Github Username" value={user.year_of_study} />
                            <Field label="Source" value={user.source} />
                        </CardContent>
                    </Card>

                    {/* INTERNSHIP PROGRESS */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Internship Progress</CardTitle>
                        </CardHeader>

                        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <Field
                                label="Current Week"
                                value={String(user.current_week)}
                            />
                            <Field
                                label="Total Weeks"
                                value={String(user.total_weeks)}
                            />
                            <Field
                                label="Project Status"
                                value={user.project_status}
                            />
                        </CardContent>
                    </Card>

                    {/* ACTIVITY
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-md bg-muted">
                <Clock className="w-4 h-4 mt-1 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    Profile loaded successfully
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Just now
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md bg-muted">
                <Calendar className="w-4 h-4 mt-1 text-success" />
                <div>
                  <p className="text-sm font-medium">
                    Internship in progress
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Week {user.current_week} of {user.total_weeks}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card> */}

                </div>
            </div>
        </DashboardLayout>
    );
}
