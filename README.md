# @xhiti/auto-skeleton

> **A runtime React component that transforms your actual UI into pixel-perfect, responsive skeleton loaders automatically.** No more writing duplicate JSX for loading states!

[![npm version](https://img.shields.io/npm/v/@xhiti/auto-skeleton.svg)](https://www.npmjs.com/package/@xhiti/auto-skeleton)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@xhiti/auto-skeleton)](https://bundlephobia.com/package/@xhiti/auto-skeleton)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## Why @xhiti/auto-skeleton?

Traditional skeleton loaders require you to:

- ❌ **Write duplicate JSX** — Create a separate skeleton version of every component
- ❌ **Maintain two layouts** — Every UI change requires updating both real and skeleton versions
- ❌ **Guess dimensions** — Skeleton heights are often hardcoded, breaking responsive layouts

**@xhiti/auto-skeleton solves all of this** with **"Ghost Rendering"** — it wraps your actual component and transforms it into a skeleton at runtime, preserving **exact dimensions** on every screen size.

```tsx
// ❌ Before: Hundreds of lines of duplicate skeleton JSX
if (loading) return <MySkeleton />;
return <MyComponent data={data} />;

// ✅ After: Zero-maintenance, pixel-perfect skeletons
<AutoSkeleton isLoading={loading}>
  <MyComponent data={data} />
</AutoSkeleton>
```

## Features

| Feature | Description |
|---------|-------------|
| 🎯 **Pixel-Perfect** | Uses your actual rendered content dimensions — no layout shifts |
| 🔄 **Zero Maintenance** | One source of truth for your UI |
| 🌗 **Dark/Light Mode** | Automatic support via shadcn/ui CSS variables (`bg-muted`) |
| 📊 **Table Support** | Handles strict table DOM structure (`<table>`, `<tr>`, `<td>`) |
| 🎨 **3 Animation Variants** | Pulse, Shimmer, and Wave animations |
| 🔍 **Icon Detection** | Auto-detects `lucide-react`, Heroicons, Radix Icons, and SVGs |
| 📝 **Form Elements** | Auto-skeletons inputs, textareas, and selects |
| 🏷️ **Badge & Avatar** | Detects shadcn Badge, Avatar, and similar components |
| 🔗 **Link Handling** | Disables navigation on links during loading |
| 🎛️ **Customizable** | Override skeleton classes, border radius, animation timing |
| ♿ **Accessible** | `aria-busy`, `role="status"`, screen reader announcements |
| 🙈 **Opt-out Controls** | `data-skeleton-ignore`, `data-skeleton-hide`, `data-skeleton-class` |
| ⏱️ **Loading Hooks** | `useDelayedLoading`, `useMinimumLoadingTime`, `useAutoSkeleton` |
| 🧱 **Standalone Blocks** | `<SkeletonBlock>` and `<SkeletonText>` for manual use |
| ⚡ **Next.js Ready** | `"use client"` directive included, works with App Router |
| 🌳 **Tree-shakable** | Only import what you use |

---

## Installation

```bash
npm install @xhiti/auto-skeleton
# or
yarn add @xhiti/auto-skeleton
# or
pnpm add @xhiti/auto-skeleton
```

---

## Quick Start

```tsx
import { AutoSkeleton } from "@xhiti/auto-skeleton";

function UserProfile({ user, isLoading }) {
  return (
    <AutoSkeleton isLoading={isLoading}>
      <Card>
        <CardHeader>
          <CardTitle>{user?.name || "Placeholder Name"}</CardTitle>
          <CardDescription>{user?.email || "user@example.com"}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{user?.bio || "This is a placeholder bio text for the skeleton."}</p>
        </CardContent>
      </Card>
    </AutoSkeleton>
  );
}
```

That's it! When `isLoading` is `true`, the text becomes invisible with a pulsing background — maintaining the **exact same layout**.

---

## Tailwind CSS / shadcn Configuration

### 1. CSS Variables (Already Set by shadcn/ui)

Your `globals.css` should include the standard shadcn variables:

```css
@layer base {
  :root {
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    /* ... other variables */
  }

  .dark {
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    /* ... other dark mode variables */
  }
}
```

### 2. Tailwind Config

**No additional config needed!** The package uses `bg-muted` by default, which automatically uses your shadcn/ui theme.

### 3. Optional: Import Styles (for Shimmer/Wave animations)

If you want to use the `shimmer` or `wave` animation variants, import the optional stylesheet:

```tsx
// In your layout.tsx or _app.tsx
import "@xhiti/auto-skeleton/styles.css";
```

> **Note:** The default `pulse` animation uses Tailwind's built-in `animate-pulse` and requires no extra imports.

---

## API Reference

### `<AutoSkeleton />` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isLoading` | `boolean` | **Required** | Whether to show skeleton state |
| `children` | `ReactNode` | **Required** | Content to transform |
| `className` | `string` | — | Optional wrapper class |
| `style` | `CSSProperties` | — | Optional wrapper styles |
| `animate` | `boolean` | `true` | Enable/disable animation |
| `animationVariant` | `"pulse" \| "shimmer" \| "wave" \| "none"` | `"pulse"` | Animation style |
| `animationDuration` | `string` | `"1.5s"` | Animation duration (CSS time) |
| `borderRadius` | `"sm" \| "md" \| "lg" \| "full" \| "none"` | `"md"` | Border radius for skeleton shapes |
| `forceWrapper` | `boolean` | `false` | Always wrap in a `<div>` even when not loading |
| `persistentChildren` | `ReactNode` | — | Children to always render (even during loading) |
| `skeletonBgClass` | `string` | `"bg-muted"` | Background class for skeleton |
| `textMaskClass` | `string` | `"text-transparent bg-muted select-none"` | Text masking classes |
| `imageMaskClass` | `string` | `"bg-muted"` | Image placeholder classes |
| `buttonMaskClass` | `string` | `"relative overflow-hidden"` | Button overlay classes |
| `iconMaskClass` | `string` | `"text-transparent bg-muted/50"` | Icon masking classes |
| `inputMaskClass` | `string` | `"bg-muted border-muted"` | Form field masking classes |
| `badgeMaskClass` | `string` | `"bg-muted text-transparent"` | Badge/chip masking classes |
| `avatarMaskClass` | `string` | `"bg-muted"` | Avatar masking classes |

---

### Data Attributes

Control skeleton behavior on individual elements:

| Attribute | Effect |
|-----------|--------|
| `data-skeleton-ignore="true"` | Don't style this element, but **still recurse** into its children |
| `data-skeleton-hide="true"` | **Completely remove** this element during loading |
| `data-skeleton-class="..."` | Apply **custom classes** instead of default skeleton styling |

```tsx
<AutoSkeleton isLoading={loading}>
  {/* This div won't pulse, but its children will */}
  <div data-skeleton-ignore="true" className="grid grid-cols-2">
    <Card>
      <CardTitle>{data.title}</CardTitle>
    </Card>
  </div>

  {/* This button is completely hidden during loading */}
  <button data-skeleton-hide="true" onClick={handleDelete}>
    Delete
  </button>

  {/* Custom skeleton class for this element */}
  <div data-skeleton-class="bg-blue-200 animate-bounce rounded-full">
    Custom skeleton
  </div>
</AutoSkeleton>
```

---

### Hooks

#### `useAutoSkeleton(initialState?: boolean)`

Manages loading state with error tracking and async helper.

```tsx
import { AutoSkeleton, useAutoSkeleton } from "@xhiti/auto-skeleton";

function DataComponent() {
  const { isLoading, error, withLoading, reset } = useAutoSkeleton(true);

  useEffect(() => {
    withLoading(fetchMyData());
  }, []);

  if (error) return <ErrorMessage error={error} onRetry={reset} />;

  return (
    <AutoSkeleton isLoading={isLoading}>
      <MyContent />
    </AutoSkeleton>
  );
}
```

#### `useDelayedLoading(isLoading: boolean, delay?: number)`

Only shows skeleton if loading takes longer than `delay` ms. Prevents flash-of-skeleton for fast responses.

```tsx
const [loading, setLoading] = useState(true);
const showSkeleton = useDelayedLoading(loading, 300);

return (
  <AutoSkeleton isLoading={showSkeleton}>
    <Content />
  </AutoSkeleton>
);
```

#### `useMinimumLoadingTime(isLoading: boolean, minTime?: number)`

Ensures skeleton is shown for at least `minTime` ms. Prevents jarring flash when data loads too quickly.

```tsx
const [loading, setLoading] = useState(true);
const showSkeleton = useMinimumLoadingTime(loading, 800);

return (
  <AutoSkeleton isLoading={showSkeleton}>
    <Content />
  </AutoSkeleton>
);
```

---

### Standalone Components

For cases where you need a simple skeleton placeholder without wrapping real content:

#### `<SkeletonBlock />`

```tsx
import { SkeletonBlock } from "@xhiti/auto-skeleton";

<SkeletonBlock width="100%" height="24px" borderRadius="md" />
<SkeletonBlock width={200} height={20} className="my-4" />
```

#### `<SkeletonText />`

```tsx
import { SkeletonText } from "@xhiti/auto-skeleton";

<SkeletonText lines={3} lastLineWidth="75%" />
<SkeletonText lines={1} width="60%" lineHeight="1.5rem" />
```

---

## How It Works

### Ghost Rendering

Instead of replacing your content with separate skeleton components, AutoSkeleton:

1. **Traverses** the React element tree using `React.Children.map`
2. **Clones** each element with `React.cloneElement` and modified props
3. **Applies CSS masking** to hide content while preserving dimensions

This approach ensures:
- ✅ Text keeps its natural line-breaking
- ✅ Images maintain their aspect ratio
- ✅ Layout doesn't shift between loading and loaded states
- ✅ Dark/Light mode works automatically

### Element Type Handling

| Element Type | Transformation |
|-------------|---------------|
| **Text nodes** | Wrapped in `<span>` with `text-transparent bg-muted animate-pulse` |
| **Images** (`<img>`, `next/image`) | `src` replaced with transparent pixel, `bg-muted` applied |
| **Videos/iframes** | Source hidden, muted background applied |
| **Buttons** | Disabled, overlay with muted background |
| **Avatars** | Circular muted placeholder |
| **Badges/chips** | Muted background with transparent text |
| **Icons** (lucide, SVG, etc.) | Transparent color with muted background |
| **Form inputs** | Disabled, readonly, muted background |
| **Links** | Navigation disabled, children recursed |
| **Separators** | Muted background applied |
| **Table cells** | Text inside `<td>`/`<th>` is masked |
| **Everything else** | Children are recursively processed |

---

## Advanced Examples

### Complex Dashboard with shadcn/ui

```tsx
"use client";

import { AutoSkeleton, useAutoSkeleton } from "@xhiti/auto-skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Activity, Star } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const { isLoading, withLoading } = useAutoSkeleton(true);

  useEffect(() => {
    withLoading(fetch("/api/dashboard").then((r) => r.json()).then(setData));
  }, []);

  return (
    <AutoSkeleton isLoading={isLoading} animationVariant="shimmer">
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+2,350</div>
              <p className="text-xs text-muted-foreground">+180.1% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* User Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.users || placeholderUsers).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.status}</Badge>
                    </TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" data-skeleton-hide="true">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AutoSkeleton>
  );
}
```

### Animation Variants

```tsx
// Default pulse (no extra CSS import needed)
<AutoSkeleton isLoading={true} animationVariant="pulse">
  <Content />
</AutoSkeleton>

// Shimmer effect (requires styles.css import)
<AutoSkeleton isLoading={true} animationVariant="shimmer">
  <Content />
</AutoSkeleton>

// Wave effect (requires styles.css import)
<AutoSkeleton isLoading={true} animationVariant="wave">
  <Content />
</AutoSkeleton>

// Static skeleton (no animation)
<AutoSkeleton isLoading={true} animationVariant="none">
  <Content />
</AutoSkeleton>
```

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

Requires **React 18+** and **Tailwind CSS**.

---

## Contributing

Contributions are welcome! Please read our [contributing guidelines](https://github.com/xhiti/auto-skeleton/blob/main/CONTRIBUTING.md).

## License

[MIT](./LICENSE) © xhiti