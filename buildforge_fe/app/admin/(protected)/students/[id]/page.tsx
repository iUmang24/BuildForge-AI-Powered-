"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function StudentProfilePage() {
  const { id } = useParams();
  const { accessToken } = useAdminAuth();

  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!accessToken) return;

    fetch(`${API_BASE_URL}/admin/students/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((json) => setData(json.data));
  }, [accessToken, id]);

  if (!data) return null;

  const {
    student,
    project,
    tasks,
    tickets,
    certificates,
    payments,
    directRequests,
  } = data;

  const tabs = [
    "overview",
    "project",
    "tasks",
    "tickets",
    "certificates",
    "payments",
    "direct",
  ];

  return (
    <div className="space-y-8">

      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </Link>

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {student.full_name}
        </h1>
        <p className="text-muted-foreground">
          {student.email}
        </p>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-md text-sm capitalize ${
              tab === t
                ? "bg-primary text-white"
                : "bg-muted hover:bg-muted/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ================= OVERVIEW ================= */}
      {tab === "overview" && (
        <Card>
          <CardContent className="p-6 space-y-2">
            <div><strong>Name:</strong> {student.full_name}</div>
            <div><strong>Email:</strong> {student.email}</div>
            <div><strong>Phone:</strong> {student.phone || "-"}</div>
            <div><strong>State:</strong> {student.state}</div>
            <div><strong>College:</strong> {student.college_name || "-"}</div>
            <div>
              <strong>Training Paid:</strong>{" "}
              {student.training_paid ? "Yes" : "No"}
            </div>
            <div>
              <strong>Certificate Paid:</strong>{" "}
              {student.certificate_paid ? "Yes" : "No"}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= PROJECT ================= */}
      {tab === "project" && (
        <Card>
          <CardContent className="p-6 space-y-2">
            <div><strong>Program:</strong> {project?.title || "-"}</div>
            <div><strong>Status:</strong> {project?.status}</div>
            <div><strong>Start:</strong> {project?.start_date}</div>
            <div><strong>Expected End:</strong> {project?.expected_end_date}</div>
          </CardContent>
        </Card>
      )}

      {/* ================= TASKS ================= */}
      {tab === "tasks" && (
        <Card>
          <CardContent className="p-6">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Week</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t: any) => (
                  <tr key={t.week_number}>
                    <td>{t.week_number}</td>
                    <td>{t.status}</td>
                    <td>{t.score || "-"}</td>
                    <td>
                      {t.submitted_at
                        ? new Date(t.submitted_at).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ================= SUPPORT ================= */}
      {tab === "tickets" && (
        <Card>
          <CardContent className="p-6">
            {tickets.length === 0 && <div>No tickets</div>}

            {tickets.map((t: any) => (
              <div key={t.id} className="border-b py-2">
                <div className="font-medium">{t.subject}</div>
                <div className="text-sm text-muted-foreground">
                  {t.status} —{" "}
                  {new Date(t.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ================= CERTIFICATES ================= */}
      {tab === "certificates" && (
        <Card>
          <CardContent className="p-6">
            {certificates.length === 0 && <div>No certificates</div>}

            {certificates.map((c: any) => (
              <div key={c.id} className="border-b py-2">
                {c.program} — {c.issue_date}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ================= PAYMENTS ================= */}
      {tab === "payments" && (
        <Card>
          <CardContent className="p-6">
            {payments.map((p: any) => (
              <div key={p.id} className="border-b py-2">
                {p.type} — ₹{p.amount} — {p.status}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ================= DIRECT CERTIFICATE ================= */}
      {tab === "direct" && (
        <Card>
          <CardContent className="p-6">
            {directRequests.length === 0 && <div>No requests</div>}

            {directRequests.map((d: any) => (
              <div key={d.id} className="border-b py-2">
                {d.project_name} — {d.status}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}