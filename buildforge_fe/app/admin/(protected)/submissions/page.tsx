"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { adminhardLogout } from "@/lib/adminhardLogout";

export default function AdminSubmissionsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("submitted");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [feedbackError, setFeedbackError] = useState("");

  const { accessToken } = useAdminAuth();

  /* ================= FETCH ================= */

  const fetchData = async () => {
    if (!accessToken) return;

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/submissions?status=${statusFilter}&search=${search}&page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        }
      );

      if (res.status === 401 || res.status === 403) {
        adminhardLogout();
        return;
      }

      const json = await res.json();
      setData(json.data?.rows || []);
    } catch (err) {
      console.error("Failed to fetch submissions", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [statusFilter, page, accessToken]);

  /* ================= STATUS BADGE ================= */

  const StatusBadge = ({ status }: { status: string }) => {
    const base =
      "px-2 py-1 text-xs font-medium rounded-full";

    if (status === "submitted")
      return (
        <span className={`${base} bg-yellow-500/10 text-yellow-600`}>
          Pending
        </span>
      );

    if (status === "reviewed")
      return (
        <span className={`${base} bg-green-500/10 text-green-600`}>
          Approved
        </span>
      );

    if (status === "rejected")
      return (
        <span className={`${base} bg-red-500/10 text-red-600`}>
          Rejected
        </span>
      );

    return <span className={base}>{status}</span>;
  };

  /* ================= RENDER ================= */

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Final Week Submissions
      </h1>

      {/* SEARCH + FILTER */}
      <div className="flex flex-wrap gap-4 items-center">
        <input
          placeholder="Search by name or email..."
          className="border bg-background text-foreground px-3 py-2 rounded-md w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button onClick={() => fetchData()}>
          Search
        </Button>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border bg-background text-foreground px-3 py-2 rounded-md"
        >
          <option value="submitted">Pending</option>
          <option value="reviewed">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="text-muted-foreground">
          Loading submissions...
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left w-[25%]">Student</th>
                <th className="p-3 text-center w-[20%]">Program</th>
                <th className="p-3 text-center w-[10%]">Paid</th>
                <th className="p-3 text-center w-[15%]">Enrolled</th>
                <th className="p-3 text-center w-[15%]">Status</th>
                <th className="p-3 text-center w-[15%]">Action</th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No submissions found
                  </td>
                </tr>
              )}

              {data.map((r) => (
                <tr
                  key={r.student_task_id}
                  className="border-t hover:bg-muted/40 transition"
                >
                  <td className="p-3 text-left">
                    {r.full_name}
                  </td>

                  <td className="p-3 text-center">
                    {r.program_name}
                  </td>

                  <td className="p-3 text-center">
                    {r.training_paid ? "✅" : "❌"}
                  </td>

                  <td className="p-3 text-center">
                    {new Date(r.enrolled_on).toLocaleDateString()}
                  </td>

                  <td className="p-3 text-center">
                    <StatusBadge status={r.status} />
                  </td>

                  <td className="p-3 text-center">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelected(r);
                        if (r.status === "submitted") {
                          setFeedback("");
                        } else {
                          setFeedback(r.reviewer_feedback || "");
                        }

                        setFeedbackError("");
                      }}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
          disabled={data.length < 10}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg w-[800px] max-h-[90vh] overflow-y-auto p-6 space-y-5">

            <h2 className="text-xl font-bold">
              Review Submission
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Name:</strong> {selected.full_name}</div>
              <div><strong>Email:</strong> {selected.email}</div>
              <div><strong>Phone:</strong> {selected.phone}</div>
              <div><strong>Program:</strong> {selected.program_name}</div>
              <div><strong>College:</strong> {selected.college_name}</div>
              <div><strong>State:</strong> {selected.state}</div>
            </div>

            <div className="space-y-2">
              <strong>Repositories</strong>
              {selected.frontend_repo && (
                <a
                  href={selected.frontend_repo}
                  target="_blank"
                  className="block text-primary underline"
                >
                  Frontend Repo
                </a>
              )}
              {selected.backend_repo && (
                <a
                  href={selected.backend_repo}
                  target="_blank"
                  className="block text-primary underline"
                >
                  Backend Repo
                </a>
              )}
            </div>

            <div className="space-y-2">
              <strong>Live URLs</strong>
              {selected.frontend_live_url && (
                <a
                  href={selected.frontend_live_url}
                  target="_blank"
                  className="block text-primary underline"
                >
                  Frontend Live
                </a>
              )}
              {selected.backend_live_url && (
                <a
                  href={selected.backend_live_url}
                  target="_blank"
                  className="block text-primary underline"
                >
                  Backend Live
                </a>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">
                Reviewer Feedback *
              </label>

              <textarea
                disabled={selected.status !== "submitted"}
                className={`mt-1 w-full rounded-md p-2 bg-background text-foreground border ${feedbackError ? "border-red-500" : "border-border"
                  } ${selected.status !== "submitted"
                    ? "bg-muted cursor-not-allowed opacity-80"
                    : ""
                  }`}
                rows={4}
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value);
                  if (feedbackError) setFeedbackError("");
                }}
                placeholder={
                  selected.status === "submitted"
                    ? "Provide clear feedback explaining approval or rejection..."
                    : "Feedback already submitted"
                }
              />

              {feedbackError && (
                <p className="text-xs text-red-500 mt-1">
                  {feedbackError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setSelected(null)}
              >
                Cancel
              </Button>

              <Button
                disabled={actionLoading ||
                  selected.status !== "submitted"}
                onClick={async () => {
                  if (!feedback.trim()) {
                    setFeedbackError("Feedback is required before approval.");
                    return;
                  }

                  setActionLoading(true);

                  await fetch(
                    `${API_BASE_URL}/admin/submissions/${selected.student_task_id}/approve`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ feedback }),
                    }
                  );

                  setSelected(null);
                  setActionLoading(false);
                  fetchData();
                }}
              >
                Approve
              </Button>

              <Button
                variant="destructive"
                disabled={actionLoading ||
                  selected.status !== "submitted"}
                onClick={async () => {
                  if (!feedback.trim()) {
                    setFeedbackError("Feedback is required before rejection.");
                    return;
                  }

                  setActionLoading(true);

                  await fetch(
                    `${API_BASE_URL}/admin/submissions/${selected.student_task_id}/reject`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ feedback }),
                    }
                  );

                  setSelected(null);
                  setActionLoading(false);
                  fetchData();
                }}
              >
                Reject
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
