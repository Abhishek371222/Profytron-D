# Layout Shells

```mermaid
flowchart TB
  root[app/layout.tsx]
  root --> marketing[Marketing / legal pages]
  root --> publicAuth["(public) auth shell"]
  root --> dashboard["(dashboard) AppShell"]
  root --> admin[admin/ layout]
  marketing --> pubNav[PublicNavbar + footer]
  publicAuth --> authPages[login register onboarding]
  dashboard --> side[Sidebar + TopBar]
  dashboard --> bottomNav[Mobile bottom nav below lg]
  admin --> adminSide[Admin sidebar]
```

| Shell | Routes | Chrome |
| --- | --- | --- |
| marketing | `/`, `/pricing`, `/about`, legal, docs, blog | Public navbar/footer |
| auth | `/login`, `/register`, onboarding, password flows | Minimal providers |
| dashboard | Authenticated app including marketplace | AppShell; sidebar collapses `< lg` |
| admin | `/admin/*` | Separate admin shell |
