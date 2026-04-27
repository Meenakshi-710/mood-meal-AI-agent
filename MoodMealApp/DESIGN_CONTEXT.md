# DESIGN_CONTEXT.md
# ============================================================
# SOURCE OF TRUTH for design tokens extracted from Figma
# Update this file whenever the Figma design changes
# Reference: DayTask — Task Management App UI Kit
# Figma: https://www.figma.com/community/file/1242943045226413091
# ============================================================
# HOW TO USE IN CURSOR:
#   @DESIGN_CONTEXT.md at the start of every prompt
# ============================================================

## COLOR TOKENS
Map these directly to src/theme/colors.ts

```
Primary         #4F6DF5   — buttons, active tabs, CTAs
PrimaryLight    #EEF1FE   — backgrounds, chips, badges
PrimaryDark     #3451D1   — pressed state, dark variant

Success         #4CAF50   — completed tasks, success states
SuccessLight    #E8F5E9   — success backgrounds
Warning         #FF9800   — in-progress, due soon
WarningLight    #FFF3E0   — warning backgrounds
Danger          #F44336   — overdue, delete, error
DangerLight     #FFEBEE   — error backgrounds

Neutral900      #1A1A2E   — primary text, headings
Neutral700      #3D3D5C   — secondary text, labels
Neutral500      #7A7A9D   — placeholder, hint text
Neutral300      #C5C5D8   — dividers, borders
Neutral100      #F4F4F8   — subtle backgrounds, input fill
White           #FFFFFF   — cards, modals, screen bg
```

## SPACING TOKENS
Map these to src/theme/spacing.ts

```
xxs    2
xs     4
sm     8
md     16
lg     24
xl     32
xxl    48
xxxl   64
```

## TYPOGRAPHY TOKENS
Map these to src/theme/typography.ts

```
displayLg    fontSize: 28, fontWeight: '700', lineHeight: 36
displayMd    fontSize: 24, fontWeight: '700', lineHeight: 32
displaySm    fontSize: 20, fontWeight: '600', lineHeight: 28

headingLg    fontSize: 18, fontWeight: '600', lineHeight: 24
headingMd    fontSize: 16, fontWeight: '600', lineHeight: 22
headingSm    fontSize: 14, fontWeight: '600', lineHeight: 20

bodyLg       fontSize: 16, fontWeight: '400', lineHeight: 24
bodyMd       fontSize: 14, fontWeight: '400', lineHeight: 20
bodySm       fontSize: 12, fontWeight: '400', lineHeight: 18

labelLg      fontSize: 14, fontWeight: '500', lineHeight: 20
labelMd      fontSize: 12, fontWeight: '500', lineHeight: 16
labelSm      fontSize: 10, fontWeight: '500', lineHeight: 14

Font family: System default (SF Pro on iOS, Roboto on Android)
```

## BORDER RADIUS TOKENS
```
none       0
xs         4
sm         8
md         12
lg         16
xl         20
full       9999   (pills, avatars, FABs)
```

## SHADOW / ELEVATION TOKENS
```
card       elevation: 2, shadowColor: #1A1A2E, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: {0, 2}
modal      elevation: 8, shadowColor: #1A1A2E, shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: {0, 8}
fab        elevation: 4, shadowColor: #4F6DF5, shadowOpacity: 0.4,  shadowRadius: 12, shadowOffset: {0, 4}
```

## ICON SYSTEM
```
Library: react-native-vector-icons (MaterialIcons) or @expo/vector-icons
Default size: 24 (standard), 20 (compact), 16 (inline)
Default color: Neutral700 (inactive), Primary (active)
```

## COMPONENT SPECS

### Button (Primary)
```
height: 52
borderRadius: md (12)
backgroundColor: Primary (#4F6DF5)
paddingHorizontal: lg (24)
label: labelLg, color: White
pressed state: backgroundColor PrimaryDark + scale(0.98)
disabled state: backgroundColor Neutral300, color Neutral500
```

### Button (Secondary / Outlined)
```
height: 52
borderRadius: md (12)
borderWidth: 1.5, borderColor: Primary
backgroundColor: White
label: labelLg, color: Primary
```

### Input Field
```
height: 52
borderRadius: sm (8)
backgroundColor: Neutral100
borderWidth: 1, borderColor: Neutral300
focused: borderColor Primary, borderWidth 1.5
paddingHorizontal: md (16)
label above input: labelMd, color Neutral700, marginBottom xs (4)
placeholder: bodyMd, color Neutral500
value text: bodyMd, color Neutral900
```

### Task Card
```
backgroundColor: White
borderRadius: md (12)
padding: md (16)
marginBottom: sm (8)
shadow: card
Left accent bar: width 4, borderRadius xs, color by priority
  High → Danger, Medium → Warning, Low → Success

Title: headingMd, color Neutral900
Subtitle/Description: bodyMd, color Neutral700, marginTop xs
Due date chip: labelSm, Primary, PrimaryLight bg, padding 4x8, borderRadius full
Checkbox: 24x24, borderRadius xs, Primary when checked
```

### Tab Bar
```
height: 64 + safeAreaBottom
backgroundColor: White
borderTopWidth: 1, borderTopColor: Neutral100
Active icon + label: Primary
Inactive icon + label: Neutral500
Label: labelSm
Active indicator: 3x24 pill, Primary, above icon, borderRadius full
```

### Screen Header
```
height: 56
paddingHorizontal: md (16)
backgroundColor: White
Title: headingLg, Neutral900, centered OR left-aligned
Back icon: 24, Neutral700
Right action: 24 icon OR labelLg Primary text
borderBottomWidth: 1, borderBottomColor: Neutral100
```

### Avatar / User Badge
```
size: 40 (standard), 32 (compact), 48 (profile)
borderRadius: full
backgroundColor: PrimaryLight (fallback when no image)
initials: labelMd, Primary
```

### FAB (Floating Action Button)
```
width: 56, height: 56
borderRadius: full
backgroundColor: Primary
icon: 28, White
shadow: fab
position: absolute, bottom: 24 + safeAreaBottom, right: md (16)
```

### Priority Badge
```
borderRadius: full
paddingVertical: xxs (2), paddingHorizontal: xs (4)
High   → bg DangerLight,  text Danger,   label: 'High'
Medium → bg WarningLight, text Warning,  label: 'Medium'
Low    → bg SuccessLight, text Success,  label: 'Low'
font: labelSm
```

## SCREEN DIMENSIONS (reference)
```
Design canvas: 390 x 844 (iPhone 14 Pro)
Safe area top: ~59px (notch/island)
Safe area bottom: ~34px (home indicator)
Content width: 390 - 32 (2 × md padding) = 358px usable
```
