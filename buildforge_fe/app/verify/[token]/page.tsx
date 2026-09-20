"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, ShieldCheck } from "lucide-react";

export default function VerifyCertificatePage() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/students/verify/${token}`
        );

        const json = await res.json();
        setData(json);
      } catch (err) {
        setData({
          valid: false,
          message: "Verification failed",
        });
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Verifying certificate...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full shadow-xl border">
        <CardHeader className="text-center space-y-4">

          {/* BUILD FORGE LOGO */}
          <div className="flex justify-center">
            <img
              src="/bflogo.png"
              alt="BuildForge"
              className="h-14 object-contain"
            />
          </div>

          {/* VERIFIED / INVALID ICON */}
          {data?.valid ? (
            <div className="flex justify-center">
              <ShieldCheck className="w-16 h-16 text-success" />
            </div>
          ) : (
            <div className="flex justify-center">
              <XCircle className="w-16 h-16 text-destructive" />
            </div>
          )}

          <CardTitle className="text-2xl">
            {data?.valid
              ? "Certificate Verified"
              : "Invalid Certificate"}
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            {data?.valid
              ? "This certificate is officially issued and valid."
              : data?.message}
          </p>
        </CardHeader>

        {/* DETAILS */}
        {data?.valid && (
          <CardContent className="space-y-4 pt-6">

            <Detail label="Student Name" value={data.studentName} />
            <Detail label="Program" value={data.program} />
            <Detail label="Certificate ID" value={data.certificateId} />
            <Detail label="Issue Date" value={data.issueDate} />

            {data.score !== null && (
              <Detail
                label="Final Score"
                value={`${data.score} / 10`}
              />
            )}

            {data.startDate && (
              <Detail label="Start Date" value={data.startDate} />
            )}

            {data.endDate && (
              <Detail label="End Date" value={data.endDate} />
            )}

            <div className="pt-6 text-center space-y-2">

              <p className="text-xs text-muted-foreground">
                Verified by BuildForge Certification Authority
              </p>

              {/* SHRIVA LOGO */}
              <div className="flex justify-center">
                <img
                  src="/parentlogo.png"
                  alt="Shriva"
                  className="h-8 object-contain opacity-80"
                />
              </div>

            </div>

          </CardContent>
        )}
      </Card>
    </div>
  );
}

/* ================= COMPONENT ================= */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between border-b pb-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
