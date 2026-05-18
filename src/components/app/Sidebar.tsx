import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Sparkles, Megaphone, Users, Contact, Star, Shield,
  BarChart3, Layers, Atom, ChevronLeft, Zap, CreditCard, FileText, Plug, Globe
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { group: "Setup", items: [
    { to: "/dashboard/brand-dna-setup", label: "Brand DNA", icon: Plug, badge: "Start" },
    { to: "/dashboard/website-analysis", label: "Website Analysis", icon: Globe },
  ]},
  { group: "AI Tools", items: [
    { to: "/dashboard/brand-guideline", label: "Brand Guideline Generator", icon: FileText, badge: "New" },
  ]},
  { group: "Intelligence", items: [
    { to: "/dashboard/intelligence", label: "Brand Intelligence", icon: Brain },
    { to: "/dashboard/audience", label: "Audience Intelligence", icon: Users },
    { to: "/dashboard/reputation", label: "Reputation & Listening", icon: Shield },
  ]},
  { group: "Execution", items: [
    { to: "/dashboard/creative", label: "Creative Engine", icon: Sparkles },
    { to: "/dashboard/campaigns", label: "Campaign Automation", icon: Megaphone },
    { to: "/dashboard/influencers", label: "Influencer OS", icon: Star },
  ]},
  { group: "Growth", items: [
    { to: "/dashboard/crm", label: "Lead & CRM", icon: Contact },
    { to: "/dashboard/analytics", label: "Unified Analytics", icon: BarChart3 },
    { to: "/dashboard/simulation", label: "Simulation Engine", icon: Atom },
  ]},
  { group: "Workspace", items: [
    { to: "/dashboard/collaboration", label: "Collaboration", icon: Layers },
    { to: "/dashboard/billing", label: "Billing & Plans", icon: CreditCard },
  ]},
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 264 }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      className="sticky top-0 h-screen shrink-0 border-r border-white/5 bg-[#0a0d16]/80 backdrop-blur-xl z-30"
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center glow-primary">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-semibold text-sm">BrandSync <span className="text-indigo-400">AI</span></div>
              <div className="text-[10px] text-muted-foreground tracking-wider uppercase">Marketing OS</div>
            </div>
          )}
        </Link>
        <button onClick={() => setCollapsed(c => !c)} className="text-muted-foreground hover:text-foreground transition">
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="px-2 py-4 space-y-5 overflow-y-auto h-[calc(100vh-4rem)]">
        {NAV.map((g) => (
          <div key={g.group}>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-3 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground/70"
                >
                  {g.group}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="space-y-1">
              {g.items.map((it) => {
                const Icon = it.icon;
                const active = path === it.to;
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                      active
                        ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white border border-indigo-400/30"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="navdot"
                        className="absolute -left-0.5 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500"
                      />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0", active && "text-indigo-300")} />
                    {!collapsed && (
                      <span className="truncate flex-1 flex items-center gap-2">
                        {it.label}
                        {"badge" in it && it.badge && (
                          <span className="ml-auto rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-white font-semibold">{it.badge}</span>
                        )}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </motion.aside>
  );
}
