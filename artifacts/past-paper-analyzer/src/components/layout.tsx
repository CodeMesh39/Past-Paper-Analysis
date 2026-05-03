import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, FileText, Upload, Brain, BarChart, List, Calendar, HelpCircle, GraduationCap, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Home", icon: GraduationCap },
  { href: "/upload", label: "Upload Papers", icon: Upload },
  { href: "/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/analysis", label: "Analysis", icon: Brain },
  { href: "/dashboard", label: "Dashboard", icon: BarChart },
  { href: "/topics", label: "High-Yield Topics", icon: List },
  { href: "/planner", label: "Study Planner", icon: Calendar },
  { href: "/questions", label: "Practice Questions", icon: HelpCircle },
  { href: "/export", label: "Export", icon: Download },
];

const mobileNavItems = [
  { href: "/", label: "Home", icon: GraduationCap },
  { href: "/dashboard", label: "Dashboard", icon: BarChart },
  { href: "/topics", label: "Topics", icon: List },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/questions", label: "Questions", icon: HelpCircle },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar — desktop only */}
      <aside className="w-64 flex-shrink-0 border-r bg-card flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">PastPaper AI</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4 mr-3 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground text-center">PastPaper AI • Hackathon Edition</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="h-14 border-b bg-card flex items-center px-4 md:hidden flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center mr-2">
            <FileText className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-base tracking-tight">PastPaper AI</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50 flex items-center justify-around px-2 h-16 safe-area-pb">
          {mobileNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg min-w-[56px] transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
