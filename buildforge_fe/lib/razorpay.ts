import { API_BASE_URL } from "@/lib/config";
import { hardLogout } from "@/lib/hardLogout";

export async function startPayment(
  plan: "training" | "certificate" | "direct_certificate",
  accessToken: string,
  coupon?: string,
  extraData?: {
    manual_start_date?: string;
    manual_end_date?: string;
  }
) {
  const res = await fetch(`${API_BASE_URL}/payments/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      plan,
      coupon_code: coupon || null,
      manual_start_date: extraData?.manual_start_date || null,
  manual_end_date: extraData?.manual_end_date || null,
    }),
  });

  // 🔐 SESSION EXPIRED → LOGOUT
  if (res.status === 401 || res.status === 403) {
    hardLogout();
    throw new Error("SESSION_EXPIRED");
  }

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.message || "Unable to start payment");
  }

  // 🔥 USE FINAL AMOUNT FROM BACKEND
  const {
    orderId,
    finalAmount,
    key,
  } = json.data;

  return new Promise<void>((resolve, reject) => {
    const options = {
      key,
      amount: Math.round(finalAmount * 100), // ✅ FINAL PAYABLE
      currency: "INR",
      name: "BuildForge",
      description:
        plan === "training"
          ? "Training Access (Weeks 2–8)"
          : "Internship Certificate",
      order_id: orderId,

      handler: async function (response: any) {
        try {
          const verifyRes = await fetch(
            `${API_BASE_URL}/payments/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            }
          );

          if (verifyRes.status === 401 || verifyRes.status === 403) {
            hardLogout();
            reject(new Error("SESSION_EXPIRED"));
            return;
          }

          const verifyJson = await verifyRes.json();

          if (!verifyJson.success) {
            reject(new Error("Payment verification failed"));
            return;
          }

          resolve();
        } catch {
          reject(new Error("Payment verification failed"));
        }
      },

      modal: {
        ondismiss: () => {
          reject(new Error("PAYMENT_CANCELLED"));
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  });
}
