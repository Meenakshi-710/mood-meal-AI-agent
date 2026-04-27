# SCREEN_SPEC.md
# ============================================================
# Per-screen layout specifications extracted from Figma
# Reference: DayTask UI Kit — 8 screens mapped for DevTask
# Figma: https://www.figma.com/community/file/1242943045226413091
# ============================================================
# HOW TO USE IN CURSOR:
#   @SCREEN_SPEC.md + paste the specific screen section
#   Never send the whole file — just the screen you're building
# ============================================================

---

## SCREEN 1 — Splash / Onboarding
**File target:** src/screens/SplashScreen/index.tsx
**Navigation:** No nav bar. Auto-navigates to Login after 2s (or checks auth state)

### Layout (top → bottom)
```
- Full screen, backgroundColor: Primary (#4F6DF5)
- CENTER of screen:
    Logo icon (replace with your SVG): 80x80, White
    App name text: displayLg, White, marginTop: md
    Tagline: bodyLg, White opacity 0.8, marginTop: xs
- BOTTOM (above safe area):
    ActivityIndicator, White
    "Getting things ready..." bodyMd, White opacity 0.6, marginTop: sm
```

### Logic
- On mount: check Firebase auth state
- If logged in → navigate to MainTabs (replace=true)
- If not → navigate to Login after 2s delay

---

## SCREEN 2 — Login
**File target:** src/screens/LoginScreen/index.tsx
**Navigation:** Stack. No back button on first screen.

### Layout (top → bottom, paddingHorizontal: md)
```
- SafeAreaView, bg: White
- TOP SECTION (flex: 0.4, justify: flex-end):
    Icon/logo: 64x64, Primary
    "Welcome back" displayMd, Neutral900, marginTop: md
    "Sign in to continue" bodyLg, Neutral500, marginTop: xs

- FORM SECTION (marginTop: xl):
    Email input (see Input Field spec)
    Password input (marginTop: md, secureTextEntry, show/hide toggle)

- "Forgot Password?" labelMd, Primary, textAlign: right, marginTop: sm

- Primary Button "Sign In" (full width, marginTop: xl)

- DIVIDER (marginTop: lg):
    "or continue with" bodyMd, Neutral500, centered, with lines on each side

- Google Sign-In button (outlined, White bg, Google icon left):
    marginTop: md, height: 52, borderRadius: md
    "Continue with Google" labelLg, Neutral900

- BOTTOM:
    "Don't have an account? " bodyMd Neutral500
    "Sign Up" labelMd Primary (inline, onPress → RegisterScreen)
    marginTop: auto, paddingBottom: lg
```

### Logic
- Form validation: email format, password min 6 chars
- Show inline error under each field on blur
- Loading state on button during Firebase signInWithEmailAndPassword
- Error toast on Firebase error

---

## SCREEN 3 — Register
**File target:** src/screens/RegisterScreen/index.tsx
**Navigation:** Stack, back to Login

### Layout (same shell as Login, paddingHorizontal: md)
```
- Header: "Create Account" displayMd
  Subtitle: "Start organizing your tasks" bodyLg Neutral500

- FORM (marginTop: xl):
    Full Name input
    Email input (marginTop: md)
    Password input (marginTop: md, secureTextEntry)
    Confirm Password input (marginTop: md, secureTextEntry)

- Terms text (marginTop: md):
    "By signing up you agree to our " bodyMd Neutral500
    "Terms" labelMd Primary (link)
    " and " bodyMd Neutral500
    "Privacy Policy" labelMd Primary (link)

- Primary Button "Create Account" (marginTop: xl)

- BOTTOM:
    "Already have an account? " bodyMd Neutral500
    "Sign In" labelMd Primary → LoginScreen
```

### Logic
- Validate: all fields required, email format, passwords match, min 6 chars
- Firebase createUserWithEmailAndPassword
- On success: create user record in Realtime DB, navigate to MainTabs

---

## SCREEN 4 — Home (Dashboard)
**File target:** src/screens/HomeScreen/index.tsx
**Navigation:** Bottom tab (index 0). No back button.

### Layout
```
HEADER (paddingHorizontal: md, paddingTop: sm):
  Row:
    Left:
      "Good morning," bodyMd Neutral500
      "{UserName}" headingLg Neutral900 (on next line)
    Right:
      Avatar (40x40, borderRadius: full)
      Notification bell icon (24, Neutral700) with badge dot if unread

SUMMARY CARDS ROW (marginTop: md, paddingHorizontal: md):
  ScrollView horizontal, showsHorizontalScrollIndicator: false
  3 cards, each: width 140, height 90, borderRadius: md, padding: md, marginRight: sm
  Card 1: "Total Tasks"   — count displayMd Primary,  label bodyMd Neutral500
  Card 2: "In Progress"   — count displayMd Warning,   label bodyMd Neutral500
  Card 3: "Completed"     — count displayMd Success,   label bodyMd Neutral500

SECTION: "Today's Tasks" (marginTop: lg, paddingHorizontal: md):
  Row: "Today's Tasks" headingMd Neutral900 + "See All" labelMd Primary (right, → TaskListScreen)
  FlatList of Task Cards (see Task Card spec)
  Empty state: illustration + "No tasks for today" bodyLg Neutral700 (centered)

SECTION: "Upcoming" (marginTop: lg, paddingHorizontal: md):
  Same pattern, next 3 tasks with due date > today

FAB: + icon → CreateTaskModal (absolute, see FAB spec)
```

### Logic
- Load tasks from Firebase on mount and on focus
- Filter: today = tasks where dueDate equals today's date string
- Upcoming = next 7 days, max 3 shown
- Greeting changes: morning/afternoon/evening based on hour

---

## SCREEN 5 — Task List (All Tasks)
**File target:** src/screens/TaskListScreen/index.tsx
**Navigation:** Bottom tab (index 1) OR stack push from HomeScreen

### Layout
```
HEADER:
  "My Tasks" headingLg Neutral900 (left)
  Filter icon (24, Neutral700) right → opens FilterSheet

FILTER TABS (marginTop: md, paddingHorizontal: md):
  Horizontal scroll, pill chips: All | Today | This Week | Completed
  Active chip: Primary bg, White text, borderRadius: full, padding: sm/md
  Inactive chip: Neutral100 bg, Neutral700 text

SORT ROW (marginTop: sm, paddingHorizontal: md):
  "Sort by: " labelMd Neutral500
  Dropdown/pressable: "Due Date ▾" labelMd Primary

TASK LIST (marginTop: md):
  FlatList, paddingHorizontal: md, ItemSeparatorComponent: 8 gap
  Each item: Task Card (full spec in DESIGN_CONTEXT.md)
  
  Swipe actions:
    Swipe left → Delete (Danger bg, trash icon, White)
    Swipe right → Complete (Success bg, check icon, White)

EMPTY STATE (when filter returns 0):
  Icon 64px Neutral300
  "No tasks here" headingMd Neutral700
  "Try a different filter" bodyMd Neutral500
```

### Logic
- All tasks from Firebase, filtered client-side by selected tab
- Swipe-to-delete: Firebase delete + optimistic UI removal
- Swipe-to-complete: toggle task.completed, update Firebase
- Sort options: Due Date (asc), Priority (high→low), Created (newest)

---

## SCREEN 6 — Create / Edit Task
**File target:** src/screens/CreateTaskScreen/index.tsx  
**Navigation:** Modal stack (slides up from bottom). Back = dismiss.

### Layout
```
MODAL HANDLE: 4x40 pill, Neutral300, centered, marginTop: sm

HEADER (paddingHorizontal: md):
  "New Task" headingLg Neutral900 (left)
  "Cancel" labelMd Neutral500 (right, dismisses modal)

FORM (paddingHorizontal: md, marginTop: md):
  Task Title input (large, displaySm style, no border box — borderBottomWidth: 1 only)
  Description textarea (bodyMd, Neutral700, height: 80, marginTop: md)

  SECTION "Priority" (marginTop: lg):
    "Priority" labelMd Neutral700
    Row of 3 pill selectors: High | Medium | Low
    Selected: colored bg (see Priority Badge spec) + checkmark icon
    Unselected: Neutral100 bg, Neutral700 text

  SECTION "Due Date" (marginTop: md):
    Pressable row: Calendar icon (Primary) + date string or "Set due date" (Neutral500)
    Opens DateTimePicker on press

  SECTION "Reminder" (marginTop: md):
    Pressable row: Bell icon (Primary) + time string or "Add reminder" (Neutral500)
    Toggle switch right side

  SECTION "Assign to" (marginTop: md, if team features enabled):
    Avatar row, + Add button

SAVE BUTTON (position: absolute, bottom: safeArea + md, left/right: md):
  Primary Button "Save Task" (full width)
```

### Logic
- Edit mode: pre-fill all fields when taskId passed as param
- Validation: title required (min 2 chars)
- On save: write to Firebase tasks/{userId}/{taskId}
- If reminder set: schedule local notification via notifee or expo-notifications

---

## SCREEN 7 — Task Detail
**File target:** src/screens/TaskDetailScreen/index.tsx
**Navigation:** Stack push from Task Card tap

### Layout
```
HEADER (standard, with back button):
  Back icon (left)
  "Task Detail" headingMd Neutral900 (center)
  Edit icon (right, Neutral700) → CreateTaskScreen with taskId

CONTENT (ScrollView, paddingHorizontal: md):
  Status Badge (top): pill with current status (Todo / In Progress / Done)
    Tap → opens status picker sheet

  Title: displaySm, Neutral900, marginTop: md
  
  Priority + Due Date row (marginTop: md):
    Priority Badge (left, see spec)
    Due date: Calendar icon + date string (right)

  Divider (marginTop: md)

  "Description" labelMd Neutral500, marginTop: md
  Description text: bodyLg Neutral700
  (If empty: "No description added" bodyMd Neutral300 italic)

  "Reminder" labelMd Neutral500, marginTop: lg
  Reminder row: Bell icon + time OR "Not set" Neutral300

  Divider

  "Created" labelMd Neutral500, marginTop: md
  Date string: bodyMd Neutral700

DELETE BUTTON (bottom, above safe area):
  Outlined button, Danger color "Delete Task"
  Confirm dialog before Firebase delete
```

### Logic
- Load task by taskId from Firebase or local store
- Status change: update Firebase, update local store optimistically
- Delete: confirm → Firebase delete → pop screen

---

## SCREEN 8 — Profile / Settings
**File target:** src/screens/ProfileScreen/index.tsx
**Navigation:** Bottom tab (index 3)

### Layout
```
PROFILE HEADER (paddingHorizontal: md, paddingVertical: lg, centered):
  Avatar: 80x80, borderRadius: full
  Name: displaySm, Neutral900, marginTop: md
  Email: bodyMd, Neutral500
  "Edit Profile" outlined small button (marginTop: sm)

STATS ROW (marginTop: lg, paddingHorizontal: md):
  3 stat cards in a row (flex equal):
    Total | Completed | Streak
    value: displayMd Primary, label: labelSm Neutral500

SETTINGS LIST (marginTop: lg):
  Section header: labelMd Neutral500 UPPERCASE, paddingHorizontal: md, marginBottom: xs

  Section "Preferences":
    Row: Bell icon + "Notifications" labelLg Neutral900 + Toggle switch
    Row: Moon icon + "Dark Mode" labelLg Neutral900 + Toggle switch
    Row: Globe icon + "Language" labelLg Neutral900 + "English" labelMd Neutral500 + chevron

  Section "Account":
    Row: Lock icon + "Change Password" + chevron
    Row: Shield icon + "Privacy Policy" + chevron
    Row: Info icon + "About" + chevron

  "Sign Out" — full row button, Danger text, no icon (marginTop: xl)

SETTING ROW spec:
  height: 52
  paddingHorizontal: md
  borderBottomWidth: 0.5, borderBottomColor: Neutral100
  Icon 24 left (Neutral700) + label flex:1 + right element
```

### Logic
- Load user data from Firebase auth + Realtime DB
- Stats: query tasks collection, compute counts
- Notifications toggle: request permission if turning on
- Sign Out: Firebase signOut() → navigate to Login (reset stack)
```
