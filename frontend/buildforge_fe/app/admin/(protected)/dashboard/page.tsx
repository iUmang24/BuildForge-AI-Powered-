"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/config";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { adminhardLogout } from "@/lib/adminhardLogout";
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [directStats, setDirectStats] = useState<any>(null);
  const { accessToken, authReady } = useAdminAuth();
  const [platformStats, setPlatformStats] = useState<any>(null);

  /* ================= FETCH DASHBOARD STATS ================= */

  useEffect(() => {
    if (!authReady) return;
    if (!accessToken) return;

    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/submissions`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (res.status === 401 || res.status === 403) {
          adminhardLogout();
          return;
        }

        const json = await res.json();

        const statsFromApi = json.data?.stats || {};

        setData({
          stats: {
            total: statsFromApi.total || 0,
            pending: statsFromApi.pending || 0,
            approved: statsFromApi.approved || 0,
            rejected: statsFromApi.rejected || 0,
          },
        });
      } catch (err) {
        console.error("Admin dashboard fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchDirectStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/direct-certificates`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (res.status === 401 || res.status === 403) {
          adminhardLogout();
          return;
        }

        const json = await res.json();
        setDirectStats(json.data?.stats || {});
      } catch (err) {
        console.error("Direct certificate stats failed", err);
      }
    };

    const fetchPlatformStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (res.status === 401 || res.status === 403) {
          adminhardLogout();
          return;
        }

        const json = await res.json();

        setPlatformStats(json.data || {});
      } catch (err) {
        console.error("Dashboard stats fetch failed", err);
      }
    };

    fetchDashboard();
    fetchDirectStats();
    fetchPlatformStats();
  }, [accessToken, authReady]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading admin dashboard...
      </div>
    );
  }

  /* ================= STATS ================= */

  const stats = [
    {
      label: "Pending Reviews",
      value: data?.stats?.pending ?? 0,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      label: "Approved",
      value: data?.stats?.approved ?? 0,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "Rejected",
      value: data?.stats?.rejected ?? 0,
      icon: XCircle,
      color: "text-red-600",
    },
    {
      label: "Total Submissions",
      value: data?.stats?.total ?? 0,
      icon: Users,
      color: "text-blue-600",
    },
  ];

  const directCertificateStats = [
    {
      label: "Pending Reviews",
      value: directStats?.pending ?? 0,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      label: "Approved",
      value: directStats?.approved ?? 0,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "Rejected",
      value: directStats?.rejected ?? 0,
      icon: XCircle,
      color: "text-red-600",
    },
    {
      label: "Total Submissions",
      value: directStats?.total ?? 0,
      icon: Users,
      color: "text-blue-600",
    },
  ];

  const overviewStats = [
    {
      label: "Total Students",
      value: platformStats?.students ?? 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      label: "Training Revenue",
      value: `₹${platformStats?.trainingRevenue ?? 0}`,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "Certificate Revenue",
      value: `₹${platformStats?.certificateRevenue ?? 0}`,
      icon: CheckCircle,
      color: "text-indigo-600",
    },
    {
      label: "Evaluation Certificate Revenue",
      value: `₹${platformStats?.evaluationRevenue ?? 0}`,
      icon: CheckCircle,
      color: "text-purple-600",
    },
    {
      label: "Total Revenue",
      value: `₹${platformStats?.totalRevenue ?? 0}`,
      icon: CheckCircle,
      color: "text-emerald-600",
    },
  ];

  /* ================= RENDER ================= */

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of final project submissions
        </p>
      </div>

      {/* Platform Overview */}

      <div>
        <h2 className="text-xl font-semibold">
          Platform Overview
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {overviewStats.map((stat) => (
          <Card key={stat.label} className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      <div>
        <h2 className="text-xl font-semibold mt-10">
          Training
        </h2>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Direct Certificate Section */}
      <div>
        <h2 className="text-xl font-semibold mt-10">
          Evaluation
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {directCertificateStats.map((stat) => (
          <Card key={stat.label} className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
