"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/lib/config";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { hardLogout } from "@/lib/hardLogout";
import { MessageSquare } from "lucide-react";

export default function FeedbackPage() {
  const { accessToken, refreshUser } = useAuth();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <DashboardLayout title="Feedback">
      <div className="max-w-4xl mx-auto space-y-6">

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Share Your Feedback
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            <textarea
              rows={5}
              placeholder="Tell us about your experience, suggestions, or improvements..."
              className="w-full px-3 py-2 rounded-md border bg-background text-foreground"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <div className="flex justify-end">
              <Button
                disabled={loading}
                onClick={async () => {
                  if (!message.trim() || message.length < 10) {
                    toast.error("Feedback must be at least 10 characters");
                    return;
                  }

                  try {
                    setLoading(true);

                    const res = await fetch(`${API_BASE_URL}/students/feedback`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                      },
                      body: JSON.stringify({ message }),
                    });

                    if (res.status === 401 || res.status === 403) {
                      await refreshUser();
                      return;
                    }

                    const json = await res.json();

                    if (!json.success) {
                      toast.error(json.message);
                      return;
                    }

                    toast.success("Thank you for your feedback ❤️");
                    setMessage("");

                  } catch {
                    toast.error("Failed to send feedback");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Sending..." : "Send Feedback"}
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
