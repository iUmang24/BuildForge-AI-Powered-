"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

export default function ForgotPasswordPage() {
  const router = useRouter();

  /* ================= STATES ================= */

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* ================= SEND OTP ================= */

  const sendOtp = async () => {
    if (!email) {
      setError("Enter email first");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          type: "reset",
        }),
      });

      const json = await res.json();

      if (json.success) {
        setOtpSent(true);
        setMessage("OTP sent to your email");
      } else {
        setError(json.message);
      }
    } catch {
      setError("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */

  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/otp/verify-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const json = await res.json();

      if (json.success) {
        setOtpVerified(true);
        setMessage("OTP verified. Set new password.");
      } else {
        setError(json.message);
      }
    } catch {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESET PASSWORD ================= */

  const resetPassword = async () => {
    if (!password || password.length < 8) {
      setError("Password must be 8+ characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/otp/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          password,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setMessage("Password reset successful. Redirecting...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setError(json.message);
      }
    } catch {
      setError("Reset failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <Link
          href="/login"
          className="inline-flex items-center gap-2 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              Reset your account password securely
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* EMAIL */}
            <div>
              <Label>Email</Label>
              <div className="flex gap-2">
                <Input
                  value={email}
                  disabled={otpVerified}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setOtpSent(false);
                    setOtpVerified(false);
                  }}
                />

                {!otpVerified && (
                  <Button
                    type="button"
                    onClick={sendOtp}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Send OTP"}
                  </Button>
                )}
              </div>
            </div>

            {/* OTP */}
            {otpSent && !otpVerified && (
              <div>
                <Label>Enter OTP</Label>

                <div className="flex gap-2">
                  <Input
                    value={otp}
                    maxLength={6}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, ""))
                    }
                  />

                  <Button
                    type="button"
                    onClick={verifyOtp}
                    disabled={otp.length !== 6}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            )}

            {/* NEW PASSWORD */}
            {otpVerified && (
              <>
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                  />
                </div>

                <Button
                  onClick={resetPassword}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Reset Password"}
                </Button>
              </>
            )}

            {/* MESSAGE */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {message && (
              <p className="text-sm text-green-600">{message}</p>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
