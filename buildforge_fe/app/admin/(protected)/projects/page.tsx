"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";

export default function ProjectsPage() {

  const { accessToken } = useAdminAuth();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;

  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);

  const [editing, setEditing] = useState<any>(null);

  const emptyProject = {
    title: "",
    description: "",
    duration_weeks: 8,
    difficulty_level: "beginner",
    is_active: 1
  };

  const [form, setForm] = useState<any>(emptyProject);

  /* ================= FETCH ================= */

  const fetchProjects = async () => {

    if (!accessToken) return;

    setLoading(true);

    try {

      const res = await fetch(
        `${API_BASE_URL}/admin/projects?search=${search}&page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      const json = await res.json();

      setProjects(json.data?.rows || []);

    } catch {
      toast.error("Failed to load projects");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [accessToken, page]);

  /* ================= VALIDATION ================= */

  const validateForm = () => {

    if (!form.title.trim()) {
      toast.error("Project title required");
      return false;
    }

    if (!form.duration_weeks) {
      toast.error("Duration required");
      return false;
    }

    return true;
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {

    if (!validateForm()) return;

    try {

      if (editing) {

        await fetch(`${API_BASE_URL}/admin/projects/${editing.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form)
        });

        toast.success("Project updated");

      } else {

        await fetch(`${API_BASE_URL}/admin/projects`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form)
        });

        toast.success("Project created");
      }

      setShowModal(false);
      setEditing(null);
      setForm(emptyProject);

      fetchProjects();

    } catch {
      toast.error("Save failed");
    }

  };

  /* ================= DELETE ================= */

  const handleDelete = async (id: number) => {

    if (!confirm("Delete this project?")) return;

    try {

      await fetch(`${API_BASE_URL}/admin/projects/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      toast.success("Project deleted");

      fetchProjects();

    } catch {

      toast.error("Delete failed");

    }

  };

  /* ================= UI ================= */

  return (

    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold">
            Projects
          </h1>

          <p className="text-muted-foreground">
            Manage internship projects
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setForm(emptyProject);
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>

      </div>

      {/* SEARCH */}

      <div className="flex gap-3 items-center">

        <div className="relative w-72">

          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

          <input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full border rounded-md p-2 bg-background"
          />

        </div>

        <Button
          variant="outline"
          onClick={() => {
            setPage(1);
            fetchProjects();
          }}
        >
          Search
        </Button>

      </div>

      {/* TABLE */}

      <Card>

        <CardContent className="p-0">

          {loading ? (

            <div className="p-6 text-center text-muted-foreground">
              Loading projects...
            </div>

          ) : projects.length === 0 ? (

            <div className="p-6 text-center text-muted-foreground">
              No projects found
            </div>

          ) : (

            <table className="w-full text-sm">

              <thead className="bg-muted">

                <tr>
                  <th className="p-4 text-left">Title</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Difficulty</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>

              </thead>

              <tbody>

                {projects.map((p) => (

                  <tr key={p.id} className="border-t hover:bg-muted/40">

                    <td className="p-4 font-medium">
                      {p.title}
                    </td>

                    <td className="p-4">
                      {p.duration_weeks} weeks
                    </td>

                    <td className="p-4">
                      {p.difficulty_level}
                    </td>

                    <td className="p-4">
                      {p.is_active ? "Active" : "Disabled"}
                    </td>

                    <td className="p-4 text-center space-x-4">

                      <button
                        className="text-muted-foreground"
                        onClick={() => {
                          setEditing(p);
                          setViewModal(true);
                        }}
                      >
                        View
                      </button>

                      <button
                        className="text-primary"
                        onClick={() => {
                          setEditing(p);
                          setForm(p);
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="text-red-500"
                        onClick={() => handleDelete(p.id)}
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
          disabled={projects.length < limit}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>

      </div>

      {/* CREATE / EDIT MODAL */}

      {showModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-card border rounded-lg w-[600px] p-6 space-y-4">

            <h2 className="text-lg font-bold">
              {editing ? "Edit Project" : "Create Project"}
            </h2>

            <input
              placeholder="Project Title"
              className="w-full border p-2 rounded"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <textarea
              placeholder="Description"
              rows={4}
              className="w-full border p-2 rounded"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <input
              type="number"
              placeholder="Duration Weeks"
              className="w-full border p-2 rounded"
              value={form.duration_weeks}
              onChange={(e) => setForm({ ...form, duration_weeks: e.target.value })}
            />

            <select
              className="w-full border p-2 rounded"
              value={form.difficulty_level}
              onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <div className="flex items-center gap-2">

              <input
                type="checkbox"
                checked={form.is_active === 1}
                onChange={(e) =>
                  setForm({
                    ...form,
                    is_active: e.target.checked ? 1 : 0
                  })
                }
              />

              <span>Active</span>

            </div>

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

      {/* VIEW MODAL */}

      {viewModal && editing && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-card border rounded-lg w-[600px] p-6 space-y-4">

            <h2 className="text-xl font-bold">
              {editing.title}
            </h2>

            <div className="space-y-3 text-sm">

              <div>
                <label className="text-muted-foreground">Duration</label>
                <div>{editing.duration_weeks} weeks</div>
              </div>

              <div>
                <label className="text-muted-foreground">Difficulty</label>
                <div>{editing.difficulty_level}</div>
              </div>

              <div>
                <label className="text-muted-foreground">Status</label>
                <div>{editing.is_active ? "Active" : "Disabled"}</div>
              </div>

              <div>
                <label className="text-muted-foreground">Description</label>

                <div className="border p-3 rounded mt-1">
                  {editing.description}
                </div>
              </div>

            </div>

            <div className="flex justify-end">

              <Button
                onClick={() => setViewModal(false)}
              >
                Close
              </Button>

            </div>

          </div>

        </div>

      )}

    </div>

  );
}