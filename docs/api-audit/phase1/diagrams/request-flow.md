# Request flow

```mermaid
flowchart LR
  Client --> Guards --> Pipes --> Controller --> Service --> Prisma --> DB[(Neon)]
  Service --> Redis
  Controller --> Interceptors --> Client
```
