"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWorkspace } from "@/app/_providers/workspace-provider";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TAB_KEYS = ["overview", "instant", "history", "settings"] as const;
type TabKey = typeof TAB_KEYS[number];

function normalizeTab(value: string | null): TabKey {
  return TAB_KEYS.includes(value as TabKey) ? (value as TabKey) : "overview";
}

// Tone presets with preview examples (EN)
const TONE_PRESETS = {
  professional: {
    labelEn: "Professional",
    previewEn: {
      subject: "January New Service Announcement",
      bullets: [
        "Hello, we're pleased to share some exciting news with you.",
        "Check out the premium features launching this month.",
        "Please don't hesitate to reach out with any questions.",
      ],
    },
  },
  friendly: {
    labelEn: "Friendly",
    previewEn: {
      subject: "Hi! January Updates Have Arrived",
      bullets: [
        "Hello! We've got some great news to share with you today.",
        "Our new premium features are launching, and they're really useful!",
        "Feel free to ask if you have any questions :)",
      ],
    },
  },
  concise: {
    labelEn: "Concise",
    previewEn: {
      subject: "January Feature Launch",
      bullets: [
        "New premium features are now available.",
        "Key updates: Automation workflows, advanced analytics dashboard.",
        "See our website for details.",
      ],
    },
  },
  premium: {
    labelEn: "Premium",
    previewEn: {
      subject: "January Updates Exclusively for You",
      bullets: [
        "A premium service designed just for you is now live.",
        "Experience the upgraded features right now.",
        "Discover the exclusive benefits available to premium members.",
      ],
    },
  },
  witty: {
    labelEn: "Witty",
    previewEn: {
      subject: "This Month's Update—You'll Regret Missing It!",
      bullets: [
        "Ta-da! January's new features are finally here.",
        "This one thing will cut your work time in half. (No exaggeration)",
        "Try it now and show off to your colleagues!",
      ],
    },
  },
} as const;

type ToneKey = keyof typeof TONE_PRESETS;

function AutoPostingContent() {
  const { activeWorkspace, loading } = useWorkspace();
  const searchParams = useSearchParams();
  
  const [autoPostingEnabled, setAutoPostingEnabled] = useState(true);
  const [instantTopic, setInstantTopic] = useState("");
  const [instantEmphasis, setInstantEmphasis] = useState("");
  const [signatureText, setSignatureText] = useState("");
  const [brandDesc, setBrandDesc] = useState("");
  const [resultEmail, setResultEmail] = useState("");
  const [tone, setTone] = useState<ToneKey>("professional");
  const [settingsTab, setSettingsTab] = useState<"personal" | "global">("personal");
  
  // Personal Tone Analysis state (UI only, no API)
  const [toneAnalysisSample, setToneAnalysisSample] = useState("");
  const [toneAnalysisResult, setToneAnalysisResult] = useState<{
    keywords: string[];
    styleGuide: string[];
    avoidPhrases: string[];
  } | null>(null);

  // Tab state from query string
  const activeTab = useMemo(() => normalizeTab(searchParams.get("tab")), [searchParams]);

  // Handle tab change
  const handleTabChange = useCallback((next: string) => {
    const newTab = normalizeTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", newTab);
    window.history.replaceState(null, "", url.toString());
  }, []);

  // Role-based access control
  const workspaceName = activeWorkspace?.workspace.name || "Workspace";
  const workspaceType = activeWorkspace?.workspaceType || "personal";
  const userRole = activeWorkspace?.role || "member";
  const canManageSettings = userRole !== "member";
  
  // Permission logic
  const isPersonalWorkspace = workspaceType === "personal";
  const isOwner = isPersonalWorkspace || userRole === "owner";
  const canEditGlobal = isOwner;
  
  // PRO entitlement check (placeholder: check if workspace has PRO subscription)
  // TODO: Replace with actual entitlement check from workspace subscription data
  const hasProEntitlement = false; // Placeholder: always false for UI-only implementation

  // 3-state logic
  const hasGlobalSetup = brandDesc.trim().length > 0;
  const hasMonthlyItems = true; // Mock: true for now (update with API)

  // Safe active tab: members cannot access settings
  const safeActiveTab = useMemo(() => {
    if (!canManageSettings && activeTab === "settings") {
      return "overview";
    }
    return activeTab;
  }, [activeTab, canManageSettings]);

  if (loading) {
    return (
      <div className="px-4 py-8 md:px-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 md:px-6 max-w-7xl">
      {/* Top Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Auto Sending · {workspaceName}
        </h1>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          Automatically sent to your email every 2 days at 8 AM
          <Badge tone="muted" className="text-xs">
            {workspaceType === "personal" ? "Personal" : "Team"}
          </Badge>
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" value={safeActiveTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start gap-2 mb-6">
          <TabsTrigger value="overview" className="min-w-[80px]">
            Overview
          </TabsTrigger>
          <TabsTrigger value="instant" className="min-w-[80px]">
            Send Now
          </TabsTrigger>
          <TabsTrigger value="history" className="min-w-[80px]">
            History
          </TabsTrigger>
          {canManageSettings ? (
            <TabsTrigger value="settings" className="min-w-[80px]">
              Settings
            </TabsTrigger>
          ) : (
            <div className="min-w-[80px] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed">
              Settings
              <Badge tone="muted" className="text-xs">
                Admin only
              </Badge>
            </div>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="pt-2">
          {renderOverviewTab()}
        </TabsContent>

        {/* Instant Tab */}
        <TabsContent value="instant" className="pt-2">
          {renderInstantTab()}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="pt-2">
          <HistoryTab />
        </TabsContent>

        {/* Settings Tab */}
        {canManageSettings && (
          <TabsContent value="settings" className="pt-2">
            {renderSettingsTab()}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );

  // ============================================================
  // TAB RENDER FUNCTIONS
  // ============================================================

  function renderOverviewTab() {
    // Mock data
    const monthSent = 8;
    const monthTotal = 15;
    const nextSendDate = "Jan 23";
    const itemsPrepared = 12;

    return (
      <div className="space-y-6">
        {/* 3-state branching: check global setup */}
        {!hasGlobalSetup ? (
          // State A) Global setup not configured
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-bold text-amber-900 mb-2">
              Global settings required to start auto posting
            </h2>
            <p className="text-sm text-amber-800 leading-relaxed mb-4">
              These settings will be used as the basis for generating this month's items.
            </p>
            <button
              onClick={() => handleTabChange("settings")}
              disabled={!canEditGlobal}
              className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canEditGlobal ? "Configure Global Settings" : "Admins only"}
            </button>
          </div>
        ) : !hasMonthlyItems ? (
          // State B) Global setup done but no items
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-2">
              No items for this month yet
            </h2>
            <p className="text-sm text-blue-800 leading-relaxed mb-4">
              Generate 15 items based on your global settings.
            </p>
            <button
              onClick={canEditGlobal ? () => alert("Generate items API call (TODO)") : () => alert("Admins only")}
              disabled={!canEditGlobal}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canEditGlobal ? "Generate Items (15)" : "Admins only"}
            </button>
          </div>
        ) : (
          // State C) Operating
          <>
            {/* Card 1: This Month Sending Status */}
            <div className="rounded-lg border-2 border-primary/20 bg-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">This Month Sending Status</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Sent This Month</p>
                  <p className="text-3xl font-bold text-foreground">
                    {monthSent} <span className="text-lg text-muted-foreground">/ {monthTotal}</span>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Next Send Date</p>
                  <p className="text-2xl font-bold text-foreground">{nextSendDate}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                  <p className="text-sm text-foreground leading-relaxed">
                    <span className="font-semibold">Content:</span> Blog + SNS (delivered via email)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                  <p className="text-sm text-foreground leading-relaxed">
                    <span className="font-semibold">Items Prepared:</span> {itemsPrepared} items
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Scheduled Auto Sending */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground mb-2">Scheduled Auto Sending</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Automatically sent to your email every 2 days at 8 AM.
                  </p>
                </div>
                <button
                  onClick={() => setAutoPostingEnabled(!autoPostingEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    autoPostingEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoPostingEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="rounded-md bg-muted/30 p-4">
                {autoPostingEnabled ? (
                  <p className="text-sm text-foreground">
                    <Badge tone="primary" className="text-xs mr-2">On</Badge>
                    Will send automatically on next scheduled date.
                  </p>
                ) : (
                  <p className="text-sm text-foreground">
                    <Badge tone="muted" className="text-xs mr-2">Off</Badge>
                    Turn on to resume from next scheduled date.
                  </p>
                )}
              </div>
            </div>

            {/* Card 3: This Month Items */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">This Month Items</h2>
                <Badge tone="muted" className="text-xs">{itemsPrepared} items</Badge>
              </div>

              <div className="space-y-2 mb-4">
                {[
                  { title: "Top 5 Winter Travel Destinations", status: "Sent", date: "Jan 11" },
                  { title: "Weekend Special Event Notice", status: "Sent", date: "Jan 9" },
                  { title: "New Product Launch", status: "Sent", date: "Jan 7" },
                  { title: "Customer Review Collection", status: "Scheduled", date: "Jan 15" },
                  { title: "This Week's Recommended Content", status: "Scheduled", date: "Jan 17" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-3 px-3 rounded-md hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <Badge tone={item.status === "Sent" ? "primary" : "muted"} className="text-xs ml-2">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => handleTabChange("history")}
              >
                View All
              </Button>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handleTabChange("instant")}
                className="w-full"
              >
                Send Now (Urgent)
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handleTabChange("history")}
                className="w-full"
              >
                View Send History
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  function renderInstantTab() {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
          <h2 className="text-xl font-bold text-foreground mb-3">Send Now</h2>
          <p className="text-sm text-foreground leading-relaxed">
            Separate from scheduled sending, use tokens to receive immediately.
          </p>
        </div>

        {/* Auto Posting - Send Now */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Auto Posting - Send Now (Token)</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Generate blog + SNS content and send via email immediately. (Uses 1 token)
          </p>
          
          <div className="space-y-4">
            {/* Input: Topic */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Topic (Optional)
              </label>
              <input
                type="text"
                value={instantTopic}
                onChange={(e) => setInstantTopic(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g.) Weekend travel special notice"
              />
            </div>

            {/* Input: Emphasis */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Emphasis (Optional)
              </label>
              <input
                type="text"
                value={instantEmphasis}
                onChange={(e) => setInstantEmphasis(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g.) 50% off, first 100 only"
              />
            </div>

            {/* CTA Button */}
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              Send Auto Posting Now (1 token)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function HistoryTab() {
    const [filter, setFilter] = useState<"all" | "auto" | "instant">("all");

    const historyItems = [
      { date: "2026-01-11", time: "08:00", type: "auto", status: "success", title: "Top 5 Winter Travel Destinations" },
      { date: "2026-01-10", time: "14:23", type: "instant", status: "success", title: "Urgent Event Notice" },
      { date: "2026-01-09", time: "08:00", type: "auto", status: "success", title: "Weekend Special Event" },
      { date: "2026-01-07", time: "08:00", type: "auto", status: "success", title: "New Product Launch" },
      { date: "2026-01-06", time: "11:45", type: "instant", status: "success", title: "Customer Review Collection" },
      { date: "2026-01-05", time: "08:00", type: "auto", status: "failed", title: "This Week's Recommendations" },
    ];

    const filteredItems = historyItems.filter((item) => {
      if (filter === "all") return true;
      return item.type === filter;
    });

    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Send History</h2>
            <Badge tone="muted" className="text-xs">{filteredItems.length} items</Badge>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("auto")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "auto"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Auto Send
            </button>
            <button
              onClick={() => setFilter("instant")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "instant"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Instant Send
            </button>
          </div>

          {/* History List */}
          <div className="space-y-2">
            {filteredItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 px-3 rounded-md hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.date} {item.time}</span>
                    <span>·</span>
                    <span>{item.type === "auto" ? "Auto Send" : "Instant Send"}</span>
                  </div>
                </div>
                <Badge tone={item.status === "success" ? "primary" : "muted"} className="text-xs ml-2">
                  {item.status === "success" ? "Success" : "Failed"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderSettingsTab() {
    // Handler for mock tone analysis (UI only)
    const handleToneAnalysis = () => {
      // Mock analysis result
      setToneAnalysisResult({
        keywords: ["Professional", "Trustworthy", "Clear"],
        styleGuide: [
          "Use respectful language without being overly formal.",
          "Lead with the key message in the first sentence.",
          "Reduce unnecessary modifiers and keep it concise.",
        ],
        avoidPhrases: ["We kindly ask that... (prefer: Please...)", "Sorry, but... (omit if unnecessary)"],
      });
    };
    
    const handleApplyAnalysis = () => {
      if (toneAnalysisResult) {
        alert("Analysis result applied to auto sending settings.");
      }
    };

    return (
      <div className="space-y-6">
        {/* Settings Tabs */}
        <Tabs defaultValue="personal" value={settingsTab} onValueChange={(val) => setSettingsTab(val as "personal" | "global")}>
          <TabsList className="mb-6">
            <TabsTrigger value="personal">Personal Settings</TabsTrigger>
            <TabsTrigger value="global">Global Settings</TabsTrigger>
          </TabsList>

          {/* Personal Settings Tab */}
          <TabsContent value="personal">
            <div className="space-y-6">
              {/* Main Personal Settings Card */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Personal Settings</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Configure your email address, tone, and signature. All workspace members can edit.
                </p>

                <div className="space-y-6">
                  {/* Brand one-liner */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Brand / Service One-liner
                    </label>
                    <input
                      type="text"
                      value={brandDesc}
                      onChange={(e) => setBrandDesc(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g.) Travel optimization solution"
                    />
                  </div>

                  {/* Tone & Style with Preview */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Tone & Style
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value as ToneKey)}
                      className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {Object.entries(TONE_PRESETS).map(([key, preset]) => (
                        <option key={key} value={key}>
                          {preset.labelEn}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Check the preview below to see the tone difference.
                    </p>
                    
                    {/* Tone Preview Card */}
                    <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <h4 className="text-sm font-semibold text-foreground">Preview</h4>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          Subject: {TONE_PRESETS[tone].previewEn.subject}
                        </p>
                        <div className="text-sm text-foreground leading-relaxed space-y-1">
                          {TONE_PRESETS[tone].previewEn.bullets.map((bullet, idx) => (
                            <p key={idx}>• {bullet}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Required phrase (signature) */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Required Phrase (Signature) - Optional
                    </label>
                    <textarea
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] leading-relaxed"
                      placeholder="e.g.) Thank you. - AIROUTE Team"
                    />
                  </div>

                  {/* Result email */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Result Email Address
                    </label>
                    <input
                      type="email"
                      value={resultEmail}
                      onChange={(e) => setResultEmail(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="your-email@example.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Content will be sent to this address.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="primary" size="md">
                      Save
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* PRO-only: Personal Tone Analysis Section */}
              <div className="rounded-lg border border-border bg-card p-6 relative">
                {!hasProEntitlement && (
                  <div className="absolute top-4 right-4">
                    <Badge tone="muted" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                      PRO
                    </Badge>
                  </div>
                )}
                
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                    Brand Voice Analysis (PRO)
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Analyze your brand voice from your samples and apply it to auto sending.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Sample Input */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Sample Text (Optional)
                    </label>
                    <textarea
                      value={toneAnalysisSample}
                      onChange={(e) => setToneAnalysisSample(e.target.value)}
                      disabled={!hasProEntitlement}
                      className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Paste 2-3 examples: website intro, ad copy, customer service messages, etc."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      variant="primary" 
                      size="md"
                      onClick={handleToneAnalysis}
                      disabled={!hasProEntitlement}
                    >
                      Analyze (PRO)
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="md"
                      onClick={handleApplyAnalysis}
                      disabled={!hasProEntitlement || !toneAnalysisResult}
                    >
                      Apply Result
                    </Button>
                  </div>

                  {/* Analysis Result Display */}
                  {toneAnalysisResult && (
                    <div className="rounded-md border border-primary/20 bg-primary/5 p-4 space-y-4">
                      <h4 className="text-sm font-semibold text-foreground">Analysis Result</h4>
                      
                      {/* Keywords */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Tone Keywords</p>
                        <div className="flex flex-wrap gap-2">
                          {toneAnalysisResult.keywords.map((kw, idx) => (
                            <Badge key={idx} tone="primary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Style Guide */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Style Guide (3 lines)</p>
                        <div className="space-y-1 text-sm text-foreground leading-relaxed">
                          {toneAnalysisResult.styleGuide.map((line, idx) => (
                            <p key={idx}>• {line}</p>
                          ))}
                        </div>
                      </div>

                      {/* Avoid Phrases */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Avoid Phrases</p>
                        <div className="space-y-1 text-sm text-foreground leading-relaxed">
                          {toneAnalysisResult.avoidPhrases.map((phrase, idx) => (
                            <p key={idx}>• {phrase}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Paywall for non-PRO users */}
                  {!hasProEntitlement && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm text-amber-800 leading-relaxed">
                          <span className="font-semibold">Available with PRO</span> — Analyze and auto-apply your unique brand voice.
                        </p>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => {
                            // TODO: Link to billing page
                            alert("Navigate to subscription upgrade page (TODO)");
                          }}
                        >
                          Upgrade
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Global Settings Tab */}
          <TabsContent value="global">
            {!canEditGlobal && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Only admins can edit global settings in team workspaces.
              </div>
            )}
            
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Global Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    Settings applied to the entire workspace. Only admins or personal workspace users can change.
                  </p>
                </div>
                {!canEditGlobal && (
                  <Badge tone="muted" className="text-xs">Admin only</Badge>
                )}
              </div>

              <div className="space-y-6">
                {/* Scheduled Auto Sending */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Scheduled Auto Sending
                  </label>
                  <div className="rounded-md border border-border bg-muted/20 px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Auto Posting Schedule</span>
                      <button
                        onClick={() => setAutoPostingEnabled(!autoPostingEnabled)}
                        disabled={!canEditGlobal}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          autoPostingEnabled ? "bg-primary" : "bg-muted"
                        } ${!canEditGlobal ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            autoPostingEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {autoPostingEnabled ? "Automatically sent every 2 days at 8 AM." : "Off."}
                    </p>
                  </div>
                </div>

                {/* Scheduled Insight Letter */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Scheduled Insight Letter
                  </label>
                  <div className="rounded-md border border-border bg-muted/20 px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Weekly Briefing Schedule</span>
                      <button
                        disabled={!canEditGlobal}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-primary ${!canEditGlobal ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                      >
                        <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sent every Monday at 8 AM.
                    </p>
                  </div>
                </div>

                {!canEditGlobal && (
                  <div className="rounded-md bg-muted/30 border border-border p-4">
                    <p className="text-sm text-muted-foreground">
                      Read-only mode. Only admins can make changes.
                    </p>
                  </div>
                )}

                {canEditGlobal && (
                  <div className="flex justify-end">
                    <Button variant="primary" size="md">
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
}

export default function WorkspaceMarketingAutoPostingPage() {
  return (
    <Suspense fallback={
      <div className="px-4 py-8 md:px-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    }>
      <AutoPostingContent />
    </Suspense>
  );
}
