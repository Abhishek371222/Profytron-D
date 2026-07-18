# VALIDATION_REPORT — API Audit Phase 1

## Global ValidationPipe

```json
{
  "source": "apps/api/src/app.setup.ts",
  "options": {
    "whitelist": true,
    "transform": true,
    "forbidNonWhitelisted": true
  },
  "note": "Global ValidationPipe applies to all body/query DTOs"
}
```

## DTO inventory

| Metric | Value |
|--------|------:|
| DTO files | 16 |

### Decorator counts

| Decorator | Count |
|-----------|------:|
| @IsOptional | 141 |
| @IsString | 85 |
| @IsNumber | 52 |
| @Min | 35 |
| @MaxLength | 27 |
| @IsEnum | 19 |
| @Max | 16 |
| @IsInt | 15 |
| @IsEmail | 10 |
| @IsBoolean | 9 |
| @MinLength | 6 |
| @Matches | 4 |
| @Type | 3 |
| @IsUrl | 2 |
| @IsUUID | 1 |
| @IsArray | 1 |
| @IsNotEmpty | 0 |
| @ValidateNested | 0 |

### Largest DTO files

| File | Bytes | Nested | Type() |
|------|------:|-------:|-------:|
| `apps/api/src/modules/users/dto/users.dto.ts` | 4411 | 0 | 1 |
| `apps/api/src/modules/strategies/dto/strategy.dto.ts` | 4136 | 0 | 0 |
| `apps/api/src/modules/marketplace/dto/marketplace.dto.ts` | 3523 | 0 | 0 |
| `apps/api/src/modules/auth/dto/auth.dto.ts` | 3133 | 0 | 0 |
| `apps/api/src/modules/wallet/dto/wallet.dto.ts` | 1709 | 0 | 1 |
| `apps/api/src/modules/support/dto/support.dto.ts` | 1433 | 0 | 0 |
| `apps/api/src/modules/trading/dto/trade-actions.dto.ts` | 1127 | 0 | 0 |
| `apps/api/src/modules/strategy-builder/dto/builder.dto.ts` | 1055 | 0 | 0 |
| `apps/api/src/modules/copy/dto/copy.dto.ts` | 943 | 0 | 0 |
| `apps/api/src/modules/ai-risk/dto/risk-policy.dto.ts` | 852 | 0 | 0 |
| `apps/api/src/modules/journal/dto/journal.dto.ts` | 757 | 0 | 0 |
| `apps/api/src/modules/payments/dto/razorpay.dto.ts` | 633 | 0 | 0 |
| `apps/api/src/modules/ai/dto/explain-trade.dto.ts` | 585 | 0 | 0 |
| `apps/api/src/modules/broker/dto/broker.dto.ts` | 556 | 0 | 0 |
| `apps/api/src/modules/search/dto/global-search.dto.ts` | 274 | 0 | 1 |

## Live validation probes

- `POST /v1/auth/login` → status **400** (51.3 ms) keys=["success","statusCode","error","code","timestamp","path"]
- `POST /v1/auth/register` → status **400** (9 ms) keys=["success","statusCode","error","code","timestamp","path"]
