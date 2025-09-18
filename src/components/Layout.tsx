import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Leaf } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  // Always show authenticated layout with sidebar (no auth required)
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-eco">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-card/50 backdrop-blur-sm px-4">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">Green Campus Carbon Tracker</h1>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}