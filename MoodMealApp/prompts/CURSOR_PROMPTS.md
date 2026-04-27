# CURSOR_PROMPTS.md
# ============================================================
# Copy-paste prompt templates for every step of the workflow
# Use these EXACTLY — they are optimized for Cursor AI
# ============================================================
# GOLDEN RULE: One screen per conversation. Start a new
# Cursor chat for every screen. Don't batch multiple screens.
# ============================================================

---

## ⚡ STEP 0 — BOOTSTRAP (run once, first time only)

Paste this into Cursor to generate the theme files from DESIGN_CONTEXT.md:

```
@DESIGN_CONTEXT.md

Generate the following theme files exactly matching the tokens in DESIGN_CONTEXT.md:

1. src/theme/colors.ts
   - Export a const `colors` object with all color tokens as typed string values
   - Add a TypeScript type Colors = typeof colors

2. src/theme/spacing.ts
   - Export a const `spacing` object with all spacing tokens as typed number values

3. src/theme/typography.ts
   - Export a const `typography` object where each key is a TextStyle object (from react-native)
   - Include fontSize, fontWeight, lineHeight for every token

4. src/theme/shadows.ts
   - Export a const `shadows` object for card, modal, and fab
   - Each is a ViewStyle-compatible object

5. src/theme/index.ts
   - Re-export all of the above

Do not create any component files. Only theme files.
```

---

## ⚡ STEP 1 — BUILD A SCREEN

Template — replace [SCREEN NAME] and paste the screen section from SCREEN_SPEC.md:

```
@DESIGN_CONTEXT.md @SCREEN_SPEC.md @.cursorrules

Build [SCREEN NAME] exactly as specified.

=== SCREEN SPEC (copy from SCREEN_SPEC.md) ===
[PASTE THE ENTIRE SCREEN SECTION HERE]
=== END SPEC ===

Requirements:
- File: src/screens/[ScreenName]/index.tsx
- Styles: src/screens/[ScreenName]/[ScreenName].styles.ts (separate file)
- Use ONLY tokens from src/theme — no hardcoded values
- Wrap in SafeAreaView from react-native-safe-area-context
- Navigation prop typed correctly for [stack/tab] navigator
- Show skeleton/loading state while data loads
- Handle empty state as specified
- All text must use a typography token
- Do not implement Firebase logic yet — use mock data passed as props or useState placeholder

Output both files in full. Do not truncate.
```

---

## ⚡ STEP 2 — CONNECT FIREBASE TO A SCREEN

Run this AFTER Step 1 screen is visually correct:

```
@.cursorrules

The [ScreenName] UI is built. Now wire it to Firebase.

Firebase config is in src/services/firebase/config.ts (already exists in boilerplate).

Tasks:
1. Create src/services/firebase/[domain].ts if it doesn't exist
   - Export functions: get[Resource], create[Resource], update[Resource], delete[Resource]
   - Each function returns a Promise and handles errors
   - Use Firebase Realtime Database path: [describe path, e.g. tasks/{userId}/{taskId}]

2. Create src/hooks/use[ScreenName].ts
   - Calls the service functions
   - Returns: { data, isLoading, error, refetch }
   - Uses useEffect to load on mount

3. Update src/screens/[ScreenName]/index.tsx
   - Import and call the hook
   - Replace mock data with real data
   - Show loading state (ActivityIndicator, centered) while isLoading
   - Show error state (error text + retry button) if error
   - Do not change any styling

Output all changed/new files in full.
```

---

## ⚡ STEP 3 — BUILD A REUSABLE COMPONENT

Use this when a component appears in 2+ screens:

```
@DESIGN_CONTEXT.md @.cursorrules

Build a reusable component: [ComponentName]

=== COMPONENT SPEC ===
[Describe or paste the component spec from DESIGN_CONTEXT.md]
=== END SPEC ===

Requirements:
- File: src/components/[ComponentName]/index.tsx
- Styles: src/components/[ComponentName]/[ComponentName].styles.ts
- Props interface: [ComponentName]Props — make all optional props explicit
- Use only theme tokens for all colors, spacing, typography
- Export as named export: export function [ComponentName]
- Include a simple usage example as a comment at the bottom of the file

Output both files in full.
```

---

## ⚡ STEP 4 — FIX A VISUAL DIFF

Use this when Cursor output doesn't match Figma:

```
@DESIGN_CONTEXT.md

The [ComponentName/ScreenName] has visual issues compared to the Figma spec.

Here are the specific diffs:

1. [Issue 1 — be specific]
   Expected: [value from Figma, e.g. padding: 16]
   Got: [current value in code, e.g. padding: 12]
   Fix: Change paddingHorizontal in styles.[componentName].container

2. [Issue 2]
   Expected: [value]
   Got: [value]

3. [Issue 3]
   ...

ONLY fix the listed issues. Do not change anything else.
Output only the changed style keys, not the full file.
```

---

## ⚡ STEP 5 — ADD NAVIGATION BETWEEN SCREENS

Run this after 2+ screens are built:

```
@.cursorrules

Wire up navigation between the following screens.

Current screens built:
- [Screen1] — [stack/tab]
- [Screen2] — [stack/tab]
- [Screen3] — [modal]

Navigation structure:
- Root: RootStack (Stack.Navigator)
  - AuthStack (Stack.Navigator, shown when not logged in):
    - SplashScreen
    - LoginScreen
    - RegisterScreen
  - MainTabs (Tab.Navigator, shown when logged in):
    - Tab 1: HomeScreen (icon: home)
    - Tab 2: TaskListScreen (icon: list)
    - Tab 3: ProfileScreen (icon: person)
  - Modals (on top of MainTabs):
    - CreateTaskScreen (modal)
    - TaskDetailScreen (push from Home or List)

Tasks:
1. Create src/app/navigators/RootNavigator.tsx — full navigator tree
2. Create src/app/navigators/AuthNavigator.tsx
3. Create src/app/navigators/MainTabNavigator.tsx
4. Update src/app/app.tsx to render RootNavigator
5. Add proper TypeScript types for all route params in src/app/navigators/types.ts
6. Add navigation prop types to each screen

Use React Navigation v6 patterns. Tab bar styled per DESIGN_CONTEXT.md tab bar spec.
Output all files in full.
```

---

## ⚡ STEP 6 — DAILY USAGE (any Figma link → screen)

This is the repeatable prompt for ANY new Figma screen:

```
@DESIGN_CONTEXT.md @.cursorrules

I'm giving you a new screen to build from Figma.

Figma link: [PASTE LINK TO SPECIFIC FRAME]

From inspecting the Figma (Dev Mode / Inspect panel), here are the specs I extracted:

SCREEN NAME: [Name]
FILE TARGET: src/screens/[ScreenName]/index.tsx

LAYOUT (top → bottom):
[Describe each section: component type, dimensions, colors mapped to tokens, spacing]

INTERACTIONS:
- [Tap X → navigate to Y]
- [Tap Z → open modal W]

SPECIAL STATES:
- Loading: [describe]
- Empty: [describe]
- Error: [describe]

Build this screen matching the specs exactly. Use only theme tokens. Show mock data.
Output index.tsx and [ScreenName].styles.ts in full.
```

---

## ⚡ STEP 7 — EXTRACT FIGMA SPECS (manual, no plugin)

When you open Figma Dev Mode, extract these values for each screen:

### Quick extraction checklist
```
For EVERY frame/component, note:
□ Width × Height
□ Background color (hex)
□ Padding (top, right, bottom, left)
□ BorderRadius
□ Children layout: column or row? gap between children?

For EVERY text layer:
□ Font size + weight + line height + color
□ Text alignment
□ Max lines / overflow

For EVERY interactive element:
□ What happens on tap?
□ Is there a pressed/disabled state?
□ What screen/action does it trigger?
```

Then paste your findings into the Step 6 prompt template.

---

## ⚡ STEP 8 — QA PROMPT (after every screen)

Run this after building and visually checking each screen:

```
@.cursorrules

Review src/screens/[ScreenName]/index.tsx and [ScreenName].styles.ts for the following issues:

1. Hardcoded values — flag any color hex, spacing number, or font size NOT from theme
2. Missing states — check for: loading, empty, error states
3. TypeScript issues — any `any` types, missing prop types, untyped navigation
4. Accessibility — any Pressable/TouchableOpacity missing accessibilityLabel
5. Performance — any inline functions in FlatList renderItem, missing keyExtractor

Return a bullet list of found issues with the line number and suggested fix.
Do not make changes yet — only report.
```

---

## CHEAT SHEET — Common Cursor @ mentions

```
@DESIGN_CONTEXT.md    — always include when building/fixing UI
@SCREEN_SPEC.md       — always include for screen generation
@.cursorrules         — always include for architecture/structure
@src/theme/colors.ts  — include when fixing specific color issues
@src/components/[X]   — include when a screen uses a shared component
@src/services/firebase/[x].ts — include when wiring Firebase
```

---

## RELIABILITY TIPS

1. **Start a new Cursor chat for each screen** — context gets polluted in long chats
2. **Always paste the full spec** — don't say "build it like the home screen"
3. **Fix visuals before wiring data** — never fix UI bugs in a file that also has Firebase hooks
4. **Commit after every passing screen** — don't batch screens in one commit
5. **If Cursor hallucinates an import** — immediately say: "That import doesn't exist. Use [correct path]"
6. **Token mismatches** — if Cursor uses a wrong token, correct it by name: "Use spacing.md not spacing.medium"
