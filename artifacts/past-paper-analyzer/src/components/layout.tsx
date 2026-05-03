import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, FileText, Upload, Brain, BarChart, List, Calendar, HelpCircle, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: GraduationCap },
    { href: "/upload", label: "Upload Papers", icon: Upload },
    { href: "/syllabus", label: "Syllabus", icon: BookOpen },
    { href: "/analysis", label: "Analysis", icon: Brain },
    { href: "/dashboard", label: "Dashboard", icon: BarChart },
    { href: "/topics", label: "High-Yield Topics", icon: List },
    { href: "/planner", label: "Study Planner", icon: Calendar },
    { href: "/questions", label: "Practice Questions", icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r bg-card flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b">
          <FileText className="w-6 h-6 mr-2 text-primary" />
          <span className="font-bold text-lg tracking-tight">PastPaper AI</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 border-b bg-card flex items-center px-4 md:hidden">
          <FileText className="w-6 h-6 mr-2 text-primary" />
          <span className="font-bold text-lg tracking-tight">PastPaper AI</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
