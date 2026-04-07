# YuGoDa — Coding Standards & Architecture Rules

> This file defines the architectural rules for the project. Claude and all team members must follow these rules.
> Read and update this file before adding a new pattern or changing an existing structure.

---

## Project Structure

```
apps/
  frontend/src/
    app/
      layouts/         → Role-based layouts (CustomerLayout, AdminLayout, RestaurantLayout)
      store/           → Zustand store slices (authSlice, cartSlice, uiSlice)
    components/
      layout/          → Header, Sidebar (shared across all panels)
      shared/          → Card, StatusBadge, StatCard (shared UI components)
      *.tsx            → Specialized components (CartDrawer, FilterPanel, etc.)
    hooks/             → Custom hooks (useBags, useCountdown, etc.)
    lib/
      api.ts           → Centralized API client (SINGLE point of API communication)
      constants.ts     → All constants (colors, status configs, magic numbers)
      formatters.ts    → Currency/date formatting (TL, formatDate)
      firebase.ts      → Firebase config
      i18n.ts          → Translation system
    pages/             → Page components (CustomerApp, StorePage, auth pages)
      admin/           → Admin panel tabs
      restaurant/      → Restaurant panel tabs
    types/
      index.ts         → ALL TypeScript types (SINGLE source of truth)
      schema.ts        → Domain schemas
  backend/src/main/java/yugoda/
    controller/        → REST endpoints (extend BaseController)
    service/           → Business logic
    repository/        → JPA repositories
    model/             → Entity classes
    security/          → JWT, auth filter
    util/              → EntityEnricher, helper classes
```

---

## Core Rules

### 1. DRY — Don't Repeat Yourself

| Rule | Correct | Wrong |
|------|---------|-------|
| Currency formatting | `import { TL } from '@/lib/formatters'` | `const TL = (n) => ...` local definition |
| Status colors | `import { STATUS_CONFIG } from '@/lib/constants'` | Inline class strings |
| Card styling | Use `<Card>` component | Repeating `bg-white dark:bg-[#111] rounded-2xl...` |
| Day names | `import { DAY_NAMES } from '@/lib/constants'` | `['Mon', 'Tue', ...]` inline array |
| Font styles | `import { FONT_PLAYFAIR } from '@/lib/constants'` | `fontFamily: "Playfair..."` in every file |

**Rule:** If the same value/function is written a 2nd time → move it to `lib/constants.ts` or `lib/formatters.ts`.

### 2. Single Source of Truth

- **Types:** All TypeScript interfaces are defined in `types/index.ts`. No type definitions in other files.
- **API calls:** Only through `lib/api.ts`. No direct `fetch()` in any component.
- **Constants:** All magic numbers, colors, configs in `lib/constants.ts`. No hardcoded values.
- **Status values:** Frontend and backend use the same status strings: `pending | confirmed | preparing | ready | picked_up | delivering | delivered | cancelled`

### 3. Modular Architecture

- **Shared components** live in `components/shared/`. No common components defined elsewhere.
- **Page-specific components** can stay in their page file, BUT if used in 2+ pages → move to `shared/`.
- **Hooks** go in `hooks/` directory. No inline hook definitions inside pages (simple `useState` is fine).
- **Backend:** Every controller extends `BaseController`. Enrichment logic goes through `EntityEnricher`.

---

## Frontend Rules

### Component Import Standards

```typescript
// ✅ CORRECT: Import from shared components
import { Card, StatusBadge, StatCard } from '@/components/shared';
import { TL } from '@/lib/formatters';
import { COLORS, STATUS_CONFIG } from '@/lib/constants';
import type { Order, UserProfile } from '@/types';

// ❌ WRONG: Import components exported from another page
import { StatusBadge, TL } from '@/pages/restaurant/StorePanel';
```

### Styling Rules

- Repeated Tailwind class groups → extract as `components/shared/` component
- Brand colors are never written directly → use `COLORS.forest` or Tailwind theme
- Dark mode must always be supported: the `bg-white dark:bg-[#111]` pattern is handled by `<Card>`

### State Management

- Global state → Zustand store slices (`authSlice`, `cartSlice`, `uiSlice`)
- Page-local state → `useState` (acceptable)
- If the same state is needed in 2+ components → move to Zustand
- No type definitions in store slices → import from `types/index.ts`

### API Calls

```typescript
// ✅ CORRECT
import { api } from '@/lib/api';
const data = await api.get('/orders/my');

// ❌ WRONG
const res = await fetch('http://localhost:8080/api/orders/my', { headers: ... });
```

### Translation (i18n)

- All user-facing text must be wrapped with `t()`
- When adding a new key, add it to BOTH `en` and `tr` objects in `lib/i18n.ts`
- No hardcoded Turkish/English strings in components

---

## Backend Rules

### Controller Standards

```java
// ✅ CORRECT: Extend BaseController, use EntityEnricher
@RestController
@RequestMapping("/api/orders")
public class OrderController extends BaseController {
    @Autowired private EntityEnricher enricher;
    
    // For enrichment:
    Map<String, Object> map = enricher.enrichOrder(order);
}

// ❌ WRONG: Each controller with its own enrichment method
private Map<String, Object> enrichOrder(Order order) { ... }
```

### Response Format

All API responses use a consistent format:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

### Model Changes

- When adding a new field that requires migration → update `schema.sql`
- Fields stored as JSON strings in entities (items, addresses, etc.) are parsed during enrichment
- Booleans are stored as Integer (0/1) and converted to boolean during enrichment

---

## Anti-Patterns (DO NOT)

1. **Export a component from one page to use in another** → move to `shared/`
2. **Use magic numbers/strings** → add to `constants.ts`
3. **Define a type in multiple places** → `types/index.ts` is the only source
4. **Use inline fetch calls** → use `api.ts`
5. **Repeat the same Tailwind class group 3+ times** → extract a component
6. **Repeat the same auth check in every controller** → use filter/interceptor
7. **Leave untranslated hardcoded text** → wrap with `t()`
8. **Leave console.log in production code** → clean up after development
9. **Use `any` type** → import the correct type from `types/index.ts`
10. **Create a new file without checking existing structure** → read first, write second

---

## Change Process

1. Read this file before making any changes
2. Read affected files and understand existing patterns
3. If a shared component/utility exists, use it. If not, create one and document it here
4. Run `npx tsc --noEmit` for type checking
5. If the change introduces a new pattern → update this file

---

## Team Note

This is the project's 3rd refactoring attempt. Previous attempts failed because rules were not documented and everyone used different patterns. This file is the project's constitution — every change must comply with these rules.
