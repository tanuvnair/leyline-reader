import {NavLink, Outlet, useLocation} from 'react-router-dom';
import {
  CastleTurretIcon,
  DiamondsFourIcon,
  FlaskIcon,
  GearIcon,
  SignOutIcon,
  SquaresFourIcon,
  SwordIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import {ScrollArea} from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {useAuth} from '@/hooks/use-auth';
import {GoodInventoryProvider} from '@/hooks/use-good-inventory';
import {CharacterRosterProvider} from '@/hooks/use-character-roster';
import {HoyoAccountProvider} from '@/hooks/use-hoyo-account';

const navItems = [
  {to: '/', label: 'Overview', icon: SquaresFourIcon, end: true},
  {to: '/characters', label: 'Characters', icon: UsersIcon, end: false},
  {to: '/artifacts', label: 'Artifacts', icon: DiamondsFourIcon, end: false},
  {to: '/weapons', label: 'Weapons', icon: SwordIcon, end: false},
  {to: '/materials', label: 'Materials', icon: FlaskIcon, end: false},
  {to: '/abyss', label: 'Abyss', icon: CastleTurretIcon, end: false},
  {to: '/settings', label: 'Settings', icon: GearIcon, end: false},
] as const;

export function AppShell() {
  const {lock} = useAuth();
  const location = useLocation();

  return (
    <HoyoAccountProvider>
      <CharacterRosterProvider>
        <GoodInventoryProvider>
          <div className="flex min-h-0 flex-1 items-stretch app-atmosphere">
            <SidebarProvider>
              <Sidebar collapsible="none">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {navItems.map((item) => {
                          const active = item.end
                            ? location.pathname === item.to
                            : location.pathname.startsWith(item.to);
                          return (
                            <SidebarMenuItem key={item.to}>
                              <SidebarMenuButton asChild isActive={active}>
                                <NavLink to={item.to} end={item.end}>
                                  <item.icon />
                                  <span>{item.label}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        variant="destructive"
                        onClick={() => void lock()}
                      >
                        <SignOutIcon />
                        <span>Lock app</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarFooter>
              </Sidebar>
              <SidebarInset>
                {/*
                  Wrapper owns flex height; *:size-full fills ScrollArea (lint forbids
                  className on ScrollArea). Do not put flex-1 on the padded child:
                  Chromium omits that child's padding-bottom from scroll height.
                  min-h-full alone still lets AccountGate center when content is short.
                */}
                <div className="h-0 min-h-0 flex-1 *:size-full">
                  <ScrollArea>
                    <div className="flex min-h-full w-full flex-col p-8">
                      <Outlet />
                    </div>
                  </ScrollArea>
                </div>
              </SidebarInset>
            </SidebarProvider>
          </div>
        </GoodInventoryProvider>
      </CharacterRosterProvider>
    </HoyoAccountProvider>
  );
}
