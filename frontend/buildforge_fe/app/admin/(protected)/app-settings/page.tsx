"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function AppSettingsPage() {
  const { accessToken } = useAdminAuth();

  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [form, setForm] = useState({
    setting_key: "",
    setting_value: "",
  });

  /* ================= FETCH ================= */

  const fetchSettings = async () => {
    if (!accessToken) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/app-settings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const json = await res.json();
      let rows = json.data || [];

      if (search) {
        rows = rows.filter((s: any) =>
          s.setting_key.toLowerCase().includes(search.toLowerCase())
        );
      }

      const start = (page - 1) * limit;
      const end = start + limit;

      setSettings(rows.slice(start, end));
    } catch (err) {
      toast.error("Failed to load settings");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, [accessToken, page]);

  /* ================= VALIDATION ================= */

  const validateForm = () => {
    if (!form.setting_key.trim()) {
      toast.error("Setting key is required");
      return false;
    }

    if (!form.setting_value.trim()) {
      toast.error("Setting value is required");
      return false;
    }

    return true;
  };

  /* ================= CREATE / UPDATE ================= */

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (editing) {
        await fetch(`${API_BASE_URL}/admin/app-settings/${editing.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            setting_value: form.setting_value,
          }),
        });

        toast.success("Setting updated");
      } else {
        await fetch(`${API_BASE_URL}/admin/app-settings`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        toast.success("Setting created");
      }

      setShowModal(false);
      setEditing(null);

      setForm({
        setting_key: "",
        setting_value: "",
      });

      fetchSettings();
    } catch (err) {
      toast.error("Failed to save setting");
    }
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            App Settings
          </h1>

          <p className="text-muted-foreground">
            Manage system configuration
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setForm({
              setting_key: "",
              setting_value: "",
            });
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Setting
        </Button>

      </div>

      {/* SEARCH */}

      <div className="flex gap-3 items-center">

        <div className="relative w-72">

          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

          <input
            placeholder="Search setting..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full border rounded-md p-2 bg-background"
          />

        </div>

        <Button variant="outline" onClick={fetchSettings}>
          Search
        </Button>

      </div>

      {/* TABLE */}

      <Card>

        <CardContent className="p-0">

          {loading ? (
            <div className="p-6 text-center text-muted-foreground">
              Loading settings...
            </div>
          ) : settings.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No settings found
            </div>
          ) : (

            <table className="w-full text-sm">

              <thead className="bg-muted">

                <tr>
                  <th className="p-4 text-left">Setting Key</th>
                  <th className="p-4 text-left">Value</th>
                  <th className="p-4 text-center">Action</th>
                </tr>

              </thead>

              <tbody>

                {settings.map((s) => (

                  <tr key={s.id} className="border-t hover:bg-muted/40">

                    <td className="p-4 font-medium">
                      {s.setting_key}
                    </td>

                    <td className="p-4 text-muted-foreground">
                      {s.setting_value}
                    </td>

                    <td className="p-4 text-center">

                      <button
                        className="text-primary"
                        onClick={() => {
                          setEditing(s);
                          setForm({
                            setting_key: s.setting_key,
                            setting_value: s.setting_value,
                          });
                          setShowModal(true);
                        }}
                      >
                        Edit
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
          disabled={settings.length < limit}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>

      </div>

      {/* MODAL */}

      {showModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-card border rounded-lg w-[520px] p-6 space-y-4">

            <h2 className="text-lg font-bold">
              {editing ? "Edit Setting" : "Create Setting"}
            </h2>

            {!editing && (
              <input
                placeholder="Setting Key (example: site_name)"
                className="w-full border rounded-md p-2 bg-background"
                value={form.setting_key}
                onChange={(e) =>
                  setForm({ ...form, setting_key: e.target.value })
                }
              />
            )}

            <textarea
              placeholder="Setting Value"
              rows={3}
              className="w-full border rounded-md p-2 bg-background"
              value={form.setting_value}
              onChange={(e) =>
                setForm({ ...form, setting_value: e.target.value })
              }
            />

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