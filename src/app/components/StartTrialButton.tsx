"use client";

import { useState } from "react";

export default function StartTrialButton({
  children = "Start 14-Day Free Trial",
  className = "",
}: {
  children?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startTrial() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout.");
      }

      window.location.href = data.url;
    } catch (checkoutError: any) {
      console.error("Checkout start error:", checkoutError);

      setError(
        checkoutError?.message ||
          "Could not open checkout. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={startTrial} disabled={loading} className={className}>
        {loading ? "Opening Checkout..." : children}
      </button>

      {error && (
        <p className="mt-2 max-w-xl text-sm font-semibold text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}