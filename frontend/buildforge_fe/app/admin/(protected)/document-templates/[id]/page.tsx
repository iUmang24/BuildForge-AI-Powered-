"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function DocumentTemplateEditPage() {
  const { id } = useParams();
  const { accessToken } = useAdminAuth();

  const [template, setTemplate] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    fetch(`${API_BASE_URL}/admin/document-templates/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((json) => setTemplate(json.data));
  }, [accessToken, id]);

  const handleSave = async () => {
    setSaving(true);

    await fetch(`${API_BASE_URL}/admin/document-templates/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html_content: template.html_content,
        is_active: template.is_active,
      }),
    });

    setSaving(false);
    alert("Template updated successfully");
  };

  if (!template) return null;

  const previewHtml =
  template?.html_content
    ?.replace("{{backgroundImage}}", template.backgroundImage || "")
    ?.replace("{{leftLogo}}", template.product_logo || "")
    ?.replace("{{rightLogo}}", template.parent_logo || "")
    ?.replace("{{signatureImage}}", template.signature_image || "")
    ?.replace("{{qrCode}}", template.qrCode || "")

  || "";

  return (
    <div className="space-y-8">

      {/* BACK BUTTON */}
      <Link
        href="/admin/document-templates"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Document Templates
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Edit Document Template
        </h1>
        <p className="text-muted-foreground">
          Template Key: {template.template_key}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT SIDE */}
        <Card>
          <CardContent className="p-6 space-y-4">

            <div>
              <label className="text-sm font-medium">
                HTML Content
              </label>
              <textarea
                rows={18}
                className="mt-1 w-full border rounded-md p-3 font-mono text-sm bg-background"
                value={template.html_content}
                onChange={(e) =>
                  setTemplate({
                    ...template,
                    html_content: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={template.is_active}
                onChange={(e) =>
                  setTemplate({
                    ...template,
                    is_active: e.target.checked ? 1 : 0,
                  })
                }
              />
              <span className="text-sm">Active</span>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? "Saving..." : "Save Template"}
            </Button>

          </CardContent>
        </Card>

        {/* RIGHT SIDE PREVIEW */}
        <Card>
          <CardContent className="p-6 space-y-4">

            <h2 className="font-semibold text-lg">
              Live Preview
            </h2>

            <div className="border rounded-md p-4 bg-white text-black overflow-auto max-h-[600px]">
              <div
                dangerouslySetInnerHTML={{
                  __html: previewHtml,
                }}
              />
            </div>

          </CardContent>
        </Card>

      </div>

    </div>
  );
}