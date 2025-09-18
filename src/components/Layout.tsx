import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { getCurrentUser } from "@/lib/storage";
import { Leaf } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    // Show public layout for non-authenticated users
    return (
      <div className="min-h-screen bg-gradient-eco">
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-campus">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">Green Campus</h1>
                <p className="text-xs text-muted-foreground">Carbon Footprint Tracker</p>
              </div>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    );
  }

  // Show authenticated layout with sidebar
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