"use client";

import { useState } from "react";
import { X, Coins, Check, Loader2, Ticket, History } from "lucide-react";
import Link from "next/link";

interface CreditTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onToppedUp: (newBalance: number) => void;
}

// Topup packages (test mode - no real payment)
const TOPUP_PACKAGES = [
  {
    key: "package_200",
    amount: 200,
    price_usd: 9,
    label: "+200P",
    badge: undefined,
  },
  {
    key: "package_500",
    amount: 500,
    price_usd: 19,
    label: "+500P",
    badge: "Popular",
  },
  {
    key: "package_1000",
    amount: 1000,
    price_usd: 39,
    label: "+1,000P",
    badge: undefined,
  },
  {
    key: "package_5000",
    amount: 5000,
    price_usd: 99,
    label: "+5,000P",
    badge: "Best Value",
  },
] as const;

type TabType = "topup" | "coupon";

export default function CreditTopupModal({
  isOpen,
  onClose,
  workspaceId,
  onToppedUp,
}: CreditTopupModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("topup");
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTopup = async () => {
    if (!selectedPackage) return;

    const pkg = TOPUP_PACKAGES.find((p) => p.key === selectedPackage);
    if (!pkg) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Call topup API
      const topupRes = await fetch("/api/credits/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          amount: pkg.amount,
          package_key: pkg.key,
        }),
      });

      if (!topupRes.ok) {
        const data = await topupRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to top up credits");
      }

      const topupData = await topupRes.json();

      // Refresh balance from API
      const balanceRes = await fetch(`/api/credits/balance?workspace_id=${workspaceId}`);
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        onToppedUp(balanceData.balance);
      } else {
        // Fallback to topup response balance
        onToppedUp(topupData.new_balance);
      }

      // Close modal after success
      onClose();
    } catch (err) {
      console.error("[CreditTopupModal] Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCouponRedeem = async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          code: couponCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to redeem coupon");
      }

      // Success - display message based on coupon type
      if (data.kind === "credits") {
        setSuccessMessage(`${data.credits_added.toLocaleString()}P added to your account!`);
        // Refresh balance
        const balanceRes = await fetch(`/api/credits/balance?workspace_id=${workspaceId}`);
        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          onToppedUp(balanceData.balance);
        }
      } else if (data.kind === "subscription") {
        setSuccessMessage(`Subscription extended by ${data.months_added} month(s)!`);
      }

      // Clear input
      setCouponCode("");

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("[CreditTopupModal] Coupon Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const selectedPkg = TOPUP_PACKAGES.find((p) => p.key === selectedPackage);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg rounded-lg bg-card border border-border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Top Up Credits
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add credits to your workspace
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground transition hover:text-foreground"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => {
              setActiveTab("topup");
              setError(null);
              setSuccessMessage(null);
            }}
            disabled={isLoading}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${
              activeTab === "topup"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <div className="flex items-center justify-center gap-2">
              <Coins className="h-4 w-4" />
              <span>Top Up</span>
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab("coupon");
              setError(null);
              setSuccessMessage(null);
            }}
            disabled={isLoading}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${
              activeTab === "coupon"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <div className="flex items-center justify-center gap-2">
              <Ticket className="h-4 w-4" />
              <span>Redeem Coupon</span>
            </div>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Tab Content: Topup */}
          {activeTab === "topup" && (
            <>
              {/* Test Mode Badge */}
              <div className="mb-5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="rounded bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white">
                    Test Mode
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Credits are added instantly without real payment
                  </p>
                </div>
              </div>

              {/* Package Grid */}
              <div className="mb-5 grid grid-cols-2 gap-3">
                {TOPUP_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage === pkg.key;
                  const hasBadge = !!pkg.badge;

                  return (
                    <button
                      key={pkg.key}
                      onClick={() => {
                        setSelectedPackage(pkg.key);
                        setError(null);
                      }}
                      disabled={isLoading}
                      className={`relative flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/50"
                          : "border-border bg-card hover:border-primary/50 hover:bg-muted"
                      } ${isLoading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    >
                      {hasBadge && (
                        <div className="absolute -top-2 right-2">
                          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                            {pkg.badge}
                          </span>
                        </div>
                      )}

                      <Coins className={`h-8 w-8 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      
                      <div className="text-center">
                        <div className="text-xl font-bold text-foreground">
                          {pkg.label}
                        </div>
                        <div className="mt-1 text-sm font-medium text-primary">
                          ${pkg.price_usd}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 left-2">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Package Summary */}
              {selectedPkg && (
                <div className="mb-5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Selected Package</span>
                    <span className="font-semibold text-foreground">
                      {selectedPkg.label} (${selectedPkg.price_usd})
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTopup}
                  disabled={!selectedPackage || isLoading}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Top Up"
                  )}
                </button>
              </div>

              {/* Info Text */}
              <div className="mt-4 text-xs text-muted-foreground text-center">
                Credits are shared among all workspace members
              </div>
            </>
          )}

          {/* Tab Content: Coupon */}
          {activeTab === "coupon" && (
            <>
              {/* Coupon Input */}
              <div className="mb-5">
                <label htmlFor="coupon-code" className="block text-sm font-medium text-foreground mb-2">
                  Coupon Code
                </label>
                <input
                  id="coupon-code"
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  placeholder="Enter your coupon code"
                  disabled={isLoading}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCouponRedeem}
                  disabled={!couponCode.trim() || isLoading}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    "Redeem"
                  )}
                </button>
              </div>

              {/* Info Text */}
              <div className="mt-4 text-xs text-muted-foreground text-center">
                Each coupon can only be used once per workspace
              </div>
            </>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-5 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Success Display */}
          {successMessage && (
            <div className="mt-5 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2 text-sm text-green-700 dark:text-green-400">
              {successMessage}
            </div>
          )}

          {/* History Link */}
          <div className="mt-5 pt-5 border-t border-border">
            <Link
              href={`/workspace/billing/history?ws=${workspaceId}`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
            >
              <History className="h-4 w-4" />
              <span>View History</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
