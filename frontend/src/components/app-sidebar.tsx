import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/layout/sidebar";
import {
  Home,
  Users,
  CreditCard,
  Building2,
  Tag,
  MessageSquare,
  Gift,
  Store,
  Activity,
  Database,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

// Navigation menu based on the plan models
const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Data Management",
    items: [
      {
        title: "Users",
        url: "/users",
        icon: Users,
      },
      {
        title: "Cards",
        url: "/cards",
        icon: CreditCard,
      },
      {
        title: "Banks",
        url: "/banks",
        icon: Building2,
      },
      {
        title: "Brands",
        url: "/brands",
        icon: Tag,
      },
      {
        title: "Categories",
        url: "/categories",
        icon: Database,
      },
      {
        title: "Comments",
        url: "/comments",
        icon: MessageSquare,
      },
      {
        title: "Offers",
        url: "/offers",
        icon: Gift,
      },
      {
        title: "Stores",
        url: "/stores",
        icon: Store,
      },
      {
        title: "Tracking",
        url: "/tracking",
        icon: Activity,
      },
    ],
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Database className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">SaveApp</span>
              <span className="truncate text-xs">Admin Panel</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((section, index) => (
          <SidebarGroup key={index}>
            {section.items ? (
              <>
                <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <a href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </>
            ) : (
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href={section.url}>
                        <section.icon />
                        <span>{section.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 text-xs text-muted-foreground">
          SaveApp Admin Panel v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
