"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  /* ================= VALIDATION ================= */

  const validate = () => {
    const e: Record<string, string> = {};

    if (!email.trim()) e.email = "Email is required";
    if (!password.trim()) e.password = "Password is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ================= SUBMIT ================= */

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    const ok = await login(email, password);

    if (ok) {
      router.replace("/admin/dashboard");
    } else {
      setErrors({ form: "Invalid email or password" });
    }

    setIsLoading(false);
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Admin Panel</CardTitle>
            <CardDescription>
              Login to access the admin dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={submit} className="space-y-4">

              {/* EMAIL */}
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* FORM ERROR */}
              {errors.form && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
                  {errors.form}
                </div>
              )}

              {/* SUBMIT */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
