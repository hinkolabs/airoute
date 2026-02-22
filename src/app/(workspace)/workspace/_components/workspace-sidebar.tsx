"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  FileText,
  Presentation,
  Image as ImageIcon,
  Inbox,
  Settings,
  CreditCard,
  Lock,
  Mail,
  Globe,
  Video,
  Gavel,
  Smartphone,
  ShieldCheck,
  DollarSign,
  MapIcon,
  Languages,
  BookText,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/app/_providers/workspace-provider";
import { useAuth } from "@/app/_providers/auth-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresPaid?: boolean;
  badge?: string;
  hideIfCannotManage?: boolean;
}

export default function WorkspaceSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { entitlement, activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);

  // Entitlement-based permissions (SSOT)
  const isPaidForLock = entitlement?.capabilities?.is_paid_for_lock === true;
  const canManageBilling = entitlement?.capabilities?.can_manage_billing === true;

  // Check system_admin status
  useEffect(() => {
    const checkSystemAdmin = async () => {
      if (!user?.id) {
        setIsSystemAdmin(false);
        return;
      }

      try {
        const supabase = getBrowserSupabaseClient();
        const { data } = await supabase
          .from("system_admins")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        setIsSystemAdmin(!!data);
      } catch (error) {
        console.error("Failed to check system_admin status:", error);
        setIsSystemAdmin(false);
      }
    };

    checkSystemAdmin();
  }, [user?.id]);

  // Build admin sections dynamically if system_admin
  const adminDashboardSection: MenuSection | null = isSystemAdmin
    ? {
        title: "Admin",
        items: [
          {
            label: "Admin Dashboard",
            href: "/workspace/admin",
            icon: ShieldCheck,
          },
          {
            label: "Event Logs",
            href: "/workspace/admin/events",
            icon: FileText,
          },
          {
            label: "Credits Audit",
            href: "/workspace/admin/credits",
            icon: DollarSign,
          },
        ],
      }
    : null;

  const contentManagementSection: MenuSection | null = isSystemAdmin
    ? {
        title: "Content Management",
        items: [
          {
            label: "Guides",
            href: "/admin/guides",
            icon: BookText,
          },
          {
            label: "Guide Translation",
            href: "/admin/guides/translate",
            icon: Languages,
          },
          {
            label: "Routes",
            href: "/admin/routes-migrate",
            icon: MapIcon,
          },
          {
            label: "Route Translation",
            href: "/admin/routes/translate",
            icon: Languages,
          },
          {
            label: "Tools",
            href: "/admin/tools",
            icon: Wrench,
          },
        ],
      }
    : null;

  const menuSections: MenuSection[] = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/workspace", icon: LayoutDashboard },
      ],
    },
    {
      title: "Marketing Studio",
      items: [
        {
          label: "Auto Posting",
          href: "/workspace/marketing/auto-posting",
          icon: Megaphone,
          requiresPaid: true,
        },
        {
          label: "Insight Letter",
          href: "/workspace/marketing/insights",
          icon: Mail,
          requiresPaid: true,
        },
      ],
    },
    {
      title: "Business Assistant",
      items: [
        {
          label: "PPT Generator",
          href: "/workspace/productivity/ppt",
          icon: Presentation,
          requiresPaid: true,
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          label: "Billing & Credits",
          href: "/workspace/billing",
          icon: CreditCard,
          hideIfCannotManage: true,
        },
      ],
    },
  ];

  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/workspace/billing");
  };

  // Helper function to render a menu section
  const renderMenuSection = (section: MenuSection) => (
    <div key={section.title}>
      <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {section.title}
      </h3>
      <ul className="space-y-1">
        {section.items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      {/* Admin Dashboard Section */}
      {adminDashboardSection && renderMenuSection(adminDashboardSection)}
      
      {/* Content Management Section */}
      {contentManagementSection && renderMenuSection(contentManagementSection)}
      
      {/* Regular Menu Sections */}
      {menuSections.map((section) => (
        <div key={section.title}>
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => {
              // hideIfCannotManage handling
              if (item.hideIfCannotManage && !canManageBilling) {
                return null;
              }

              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isLocked = item.requiresPaid && !isPaidForLock;

              return (
                <li key={item.href}>
                  <Link
                    href={isLocked ? "#" : item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : isLocked
                        ? "cursor-not-allowed text-muted-foreground/50 opacity-60 hover:opacity-70"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={(e) => {
                      if (isLocked) {
                        handleLockedClick(e);
                      }
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="rounded border border-muted-foreground/20 px-2 py-0.5 text-xs text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                    {isLocked && <Lock className="h-3 w-3 shrink-0" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
