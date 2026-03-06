"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOrganizations } from "@/auth";
import { Header } from "@/components/Header";

interface OrganizationLayoutProps {
  organization: any;
  user: any;
  children: React.ReactNode;
}

export function OrganizationLayout({
  organization,
  user,
  children,
}: OrganizationLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: organizations } = useOrganizations();
  const orgsList = organizations?.data || organizations || [];
  useEffect(() => {
    const handleOrganizationChange = () => {
      const savedOrgId = localStorage.getItem("selectedOrganization");
      if (savedOrgId && savedOrgId !== organization.id) {
        const newOrg = Array.isArray(orgsList)
          ? orgsList.find((org: any) => org.id === savedOrgId)
          : null;
        if (newOrg) {
          router.push(`/org/${newOrg.slug}`);
        }
      }
    };

    window.addEventListener("organizationChanged", handleOrganizationChange);
    return () => {
      window.removeEventListener("organizationChanged", handleOrganizationChange);
    };
  }, [organization.id, router, orgsList]);
  const pathParts = pathname.split("/");
  const isClanRoute = pathParts.length > 3 && 
    pathParts[3] !== "clans" && 
    pathParts[3] !== "new" && 
    pathParts[3] !== "subscription" &&
    pathParts[3] !== "members" &&
    pathParts[3] !== "settings";
  if (isClanRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </div>
    </>
  );
}

