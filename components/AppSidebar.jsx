"use client";

import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";
import pustidharaLogo from "@/public/logo.png";
import {
  BadgeDollarSign,
  Box,
  Boxes,
  ShoppingCartIcon as CartPlus,
  ChevronDown,
  Database,
  DollarSign,
  Home,
  List,
  PieChart,
  Shield,
  User,
  Users,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

export default function AppSidebar() {
  const pathname = usePathname();

  const isActive = (url) => {
    return pathname === url;
  };

  const sidebarItems = [
    // Standalone items
    {
      type: "item",
      title: "Home",
      url: "/",
      icon: Home,
    },
    // Groups
    {
      type: "group",
      title: "Customer Entries",
      items: [
        {
          title: "All Customer Entries",
          url: "/entries/customer/all",
          icon: Database,
        },
        {
          title: "Add Customer Entry",
          url: "/entries/customer/add",
          icon: CartPlus,
        },
      ],
    },
    {
      type: "group",
      title: "Vendor Entries",
      items: [
        {
          title: "All Vendor Entries",
          url: "/entries/vendor/all",
          icon: Database,
        },
        {
          title: "Add Vendor Entry",
          url: "/entries/vendor/add", // Fixed the URL here
          icon: CartPlus,
        },
      ],
    },
    {
      type: "group",
      title: "Customers",
      items: [
        {
          title: "All Customers",
          url: "/customers/all",
          icon: Users,
        },
        {
          title: "Add Customer",
          url: "/customers/add",
          icon: User,
        },
      ],
    },
    {
      type: "group",
      title: "Vendors",
      items: [
        {
          title: "All Vendors",
          url: "/vendors/all",
          icon: Users,
        },
        {
          title: "Add Vendor",
          url: "/vendors/add",
          icon: User,
        },
      ],
    },
    {
      type: "group",
      title: "Products",
      items: [
        {
          title: "All Products",
          url: "/products/all",
          icon: Boxes,
        },
        {
          title: "Add Product",
          url: "/products/add",
          icon: Box,
        },
      ],
    },
    {
      type: "group",
      title: "Expenses",
      items: [
        {
          title: "All Expenses",
          url: "/expenses/all",
          icon: BadgeDollarSign,
        },
        {
          title: "Add Expense",
          url: "/expenses/add",
          icon: DollarSign,
        },
      ],
    },
    // More standalone items
    {
      type: "item",
      title: "Analytics",
      url: "/analytics",
      icon: PieChart,
    },
    {
      type: "item",
      title: "Fraud Checker",
      url: "/fraud-checker",
      icon: Shield,
    },
    {
      type: "item",
      title: "Courier List",
      url: "/courier-list",
      icon: List,
    },
  ];

  return (
    <Sidebar className="select-none pt-16">
      <SidebarContent className="scrollbar-none">
        <SidebarMenu className="px-3 flex flex-col gap-4">
          {sidebarItems.map((item, index) => {
            if (item.type === "item") {
              return (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            } else if (item.type === "group") {
              // Determine if any child is active
              const isGroupActive = item.items.some((subItem) =>
                isActive(subItem.url)
              );
              return (
                <Collapsible
                  defaultOpen={isGroupActive}
                  className="group/collapsible"
                  key={index}
                  asChild
                >
                  <SidebarMenuItem className="flex flex-col gap-2">
                    <CollapsibleTrigger asChild>
                      <div
                        className="flex items-center justify-between gap-3 w-full cursor-pointer"
                        role="button"
                        aria-expanded={isGroupActive}
                      >
                        {item.title}
                        <ChevronDown
                          size={18}
                          className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem, subIndex) => (
                          <SidebarMenuSubItem key={subIndex}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(subItem.url)}
                            >
                              <a href={subItem.url}>
                                <subItem.icon className="h-4 w-4" />
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
