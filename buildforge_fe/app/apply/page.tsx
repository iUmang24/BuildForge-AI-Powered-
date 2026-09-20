"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/config";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ApplyPage() {

  /* ---------- FORM ---------- */

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    state: "",
    college_id: "",
    project_id: "",
    program: "",
    source: "",
    github_username: "",
  });

  /* ---------- OTP STATE ---------- */

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");

  /* ---------- DROPDOWN DATA ---------- */

  const [states, setStates] = useState<string[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  /* ---------- UI ---------- */

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [showCollegeRequest, setShowCollegeRequest] = useState(false);
  const [requestedCollege, setRequestedCollege] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [isCustomProject, setIsCustomProject] = useState(false);
  const [customProjectTitle, setCustomProjectTitle] = useState("");

  const selectedProject = projects.find(
    (p) => String(p.id) === formData.project_id
  );

  /* ================= LOAD STATES ================= */

  useEffect(() => {

    const loadInitialData = async () => {
      try {
        setLoadingStates(true);
        const stateRes = await fetch(`${API_BASE_URL}/states`);
        const stateJson = await stateRes.json();

        setLoadingStates(false);

        if (stateJson.success && stateJson.data.length > 0) {

          const firstState = stateJson.data[0];

          setStates(stateJson.data);

          // Set first state
          setFormData(prev => ({
            ...prev,
            state: firstState
          }));

          /* ---------- LOAD COLLEGES OF FIRST STATE ---------- */

          setLoadingColleges(true);
          const collegeRes = await fetch(`${API_BASE_URL}/colleges?state=${firstState}`);
          const collegeJson = await collegeRes.json();

          setLoadingColleges(false);

          if (collegeJson.success && collegeJson.data.length > 0) {

            const firstCollege = collegeJson.data[0];

            setColleges(collegeJson.data);



            // Set first college
            setFormData(prev => ({
              ...prev,
              state: firstState,
              college_id: String(firstCollege.id)
            }));

            /* ---------- LOAD PROJECTS OF FIRST COLLEGE ---------- */

            setLoadingProjects(true);
            const projectRes = await fetch(`${API_BASE_URL}/projects?id=${firstCollege.id}`);
            const projectJson = await projectRes.json();

            setLoadingProjects(false);

            if (projectJson.success && projectJson.data.length > 0) {

              const firstProject = projectJson.data[0];

              setProjects(projectJson.data);

              // Set first project
              setFormData(prev => ({
                ...prev,
                state: firstState,
                college_id: String(firstCollege.id),
                project_id: String(firstProject.id)
              }));
            }
          }
        }

      } catch (error) {
        console.error("Initial dropdown load failed", error);
      }
    };

    loadInitialData();

  }, []);

  /* ================= OTP SEND ================= */

  const sendOtp = async () => {

    if (!formData.email) {
      setOtpError("Enter email first");
      return;
    }

    setOtpLoading(true);
    setOtpError("");
    setOtpSuccess("");

    try {

      const res = await fetch(`${API_BASE_URL}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          type: "verify"
        })
      });

      const json = await res.json();

      if (json.success) {
        setOtpSent(true);
        setOtpVerified(false);
        setOtp("");
        setOtpAttempts(0);
        setOtpSuccess("OTP sent successfully");
      } else {
        setOtpError(json.message);
      }

    } catch {
      setOtpError("Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  /* ================= OTP VERIFY ================= */

  const verifyOtp = async () => {

    setOtpLoading(true);
    setOtpError("");
    setOtpSuccess("");

    try {

      const res = await fetch(`${API_BASE_URL}/otp/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp
        })
      });

      const json = await res.json();

      if (json.success) {
        setOtpVerified(true);
        setOtpSuccess("Email verified successfully");
      } else {
        setOtpAttempts((prev) => {
          if (prev >= 3) return 3;
          return prev + 1;
        });

        setOtpError(
          otpAttempts >= 2
            ? "Maximum attempts reached. Please resend OTP."
            : json.message
        );
      }

    } catch {
      setOtpError("Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  /* ================= VALIDATION ================= */

  const validateForm = () => {

    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim())
      newErrors.full_name = "Name is required";

    if (!formData.email.trim())
      newErrors.email = "Email is required";

    if (!otpVerified)
      newErrors.email = "Verify your email first";

    if (!formData.github_username)
      newErrors.github_username = "GitHub username is required";

    if (
      formData.github_username &&
      !/^[a-zA-Z0-9-]{1,39}$/.test(formData.github_username)
    ) {
      newErrors.github_username = "Invalid GitHub username";
    }

    if (!formData.password || formData.password.length < 8)
      newErrors.password = "Minimum 8 characters required";

    if (formData.password !== formData.confirm_password)
      newErrors.confirm_password = "Passwords do not match";

    if (!/^[6-9]\d{9}$/.test(formData.phone))
      newErrors.phone = "Enter valid Indian mobile number";

    if (!formData.state) newErrors.state = "State required";
    if (!formData.college_id) newErrors.college_id = "College required";
    if (!formData.project_id) newErrors.project_id = "Project required";

    if (isCustomProject && !customProjectTitle.trim()) {
      newErrors.project_id = "Custom project title required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= FINAL SUBMIT ================= */

  const submitStudent = async () => {

    setIsLoading(true);

    try {

      const res = await fetch(`${API_BASE_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          is_custom_project: isCustomProject ? 1 : 0,
          custom_project_title: isCustomProject
            ? customProjectTitle.trim()
            : null,
        }),
      });

      const json = await res.json();

      if (json.success) {
        window.location.replace("/dashboard");
      } else {
        toast.error(json.message);//alert(json.message);
      }

    } catch {
      toast.error("Server error. Please try again.");
    } finally {
      setIsLoading(false);
      setShowDisclaimer(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowDisclaimer(true);
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="w-full max-w-lg mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Apply for Internship</CardTitle>
            <CardDescription>Fill details carefully</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* NAME */}
              <div>
                <Label>Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
                {errors.full_name && (<p className="text-xs text-destructive">{errors.full_name}</p>)}
              </div>

              {/* EMAIL + OTP */}
              <div>
                <Label>Email</Label>

                <div className="flex gap-2">
                  <Input
                    disabled={otpVerified}
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setOtpVerified(false);
                      setOtpSent(false);
                      setOtpError("");
                      setOtpSuccess("");
                    }}
                  />

                  {!otpVerified && (
                    <Button
                      type="button"
                      onClick={sendOtp}
                      disabled={otpLoading}
                    >
                      {otpLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Send OTP"}
                    </Button>
                  )}
                </div>

                {otpSent && !otpVerified && (
                  <div className="mt-3 space-y-2">

                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter OTP"
                        maxLength={6}
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ""))
                        }
                      />

                      <Button
                        type="button"
                        onClick={verifyOtp}
                        disabled={otp.length !== 6 || otpAttempts >= 3}
                      >
                        Verify
                      </Button>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span>Attempts: {otpAttempts}/3</span>
                      <button
                        type="button"
                        className="underline"
                        onClick={sendOtp}
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}

                {otpError && (
                  <p className="text-xs text-destructive mt-2">
                    {otpError}
                  </p>
                )}

                {otpSuccess && (
                  <p className="text-xs text-green-600 mt-2">
                    {otpSuccess}
                  </p>
                )}
                {errors.email && (<p className="text-xs text-destructive">{errors.email}</p>)}
              </div>

              {/* GITHUB USERNAME */}
              <div>
                <Label>GitHub Username</Label>
                <Input
                  placeholder="e.g. xyzabc"
                  value={formData.github_username}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      github_username: e.target.value.trim(),
                    })
                  }
                />
                {errors.github_username && (
                  <p className="text-xs text-destructive">
                    {errors.github_username}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                {errors.password && (<p className="text-xs text-destructive">{errors.password}</p>)}
              </div>

              {/* CONFIRM */}
              <div>
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) =>
                    setFormData({ ...formData, confirm_password: e.target.value })
                  }
                />
                {errors.confirm_password && (<p className="text-xs text-destructive"> {errors.confirm_password} </p>)}
              </div>

              {/* PHONE */}
              <div>
                <Label>Phone</Label>
                <Input
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value.replace(/\D/g, "")
                    })
                  }
                />
                {errors.phone && (<p className="text-xs text-destructive">{errors.phone}</p>)}
              </div>

              {/* STATE */}
              <div>
                <Label>State</Label>
                <Select
                  value={formData.state || undefined}
                  onValueChange={async (value) => {
                    if (!value) return;

                    // Reset dependent fields first
                    setFormData(prev => ({
                      ...prev,
                      state: value,
                      college_id: "",
                      project_id: ""
                    }));

                    setLoadingColleges(true);
                    const res = await fetch(`${API_BASE_URL}/colleges?state=${value}`);
                    const json = await res.json();

                    if (json.success && json.data.length > 0) {
                      setLoadingColleges(false);
                      const firstCollege = json.data[0];

                      setColleges(json.data);

                      // ✅ Auto select first college
                      setFormData(prev => ({
                        ...prev,
                        state: value,
                        college_id: String(firstCollege.id),
                        project_id: ""
                      }));

                      setLoadingProjects(true);

                      // Load projects of first college
                      const projectRes = await fetch(
                        `${API_BASE_URL}/projects?id=${firstCollege.id}`
                      );
                      const projectJson = await projectRes.json();

                      if (projectJson.success && projectJson.data.length > 0) {
                        setLoadingProjects(false);
                        const firstProject = projectJson.data[0];

                        setProjects(projectJson.data);

                        // ✅ Auto select first project
                        setFormData(prev => ({
                          ...prev,
                          state: value,
                          college_id: String(firstCollege.id),
                          project_id: String(firstProject.id)
                        }));
                      } else {
                        setProjects([]);
                      }

                    } else {
                      setColleges([]);
                      setProjects([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    {loadingStates ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <SelectValue placeholder="Select State" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (<p className="text-xs text-destructive">{errors.state}</p>)}
              </div>

              {/* COLLEGE */}
              <div>
                <Label>College</Label>
                <Select
                  value={formData.college_id}
                  onValueChange={async (value) => {
                    if (!value) return;
                    setFormData({ ...formData, college_id: value });
                    const res = await fetch(`${API_BASE_URL}/projects?id=${value}`);
                    const json = await res.json();
                    if (json.success) setProjects(json.data);
                  }}
                >
                  <SelectTrigger>
                    {loadingColleges ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <SelectValue placeholder="Select College" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.colleges}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs mt-2">
                  College not found?{" "}
                  <button
                    type="button"
                    className="underline text-primary"
                    onClick={() => setShowCollegeRequest(true)}
                  >
                    Request to add your college
                  </button>
                </p>
                {errors.college_id && (<p className="text-xs text-destructive"> {errors.college_id} </p>)}
              </div>

              {/* PROJECT */}
              <div>
                <Label>Project</Label>

                <Select
                  disabled={isCustomProject}
                  value={formData.project_id || undefined}
                  onValueChange={(value) => {
                    if (!value) return;   // 👈 ADD
                    setFormData({ ...formData, project_id: value });
                  }}
                >
                  <SelectTrigger>
                    {loadingProjects ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <SelectValue placeholder="Select Project" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={isCustomProject}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsCustomProject(checked);

                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          project_id: "101"
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          project_id: ""
                        }));
                        setCustomProjectTitle("");
                      }
                    }}
                  />
                  <Label className="text-sm">
                    I want to enter my own project
                  </Label>
                </div>
                {isCustomProject && (
                  <div className="mt-3">
                    <Label>Enter Your Project Title</Label>
                    <Input
                      value={customProjectTitle}
                      onChange={(e) => setCustomProjectTitle(e.target.value)}
                      placeholder="e.g. AI Resume Analyzer"
                    />
                  </div>
                )}
                {errors.project_id && (<p className="text-xs text-destructive"> {errors.project_id} </p>)}

              </div>

              {selectedProject?.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedProject.description}
                </p>
              )}

              <Button type="submit" className="w-full">
                Submit Application
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>

      {/* DISCLAIMER */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Important Disclaimer</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            By proceeding, you confirm that all the information provided is accurate and belongs to you. This information will be used for official communication and for issuing certificates after successful completion of the internship. Any incorrect or misleading information may result in account deactivation without prior notice.
          </p>

          {/* 🔴 IMPORTANT RULE */}
          <div className="mt-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
            ⚠️ <strong>Important:</strong> The internship certificate will only be issued after the completion of the full 8-week duration.
            Even if you complete all tasks earlier, the certificate will be generated only after the official end date.
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisclaimer(false)}>
              Cancel
            </Button>

            <Button onClick={submitStudent} disabled={isLoading}>
              {isLoading ? "Processing..." : "Confirm & Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showCollegeRequest} onOpenChange={setShowCollegeRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request College Addition</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            {/* Warning Box */}
            <div className="text-xs bg-yellow-50 border border-yellow-200 p-3 rounded-md text-yellow-800">
              ⚠ Please ensure the college name and state you provide are accurate and officially recognized.
              Requests containing incorrect or misleading information will not be added to the system.
            </div>

            <div>
              <Label>College Name</Label>
              <Input
                value={requestedCollege}
                onChange={(e) => setRequestedCollege(e.target.value)}
                placeholder="Enter your college name"
              />
            </div>

            <div>
              <Label>State</Label>
              <Input value={formData.state} disabled />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCollegeRequest(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={async () => {
                if (!requestedCollege.trim()) {
                  toast.error("Please enter your college name.");
                  return;
                }

                try {
                  setRequestLoading(true);

                  const res = await fetch(`${API_BASE_URL}/students/college-request`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      state: formData.state,
                      college: requestedCollege
                    })
                  });

                  const json = await res.json();

                  if (res.ok && json.success) {
                    toast.success(
                      "Request sent successfully. You will be informed within 24 hours."
                    );
                    setRequestedCollege("");
                    setShowCollegeRequest(false);
                  } else {
                    toast.error(json.message || "Failed to send request.");
                  }

                } catch (error) {
                  toast.error("Server error. Please try again.");
                } finally {
                  setRequestLoading(false);
                }
              }}
              disabled={requestLoading}
            >
              {requestLoading ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
