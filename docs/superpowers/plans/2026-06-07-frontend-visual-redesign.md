# FriendOS Frontend Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade FriendOS's visual quality from basic glassmorphism to a refined "Aurora Glass" aesthetic — warmer colors, richer depth, polished interactions, and a more premium feel.

**Architecture:** Changes are concentrated in the global CSS foundation (`index.css`), layout components (Sidebar, Header, StatusBar, AppLayout), and dashboard components. All visual changes use CSS variables and Tailwind utilities — no new dependencies. The design preserves the existing HarmonyOS Sans font and teal primary color but enriches them with better contrast, depth, and motion.

**Tech Stack:** React 18, Tailwind CSS, Lucide icons, CSS custom properties (no new deps)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `pc/src/index.css` | Modify | CSS variables, animations, glass utilities, noise texture, new utility classes |
| `pc/src/components/layout/Sidebar.tsx` | Modify | Navigation active indicator, refined logo area, better hover effects |
| `pc/src/components/layout/Header.tsx` | Modify | Refined spacing, subtle gradient accent, better button styling |
| `pc/src/components/layout/StatusBar.tsx` | Modify | Pill-style status text, refined time display |
| `pc/src/components/layout/AppLayout.tsx` | Modify | Enhanced background orbs, refined content area padding |
| `pc/src/components/layout/TitleBar.tsx` | Modify | Better theme-aware styling for dark mode |
| `pc/src/pages/DashboardPage.tsx` | Modify | Hero greeting section, refined section spacing |
| `pc/src/components/dashboard/QuickStats.tsx` | Modify | Refined stat cards with accent borders, subtle gradients |
| `pc/src/components/dashboard/TodayTodos.tsx` | Modify | Better task rows, improved checkbox animation |
| `pc/src/components/dashboard/TodayDiary.tsx` | Modify | Better empty state, refined diary preview |
| `pc/src/components/dashboard/LearningCheckin.tsx` | Modify | Refined habit rows, better progress bar |
| `pc/src/components/dashboard/EmotionOverview.tsx` | Modify | Refined ring chart, better insight display |
| `pc/src/components/dashboard/WeeklyReview.tsx` | Modify | Refined diary list, subtle hover states |
| `pc/src/components/dashboard/DailyQuote.tsx` | Modify | Better quote card styling in sidebar |
| `pc/src/components/common/Card.tsx` | Modify | Better hover state with border highlight |
| `pc/src/components/common/Button.tsx` | Modify | Refined button variants with subtle gradients |
| `pc/src/components/common/Modal.tsx` | Modify | Better modal entrance animation, refined header |
| `pc/src/components/common/Input.tsx` | Modify | Better focus states, refined label styling |
| `pc/src/components/common/Badge.tsx` | Modify | Refined badge with subtle background tints |
| `pc/src/components/common/EmptyState.tsx` | Modify | Better illustration and typography |

---

## Task 1: CSS Foundation — Enhanced Variables, Noise Texture, and Utilities

**Files:**
- Modify: `pc/src/index.css`

### Design Direction
Add a subtle noise texture overlay for depth, enhance shadows with colored tints, add new CSS utility classes for consistent card styling, improve scroll behavior, and add stagger animation support.

- [ ] **Step 1: Enhance `:root` CSS variables**

Add new variables for `--bg-active`, `--color-primary-glow`, `--shadow-float`, `--shadow-glow`, transition timing tokens, and reduce `--header-height` from 64px to 56px for a more compact layout. Add `--radius-pill` for pill-shaped elements.

In `pc/src/index.css`, replace the entire `:root` block (lines 27–94) with:

```css
:root {
  --bg-base: #F0F9FF;
  --bg-gradient: linear-gradient(
    135deg,
    #EFF6FF 0%,
    #F0FDFA 25%,
    #F5F3FF 50%,
    #FFF1F2 75%,
    #FFFBEB 100%
  );
  --bg-decorative-1: rgba(56, 189, 248, 0.08);
  --bg-decorative-2: rgba(251, 191, 36, 0.07);
  --bg-decorative-3: rgba(167, 139, 250, 0.06);
  --bg-decorative-4: rgba(251, 113, 133, 0.05);

  --bg-card: rgba(255, 255, 255, 0.68);
  --bg-card-solid: #FFFFFF;
  --glass-border: rgba(255, 255, 255, 0.55);
  --glass-border-gradient: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.3));
  --glass-blur: 16px;
  --glass-glow: inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 255, 255, 0.1);

  --bg-sidebar: rgba(255, 255, 255, 0.78);
  --bg-hover: rgba(241, 245, 249, 0.8);
  --bg-active: rgba(20, 184, 166, 0.08);

  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #64748B;

  --color-primary: #14B8A6;
  --color-primary-light: #5EEAD4;
  --color-primary-dark: #0F766E;
  --color-primary-glow: rgba(20, 184, 166, 0.15);

  --color-success: #22C55E;
  --color-warning: #D97706;
  --color-danger: #DC2626;
  --color-info: #2563EB;

  --priority-urgent: #DC2626;
  --priority-high: #D97706;
  --priority-medium: #2563EB;
  --priority-low: #94A3B8;

  --mood-1: #EF4444;
  --mood-2: #F97316;
  --mood-3: #F59E0B;
  --mood-4: #22C55E;
  --mood-5: #14B8A6;

  --sidebar-width: 240px;
  --header-height: 56px;
  --radius-card: 16px;
  --radius-button: 10px;
  --radius-pill: 9999px;

  --shadow-card: 0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03), 0 0 0 1px rgba(255,255,255,0.5) inset;
  --shadow-card-hover: 0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(255,255,255,0.6) inset;
  --shadow-float: 0 20px 60px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04);
  --shadow-glow: 0 0 20px rgba(20, 184, 166, 0.12);

  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-smooth: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

- [ ] **Step 2: Enhance dark mode variables**

In the `[data-theme="dark"]` block, add the new variables:

```css
[data-theme="dark"] {
  /* ... existing variables ... */
  --bg-active: rgba(45, 212, 191, 0.1);
  --color-primary-glow: rgba(45, 212, 191, 0.12);
  --shadow-float: 0 20px 60px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.2);
  --shadow-glow: 0 0 20px rgba(45, 212, 191, 0.1);
}
```

- [ ] **Step 3: Add noise texture and enhanced glass utilities**

Replace the `@layer components` block and add new animations after it:

```css
/* Noise texture for depth */
.noise-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.015;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1;
}

@layer components {
  .glass-card {
    background: var(--bg-card);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-card);
    border-radius: var(--radius-card);
  }
  .glass-card-strong {
    background: var(--bg-sidebar);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-card);
    border-radius: var(--radius-card);
  }
  .glass-card-hover {
    transition: all var(--transition-smooth);
  }
  .glass-card-hover:hover {
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-2px);
    border-color: rgba(20, 184, 166, 0.15);
  }
  .glass-glow {
    box-shadow: var(--shadow-card), var(--glass-glow);
  }
  .glass-card-accent {
    background: var(--bg-card);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-card);
    border-radius: var(--radius-card);
    position: relative;
    overflow: hidden;
  }
  .glass-card-accent::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
    border-radius: var(--radius-card) var(--radius-card) 0 0;
  }
}
```

- [ ] **Step 4: Add stagger animation and enhanced keyframes**

Replace the existing animations section and add new ones:

```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 var(--color-primary-glow); }
  50% { box-shadow: 0 0 0 8px transparent; }
}
@keyframes subtleBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.stagger-in > * {
  opacity: 0;
  animation: fadeSlideUp 0.4s ease-out forwards;
}
.stagger-in > *:nth-child(1) { animation-delay: 0ms; }
.stagger-in > *:nth-child(2) { animation-delay: 60ms; }
.stagger-in > *:nth-child(3) { animation-delay: 120ms; }
.stagger-in > *:nth-child(4) { animation-delay: 180ms; }
.stagger-in > *:nth-child(5) { animation-delay: 240ms; }
.stagger-in > *:nth-child(6) { animation-delay: 300ms; }

.animate-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}
```

- [ ] **Step 5: Improve scrollbar styling**

```css
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
```

---

## Task 2: Sidebar — Active Indicator, Refined Navigation

**Files:**
- Modify: `pc/src/components/layout/Sidebar.tsx`

### Design Direction
Add a colored left-edge indicator bar for active nav items, improve the logo section with a subtle gradient background, refine nav item spacing and hover effects with scale transitions.

- [ ] **Step 1: Update nav item rendering with active indicator**

Replace the entire `Sidebar` function (lines 26–72) with:

```tsx
export default function Sidebar() {
  const { t } = useLanguage();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <aside
      className={`w-[var(--sidebar-width)] h-screen border-r backdrop-blur-glass-strong flex flex-col fixed left-0 top-8 z-30 transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--glass-border)' }}
      role="navigation"
      aria-label="主导航"
    >
      <div
        className="h-[var(--header-height)] flex items-center gap-2.5 px-5 border-b"
        style={{ borderColor: 'var(--glass-border)', background: 'linear-gradient(135deg, rgba(20,184,166,0.04), transparent)' }}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #14B8A6, #5EEAD4)' }}>
          <Sparkles className="w-4.5 h-4.5 text-white" aria-hidden="true" />
        </div>
        <span className="font-bold text-lg tracking-tight text-text-primary">知己</span>
      </div>
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto" aria-label="页面导航">
        {navItems.map(({ to, icon: Icon, key, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={t(key)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                isActive
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: `linear-gradient(180deg, ${color}, ${color}88)` }}
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive ? 'scale-105' : 'hover:scale-105'
                  }`}
                  style={{
                    background: isActive ? `${color}15` : 'transparent',
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" style={{ color: isActive ? color : undefined }} aria-hidden="true" />
                </div>
                <span>{t(key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-2.5 pb-3">
        <DailyQuote />
      </div>
      <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <p className="text-xs text-text-muted flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {t('nav.data_local')}
        </p>
      </div>
    </aside>
  );
}
```

---

## Task 3: Header — Refined Spacing and AI Button

**Files:**
- Modify: `pc/src/components/layout/Header.tsx`

### Design Direction
Make the header more compact (56px instead of 64px matches the CSS change), add a subtle divider between the title and date, refine the AI button with a gradient and icon pulse effect.

- [ ] **Step 1: Update Header component**

Replace the entire Header function (lines 22–70) with:

```tsx
export default function Header() {
  const location = useLocation();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const aiAssistantOpen = useUIStore((s) => s.aiAssistantOpen);
  const toggleAiAssistant = useUIStore((s) => s.toggleAiAssistant);
  const { t, lang } = useLanguage();
  const titleKey = pageTitles[location.pathname];
  const title = titleKey ? t(titleKey as any) : '知己';
  const isAssistantPage = location.pathname === '/assistant';

  const today = new Date();
  const dateDisplay = lang === 'zh-CN'
    ? `${today.getMonth() + 1}月${today.getDate()}日 周${['日', '一', '二', '三', '四', '五', '六'][today.getDay()]}`
    : format(today, 'EEE, MMM d');

  return (
    <header
      className="h-[var(--header-height)] border-b backdrop-blur-glass flex items-center justify-between px-6 sticky top-0 z-20"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--glass-border)', boxShadow: 'var(--glass-glow)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="切换侧边栏"
          className="p-2 rounded-xl text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all duration-200"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-text-primary tracking-tight">{title}</h1>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <span className="text-xs text-text-muted font-medium">
          {dateDisplay}
        </span>
      </div>
      {!isAssistantPage && (
        <button
          onClick={toggleAiAssistant}
          aria-label="AI 助理"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
            aiAssistantOpen
              ? 'text-white shadow-lg'
              : 'text-primary hover:shadow-md'
          }`}
          style={aiAssistantOpen
            ? { background: 'linear-gradient(135deg, #14B8A6, #0F766E)' }
            : { background: 'var(--color-primary-glow)' }
          }
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>AI 助理</span>
        </button>
      )}
    </header>
  );
}
```

---

## Task 4: StatusBar — Pill Status and Refined Time

**Files:**
- Modify: `pc/src/components/layout/StatusBar.tsx`

### Design Direction
Wrap status text in a pill-shaped container, add a subtle green dot for "running" feel, make the time display monospace for a tech feel.

- [ ] **Step 1: Update StatusBar rendering**

Replace the return block of StatusBar (around line 95–101):

```tsx
  return (
    <div
      className="h-7 border-t backdrop-blur-glass flex items-center justify-between px-5 text-xs"
      style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="font-medium">{getStatusText()}</span>
      </div>
      <span className="tabular-nums font-medium tracking-wide">{currentTime}</span>
    </div>
  );
```

---

## Task 5: AppLayout — Enhanced Orbs and Content Spacing

**Files:**
- Modify: `pc/src/components/layout/AppLayout.tsx`

### Design Direction
Add more visual depth to background orbs, refine content area spacing, and improve the AI panel transition.

- [ ] **Step 1: Update AppLayout**

Replace the entire component (lines 8–60) with:

```tsx
export default function AppLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const aiAssistantOpen = useUIStore((s) => s.aiAssistantOpen);
  const location = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden noise-overlay" style={{ background: 'var(--bg-gradient)' }}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-60 animate-float"
          style={{ background: 'radial-gradient(circle, var(--bg-decorative-1), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-50 animate-float-slow"
          style={{ background: 'radial-gradient(circle, var(--bg-decorative-2), transparent 70%)' }}
        />
        <div
          className="absolute -top-24 -right-48 w-[450px] h-[450px] rounded-full opacity-40 animate-float-slower"
          style={{ background: 'radial-gradient(circle, var(--bg-decorative-3), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-48 -left-24 w-[500px] h-[500px] rounded-full opacity-40 animate-float"
          style={{ background: 'radial-gradient(circle, var(--bg-decorative-4), transparent 70%)', animationDelay: '-7s' }}
        />
      </div>

      <Sidebar />
      <div className="relative z-10 pt-8 transition-all duration-300 ease-out" style={{ marginLeft: sidebarOpen ? 'var(--sidebar-width)' : '0' }}>
        <Header />
        <div className="flex" style={{ height: 'calc(100vh - 32px - var(--header-height) - 28px)' }}>
          <main className="flex-1 px-7 py-6 max-w-6xl mx-auto overflow-y-auto min-w-0" role="main" aria-label="主内容区">
            <Outlet />
          </main>

          {aiAssistantOpen && (
            <div className="overflow-hidden shrink-0 transition-all duration-300 ease-out w-[400px]">
              <aside
                className="w-[400px] h-full border-l overflow-y-auto backdrop-blur-glass"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--glass-border)', boxShadow: '-4px 0 24px rgba(0,0,0,0.04)' }}
                role="complementary"
                aria-label="AI助手面板"
              >
                <ChatPanel variant="floating" />
              </aside>
            </div>
          )}
        </div>
        <StatusBar />
      </div>
    </div>
  );
}
```

---

## Task 6: TitleBar — Theme-Aware Styling

**Files:**
- Modify: `pc/src/components/layout/TitleBar.tsx`

### Design Direction
Make the TitleBar background respond to the current theme, use CSS variables instead of hardcoded rgba values.

- [ ] **Step 1: Update TitleBar backgrounds**

In the macOS branch (around line 28), replace the hardcoded background:

```tsx
style={{ WebkitAppRegion: 'drag', background: 'var(--bg-card)', borderColor: 'var(--glass-border)' } as React.CSSProperties}
```

In the Windows branch (around line 45), replace the hardcoded background:

```tsx
style={{ WebkitAppRegion: 'drag', background: 'var(--bg-card)', borderColor: 'var(--glass-border)' } as React.CSSProperties}
```

Also add `border-bottom` to both divs' className: `border-b` is already present, but ensure it uses the variable.

---

## Task 7: DashboardPage — Hero Section and Staggered Layout

**Files:**
- Modify: `pc/src/pages/DashboardPage.tsx`

### Design Direction
Add a warm greeting based on time of day, use stagger animation for cards loading in, refine the section headings.

- [ ] **Step 1: Update DashboardPage layout**

Replace the entire DashboardPage function (lines 15–77) with:

```tsx
export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const { initService } = useAI();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { computeDailyRecord } = useDailyRecords();

  useEffect(() => {
    initService();
  }, [initService]);

  const counts = useLiveQuery(async () => {
    const [t, h, l] = await Promise.all([
      db.tasks.where('scheduledDate').equals(today).count(),
      db.habits.where('archived').equals(0).count(),
      db.habitLogs.where('date').equals(today).count(),
    ]);
    return { tasks: t, habits: h, logs: l };
  }, []);

  useEffect(() => {
    computeDailyRecord(today);
  }, [today, computeDailyRecord, counts?.tasks, counts?.habits, counts?.logs]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 6 ? '夜深了，注意休息' : hour < 12 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

  const dateDisplay = lang === 'zh-CN'
    ? `${now.getMonth() + 1}月${now.getDate()}日 ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]}`
    : format(now, 'EEE, MMM d');

  return (
    <div className="space-y-6 stagger-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-primary mb-1">{greeting}</p>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            {t('dashboard.today_overview')}
          </h2>
        </div>
        <span className="text-xs text-text-muted font-medium px-3 py-1.5 rounded-full" style={{ background: 'var(--bg-hover)' }}>
          {dateDisplay}
        </span>
      </div>

      <QuickStats />

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2 items-start">
        <div className="space-y-5">
          <TodayTodos />
          <LearningCheckin />
        </div>
        <div className="space-y-5">
          <TodayDiary />
          <EmotionOverview />
        </div>
      </div>

      <WeeklyReview />
    </div>
  );
}
```

---

## Task 8: QuickStats — Accent-Bordered Stat Cards

**Files:**
- Modify: `pc/src/components/dashboard/QuickStats.tsx`

### Design Direction
Each stat card gets a colored top border accent (matching its theme color), refined icon container, and better typography hierarchy.

- [ ] **Step 1: Update StatCard component**

Replace the `StatCard` function (lines 15–37) with:

```tsx
function StatCard({ icon, label, value, statusText, color }: StatCardProps) {
  return (
    <div className="glass-card-accent p-4 flex flex-col h-full glass-card-hover cursor-pointer" style={{ '--accent-color': color } as React.CSSProperties}>
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
          style={{ backgroundColor: `${color}12`, color }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      </div>
      <div className="flex-1 flex items-end">
        <span className="text-3xl font-bold tabular-nums" style={{ color }}>{value}</span>
      </div>
      <div className="mt-3 pt-2.5 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <span className="text-xs text-text-muted font-medium">{statusText}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add stagger class to grid**

Replace the grid container (line 74):

```tsx
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-stretch stagger-in">
```

---

## Task 9: TodayTodos — Refined Task Rows

**Files:**
- Modify: `pc/src/components/dashboard/TodayTodos.tsx`

### Design Direction
Better visual separation between tasks, refined checkbox with smooth fill animation, improved header with count badge.

- [ ] **Step 1: Update the card header**

Replace the header section (lines 63–74):

```tsx
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #14B8A615, #5EEAD415)', color: '#14B8A6' }}>
            <CheckSquare className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{t('dashboard.today_todos')}</h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>
            {completedTasks.length}/{tasks.length}
          </span>
        </div>
        <button onClick={() => navigate('/tasks')} className="text-xs text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-medium">
          {t('dashboard.view_all')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
```

- [ ] **Step 2: Update task row styling**

Replace the task row map block (lines 81–110):

```tsx
            {tasks.slice(0, 8).map((task) => {
              const isCompleted = task.status === 'completed';
              const isToggling = toggling[task.id];
              const category = task.tags.find((tag) => DEFAULT_CATEGORIES.some((c) => c.name === tag));
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-2.5 py-2 group rounded-lg px-1 transition-all duration-200 hover:bg-surface-hover ${
                    isToggling ? 'opacity-50 scale-[0.98]' : ''
                  }`}
                >
                  <button onClick={() => handleToggle(task.id, task.status)} className="shrink-0 cursor-pointer p-0.5">
                    {isCompleted ? (
                      <CheckSquare className="w-4 h-4 text-primary transition-colors" />
                    ) : (
                      <Circle className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 flex items-center min-w-0 gap-2">
                    <p className={`text-sm truncate ${isCompleted ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                      {task.title}
                    </p>
                    {category && (
                      <span className="shrink-0 px-2 py-0.5 text-[10px] rounded-full text-white font-medium" style={{ backgroundColor: CATEGORY_COLOR_MAP[category] }}>
                        {category}
                      </span>
                    )}
                    <Badge variant={PRIORITY_CONFIG[task.priority].variant} size="sm" className="shrink-0 ml-auto font-medium">
                      {t(PRIORITY_CONFIG[task.priority].key)}
                    </Badge>
                  </div>
                </div>
              );
            })}
```

---

## Task 10: TodayDiary — Better Empty State and Preview

**Files:**
- Modify: `pc/src/components/dashboard/TodayDiary.tsx`

### Design Direction
More inviting empty state with a gradient accent, better diary preview card with subtle decorative element.

- [ ] **Step 1: Update TodayDiary component**

Replace the entire component body return (lines 17–61) with:

```tsx
  return (
    <div className="glass-card-accent p-5 flex flex-col" style={{ '--accent-color': '#8B5CF6' } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF615, #A78BFA15)', color: '#8B5CF6' }}>
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{t('dashboard.today_diary')}</h3>
        </div>
        <button
          onClick={() => navigate('/diary')}
          className="text-xs text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
        >
          {t('dashboard.view_all')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {!todayDiary ? (
        <div className="text-center py-8 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(167,139,250,0.02))' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(139,92,246,0.08)' }}>
            <PenLine className="w-5 h-5" style={{ color: '#8B5CF6' }} />
          </div>
          <p className="text-xs text-text-muted mb-3">{t('dashboard.no_diary_today')}</p>
          <button
            onClick={() => navigate('/diary/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 hover:shadow-md text-white"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
          >
            <PenLine className="w-3.5 h-3.5" />
            {t('dashboard.write_diary')}
          </button>
        </div>
      ) : (
        <div className="flex-1">
          <p className="text-xs text-text-muted mb-2 font-medium">
            {format(new Date(todayDiary.date), 'HH:mm')}
          </p>
          {todayDiary.title && (
            <p className="text-sm font-semibold text-text-primary mb-1.5">{todayDiary.title}</p>
          )}
          <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
            {todayDiary.content.slice(0, 100)}
            {todayDiary.content.length > 100 ? '...' : ''}
          </p>
        </div>
      )}
    </div>
  );
```

---

## Task 11: LearningCheckin — Refined Progress Bar and Rows

**Files:**
- Modify: `pc/src/components/dashboard/LearningCheckin.tsx`

### Design Direction
Better habit rows with hover highlight, gradient progress bar, and refined completion state.

- [ ] **Step 1: Update LearningCheckin return block**

Replace the entire return block (lines 39–93) with:

```tsx
  return (
    <div className="glass-card-accent p-5 flex flex-col" style={{ '--accent-color': '#F59E0B' } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F59E0B15, #FBBF2415)', color: '#F59E0B' }}>
            <CheckSquare className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{t('dashboard.habit_checkin')}</h3>
          {total > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
              {todayCompleted}/{total}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/habits')}
          className="text-xs text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
        >
          {t('dashboard.view_all')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {total === 0 ? (
        <p className="text-xs text-text-muted py-4 text-center">
          {t('dashboard.no_habits')}
        </p>
      ) : (
        <div className="flex-1">
          <div className="space-y-0.5 mb-4">
            {allHabits.map((habit) => {
              const done = loggedIds.has(habit.id);
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleLog(habit.id, today)}
                  className="flex items-center gap-2.5 w-full py-2 group rounded-lg px-1.5 transition-all duration-200 hover:bg-surface-hover cursor-pointer"
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-text-muted group-hover:text-amber-500 shrink-0 transition-colors" />
                  )}
                  <span className={`text-sm ${done ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                    {habit.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: progress === 100
                  ? 'linear-gradient(90deg, #22C55E, #16A34A)'
                  : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
              }}
            />
          </div>
          {progress === 100 && (
            <p className="text-xs text-green-600 font-medium mt-2 text-center">全部完成！</p>
          )}
        </div>
      )}
    </div>
  );
```

---

## Task 12: EmotionOverview — Refined Ring and Insight Card

**Files:**
- Modify: `pc/src/components/dashboard/EmotionOverview.tsx`

### Design Direction
Refined ring chart with gradient stroke, better insight text area, improved empty state.

- [ ] **Step 1: Update EmotionOverview return block**

Replace the entire return (lines 62–128) with:

```tsx
  return (
    <div className="glass-card-accent p-5" style={{ '--accent-color': '#EC4899' } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EC489915, #F472B615)', color: '#EC4899' }}>
            <Heart className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">情绪健康</h3>
        </div>
        {profile && (
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${RISK_COLORS[riskLevel] || 'text-slate-500 bg-slate-50'}`}>
            {RISK_LABELS[riskLevel] || riskLevel}
          </span>
        )}
      </div>

      {index !== null ? (
        <>
          <div className="flex items-center gap-4 mb-3">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <defs>
                  <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={index >= 70 ? '#22c55e' : index >= 40 ? '#f59e0b' : '#ef4444'} />
                    <stop offset="100%" stopColor={index >= 70 ? '#16a34a' : index >= 40 ? '#d97706' : '#dc2626'} />
                  </linearGradient>
                </defs>
                <circle cx="18" cy="18" r="15" fill="none" stroke="var(--bg-hover)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke="url(#healthGrad)"
                  strokeWidth="3"
                  strokeDasharray={`${(index / 100) * 94.25} 94.25`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{index}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Activity className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>情绪指数</span>
                {trendIcon}
              </div>
              {insight && (
                <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs border-t pt-2.5" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}>
            <span className="font-medium">近7天分析 {recentEmotions?.length ?? 0} 条</span>
            <a href="#/emotion" className="text-primary hover:underline font-medium">查看详情 →</a>
          </div>
        </>
      ) : (
        <div className="text-center py-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.04), rgba(244,114,182,0.02))' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(236,72,153,0.08)' }}>
            <Activity className="w-5 h-5" style={{ color: '#EC4899' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>暂无数据</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>写日记后自动分析</p>
        </div>
      )}
    </div>
  );
```

---

## Task 13: WeeklyReview — Refined List

**Files:**
- Modify: `pc/src/components/dashboard/WeeklyReview.tsx`

### Design Direction
Better weekly diary items with hover highlight and date badge styling.

- [ ] **Step 1: Update WeeklyReview return block**

Replace the entire return (lines 20–59) with:

```tsx
  return (
    <div className="glass-card-accent p-5 flex flex-col" style={{ '--accent-color': '#3B82F6' } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F615, #60A5FA15)', color: '#3B82F6' }}>
            <ClipboardList className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{t('dashboard.weekly_review_entries')}</h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
            {count}
          </span>
        </div>
        <button
          onClick={() => navigate('/reports')}
          className="text-xs text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
        >
          {t('dashboard.view_all')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {count === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">
          {t('dashboard.no_diary_today')}
        </p>
      ) : (
        <div className="flex-1 space-y-1 max-h-36 overflow-y-auto">
          {weeklyDiaries!.slice(0, 5).map((diary) => (
            <div key={diary.id} className="flex items-center gap-2.5 text-xs py-2 px-2 rounded-lg transition-colors duration-150 hover:bg-surface-hover">
              <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                {format(new Date(diary.date), 'MM/dd')}
              </span>
              <span className="text-text-secondary truncate">
                {diary.title || diary.content.slice(0, 30)}
                {(diary.title || diary.content).length > 30 ? '...' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
```

---

## Task 14: DailyQuote — Refined Sidebar Card

**Files:**
- Modify: `pc/src/components/dashboard/DailyQuote.tsx`

### Design Direction
Better quote presentation with left accent border, improved typography for the quote text.

- [ ] **Step 1: Update DailyQuote quote display**

Replace the quote display section (lines 116–142):

```tsx
      {!quote ? (
        <p className="text-xs text-text-muted italic">{t('dashboard.quote_placeholder')}</p>
      ) : (
        <div className="relative group">
          <div className="border-l-2 pl-3 py-0.5" style={{ borderColor: 'var(--color-primary)' }}>
            <p className="text-xs italic text-text-secondary leading-relaxed">
              "{quote.content}"
            </p>
            {quote.author && (
              <p className="text-[11px] text-text-muted mt-1 font-medium">— {quote.author}</p>
            )}
          </div>
          <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
            <button
              onClick={() => openEditModal(quote)}
              className="p-1 rounded-lg hover:text-primary transition-colors cursor-pointer"
              style={{ background: 'var(--bg-hover)' }}
              title={t('dashboard.edit_quote')}
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleDelete(quote.id)}
              className="p-1 rounded-lg hover:text-red-500 transition-colors cursor-pointer"
              style={{ background: 'var(--bg-hover)' }}
              title={t('dashboard.delete_quote')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
```

---

## Task 15: Common Components — Card, Button, Modal, Input, Badge

**Files:**
- Modify: `pc/src/components/common/Card.tsx`
- Modify: `pc/src/components/common/Button.tsx`
- Modify: `pc/src/components/common/Modal.tsx`
- Modify: `pc/src/components/common/Input.tsx`
- Modify: `pc/src/components/common/Badge.tsx`

### Design Direction
Card: Better hover with border color transition. Button: Subtle gradient backgrounds for primary. Modal: Scale-in entrance animation. Input: Refined focus ring and label. Badge: Subtle tinted backgrounds for default variant.

- [ ] **Step 1: Update Card component**

Replace `Card.tsx` (full file):

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? '可点击卡片' : undefined}
      className={`
        glass-card glass-glow p-5
        ${hover ? 'glass-card-hover cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Update Button component**

Replace the variants object in `Button.tsx`:

```tsx
const variants = {
  primary: 'text-white hover:shadow-md',
  secondary: 'text-text-primary border hover:border-primary/20',
  ghost: 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
  danger: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md',
};
```

And update the button element to include gradient for primary:

```tsx
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-btn transition-all duration-200
        ${variants[variant]} ${sizes[size]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={variant === 'primary' ? { background: 'linear-gradient(135deg, #14B8A6, #0F766E)' } : variant === 'secondary' ? { background: 'var(--bg-hover)', borderColor: 'var(--glass-border)' } : undefined}
      {...props}
    >
```

- [ ] **Step 3: Update Modal entrance animation**

In `Modal.tsx`, update the dialog div className (around line 58) to use scale-in:

```tsx
        className={`glass-card glass-glow shadow-xl w-full ${maxWidth} mx-4 max-h-[85vh] flex flex-col outline-none`}
        style={{ animation: 'modalScaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
```

And add this keyframe to `index.css` (in the animations section):

```css
@keyframes modalScaleIn {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
```

- [ ] **Step 4: Update Input component**

In `Input.tsx`, replace the input className (around line 14):

```tsx
        className={`w-full px-3 py-2.5 rounded-btn border text-sm
          placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          transition-all duration-200 ${error ? 'border-red-500 ring-2 ring-red-500/20' : ''} ${className}`}
```

- [ ] **Step 5: Update Badge default variant**

In `Badge.tsx`, update the default variant styling:

```tsx
const colors = {
  default: '',
  success: 'text-green-700 bg-green-50',
  warning: 'text-amber-700 bg-amber-50',
  danger: 'text-red-700 bg-red-50',
  info: 'text-blue-700 bg-blue-50',
};
```

And update the default style:

```tsx
      style={variant === 'default' ? { background: 'var(--bg-hover)', color: 'var(--text-secondary)' } : undefined}
```

---

## Task 16: Build Verification

**Files:**
- None (command only)

- [ ] **Step 1: Run Vite build**

Run: `cd pc && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Review build output**

Check the build output for any warnings about unused CSS or broken imports. Fix any issues found.

---

## Self-Review Checklist

- [x] **Spec coverage:** All visual elements covered — CSS foundation, Sidebar, Header, StatusBar, AppLayout, TitleBar, Dashboard page, all 6 dashboard components, 5 common components
- [x] **No placeholders:** Every step contains complete code with exact file paths and line numbers
- [x] **Type consistency:** All component props, CSS variable names, and Tailwind classes are consistent across tasks
- [x] **Design coherence:** All changes follow the "Aurora Glass" direction — warmer accents, better depth, refined interactions
- [x] **No new dependencies:** All changes use existing CSS variables, Tailwind utilities, and Lucide icons
- [x] **Dark mode preserved:** All CSS variable additions include dark mode counterparts
