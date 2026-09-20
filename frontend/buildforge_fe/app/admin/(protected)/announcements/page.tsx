"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Search, Calendar } from "lucide-react";

export default function AnnouncementsPage() {
  const { accessToken } = useAdminAuth();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [form, setForm] = useState({
    title: "",
    message: "",
    expires_at: "",
    is_active: 1,
  });

  /* ================= FETCH ================= */

  const fetchAnnouncements = async () => {
    if (!accessToken) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/announcements`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const json = await res.json();
      let rows = json.data || [];

      if (search) {
        rows = rows.filter((a: any) =>
          a.title.toLowerCase().includes(search.toLowerCase())
        );
      }

      const start = (page - 1) * limit;
      const end = start + limit;

      setAnnouncements(rows.slice(start, end));
    } catch (err) {
      toast.error("Failed to load announcements");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [accessToken, page]);

  /* ================= VALIDATION ================= */

  const validateForm = () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return false;
    }

    if (!form.message.trim()) {
      toast.error("Message is required");
      return false;
    }

    return true;
  };

  /* ================= CREATE / UPDATE ================= */

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (editing) {
        await fetch(`${API_BASE_URL}/admin/announcements/${editing.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        toast.success("Announcement updated successfully");
      } else {
        await fetch(`${API_BASE_URL}/admin/announcements`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        toast.success("Announcement created");
      }

      setShowModal(false);
      setEditing(null);

      setForm({
        title: "",
        message: "",
        expires_at: "",
        is_active: 1,
      });

      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to save announcement");
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id: number) => {
    if (!confirm("Delete announcement?")) return;

    try {
      await fetch(`${API_BASE_URL}/admin/announcements/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      toast.success("Announcement deleted");

      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to delete announcement");
    }
  };

  /* ================= BADGE ================= */

  const StatusBadge = ({ active }: { active: number }) =>
    active ? (
      <span className="px-2 py-1 text-xs bg-green-500/10 text-green-600 rounded-full">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs bg-red-500/10 text-red-600 rounded-full">
        Disabled
      </span>
    );

  /* ================= UI ================= */

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Announcements
          </h1>
          <p className="text-muted-foreground">
            Manage platform announcements
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setForm({
              title: "",
              message: "",
              expires_at: "",
              is_active: 1,
            });
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* SEARCH */}

      <div className="flex gap-3 items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

          <input
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full border rounded-md p-2 bg-background"
          />
        </div>

        <Button variant="outline" onClick={fetchAnnouncements}>
          Search
        </Button>
      </div>

      {/* TABLE */}

      <Card>
        <CardContent className="p-0">

          {loading ? (
            <div className="p-6 text-center text-muted-foreground">
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No announcements found
            </div>
          ) : (
            <table className="w-full text-sm">

              <thead className="bg-muted">
                <tr>
                  <th className="p-4 text-left">Title</th>
                  <th className="p-4 text-left">Message</th>
                  <th className="p-4 text-center">Expires</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {announcements.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-muted/40">

                    <td className="p-4 font-medium">{a.title}</td>

                    <td className="p-4 text-muted-foreground">
                      {a.message.substring(0, 60)}...
                    </td>

                    <td className="p-4 text-center">
                      {a.expires_at
                        ? new Date(a.expires_at).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="p-4 text-center">
                      <StatusBadge active={a.is_active} />
                    </td>

                    <td className="p-4 text-center space-x-3">

                      <button
                        className="text-primary"
                        onClick={() => {
                          setEditing(a);
                          setForm({
                            title: a.title,
                            message: a.message,
                            expires_at: a.expires_at || "",
                            is_active: a.is_active,
                          });
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="text-red-500"
                        onClick={() => handleDelete(a.id)}
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          )}

        </CardContent>
      </Card>

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
          disabled={announcements.length < limit}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>

      </div>

      {/* MODAL */}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-card border rounded-lg w-[550px] p-6 space-y-4">

            <h2 className="text-lg font-bold">
              {editing ? "Edit Announcement" : "Create Announcement"}
            </h2>

            {/* TITLE */}

            <input
              placeholder="Title"
              className="w-full border rounded-md p-2 bg-background"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            {/* MESSAGE */}

            <textarea
              placeholder="Message"
              rows={4}
              className="w-full border rounded-md p-2 bg-background"
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
            />

            {/* EXPIRY DATE */}

            <div className="flex flex-col gap-1">

              <label className="text-xs text-muted-foreground">
                Expiry Date
              </label>

              <div className="relative">

                <input
                  type="date"
                  value={form.expires_at || ""}
                  onChange={(e) =>
                    setForm({ ...form, expires_at: e.target.value })
                  }
                  className="w-full px-3 py-2 pr-10 border rounded-md text-sm bg-background text-foreground appearance-none"
                />

                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

              </div>

            </div>

            {/* ACTIVE */}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active === 1}
                onChange={(e) =>
                  setForm({
                    ...form,
                    is_active: e.target.checked ? 1 : 0,
                  })
                }
              />
              <span>Active</span>
            </div>

            {/* ACTIONS */}

            <div className="flex justify-end gap-3">

              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>

              <Button onClick={handleSave}>
                Save
              </Button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}