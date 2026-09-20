"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";

export default function DocumentTemplatesPage() {
  const { accessToken } = useAdminAuth();

  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(8);

  const [showModal, setShowModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    template_key: "",
    html_content: "",
  });

  const fetchTemplates = async () => {
    if (!accessToken) return;

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/document-templates?search=${search}&page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const json = await res.json();
      setTemplates(json.data?.rows || []);
    } catch {
      console.error("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [accessToken, page]);

  const handleCreate = async () => {
    if (!newTemplate.template_key) {
      return alert("Template key required");
    }

    await fetch(`${API_BASE_URL}/admin/document-templates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTemplate),
    });

    setShowModal(false);
    setNewTemplate({ template_key: "", html_content: "" });
    fetchTemplates();
  };

  const StatusBadge = ({ active }: { active: number }) =>
    active ? (
      <span className="px-2 py-1 text-xs bg-green-500/10 text-green-600 rounded-full">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs bg-red-500/10 text-red-600 rounded-full">
        Inactive
      </span>
    );

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Document Templates
          </h1>
          <p className="text-muted-foreground">
            Manage HTML document structures
          </p>
        </div>

        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* SEARCH */}
      <div className="flex gap-3 items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full border rounded-md p-2 bg-background"
          />
        </div>

        <Button variant="outline" onClick={fetchTemplates}>
          Search
        </Button>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No templates found
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4 text-left">Template Key</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-muted/40">
                    <td className="p-4 font-medium">
                      {t.template_key}
                    </td>

                    <td className="p-4 text-center">
                      <StatusBadge active={t.is_active} />
                    </td>

                    <td className="p-4 text-center">
                      <Link
                        href={`/admin/document-templates/${t.id}`}
                        className="text-primary hover:underline"
                      >
                        Edit
                      </Link>
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
          disabled={templates.length < limit}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg w-[500px] p-6 space-y-4">

            <h2 className="text-lg font-bold">
              Create Document Template
            </h2>

            <input
              placeholder="Template Key"
              className="w-full border rounded-md p-2 bg-background"
              value={newTemplate.template_key}
              onChange={(e) =>
                setNewTemplate({
                  ...newTemplate,
                  template_key: e.target.value,
                })
              }
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                Create
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}