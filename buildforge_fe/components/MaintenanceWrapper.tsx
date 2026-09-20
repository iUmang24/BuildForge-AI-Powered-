"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import MaintenancePage from "@/app/maintainence/page";

export default function MaintenanceWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, {
          cache: "no-store",
        });

        if (res.status === 503) {
          setMaintenance(true);
        }
      } catch (err) {
        console.error("Health check failed", err);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenance();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        
      </div>
    );
  }

  if (maintenance) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
