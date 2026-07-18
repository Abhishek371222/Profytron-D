# SERVICE_MAP — API Audit Phase 1

## Controllers → injected types

| Controller | Module | Injects |
|------------|--------|---------|
| AppController | app | AppService, PrismaService, RedisService, TradingGateway |
| AdminController | admin | AdminService, TradingService, StrategyDocumentsService, WalletService, UsersService |
| AffiliatesController | affiliates | AffiliatesService, JwtService, ConfigService |
| AgentsController | agents | PrismaService, AgentEventService, AgentOutboxPoller, RedisService |
| AIController | ai | AIService |
| AiRiskController | ai-risk | AiRiskService |
| AnalyticsController | analytics | AnalyticsService |
| ApiKeysController | api-keys | ApiKeysService |
| AuthController | auth | AuthService, TwoFaService |
| AccountSnapshotController | broker | AccountSnapshotService |
| BrokerController | broker | BrokerService |
| CoachController | coach | CoachService |
| CopyController | copy | CopyTradingService |
| CopyBridgeController | copy-bridge | CopyBridgeService |
| FeatureFlagsController | feature-flags | FeatureFlagsService |
| GrowthController | growth | ActivationService |
| JournalController | journal | TradingJournalService |
| LeaderboardController | leaderboard | LeaderboardService |
| MarketController | market | MarketService |
| MarketplaceController | marketplace | MarketplaceService |
| NotificationsController | notifications | NotificationsService, FcmService |
| PaymentsController | payments | PaymentsService |
| RazorpayController | payments | PaymentsService |
| PlansController | plans | — |
| SearchController | search | SearchService |
| StrategiesController | strategies | StrategiesService, StrategyDocumentsService |
| StrategyBuilderController | strategy-builder | StrategyBuilderService, BacktestService, StrategiesService |
| SubscriptionsController | subscriptions | PaymentsService |
| SupportController | support | SupportService |
| TelegramController | telegram | TelegramBotService |
| TradingController | trading | TradingService |
| TutorialController | tutorial | TutorialService |
| UsersController | users | UsersService, EmailService |
| VpsController | vps | VpsService |
| WalletController | wallet | WalletService |

## Largest services (LOC)

| Service | Lines | prisma.* | redis refs |
|---------|------:|---------:|-----------:|
| PaymentsService | 1657 | 46 | 10 |
| AuthService | 1491 | 38 | 41 |
| AccountHistorySyncService | 1324 | 13 | 1 |
| StrategiesService | 1269 | 35 | 14 |
| AnalyticsService | 1191 | 10 | 19 |
| MarketplaceService | 1064 | 36 | 6 |
| AdminService | 1011 | 50 | 0 |
| CoachService | 996 | 46 | 0 |
| BrokerService | 974 | 42 | 0 |
| WalletService | 931 | 21 | 5 |
| TradingService | 876 | 19 | 0 |
| AffiliatesService | 810 | 24 | 0 |
| AIService | 702 | 4 | 9 |
| MarketService | 673 | 0 | 9 |
| AgentExecutorService | 649 | 8 | 3 |
