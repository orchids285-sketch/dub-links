import { MainNav } from "@/ui/layout/main-nav";
import { AppSidebarNav } from "@/ui/layout/sidebar/app-sidebar-nav";
import { HelpButton } from "@/ui/layout/sidebar/help-button";
import { NewsRSC } from "@/ui/layout/sidebar/news-rsc";
import { ReferButton } from "@/ui/layout/sidebar/refer-button";
import Toolbar from "@/ui/layout/toolbar/toolbar";
import { UpgradeBanner } from "@/ui/layout/upgrade-banner";
import { constructMetadata } from "@dub/utils";
import { ReactNode } from "react";

export const dynamic = "force-static";
export const metadata = constructMetadata();

export default async function Layout({ children }: { children: ReactNode }) {
  // De-branded self-host: no Dub upgrade banner, refer/help buttons, news, or onboarding toolbar.
  return (
    <div className="min-h-screen w-full bg-white">
      <MainNav sidebar={AppSidebarNav} toolContent={null} newsContent={null}>
        {children}
      </MainNav>
    </div>
  );
}
