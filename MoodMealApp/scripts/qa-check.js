#!/usr/bin/env node
// ============================================================
// qa-check.js
// Scans your src/ folder for design violations:
//   - Hardcoded colors (hex codes not from theme)
//   - Hardcoded spacing (raw pixel numbers not from theme)
//   - Inline styles
// ============================================================
// USAGE:
//   node scripts/qa-check.js              → scan all src/
//   node scripts/qa-check.js HomeScreen   → scan one screen
// ============================================================

const fs = require("fs")
const path = require("path")

const TARGET = process.argv[2] || ""
const SRC_DIR = path.join(process.cwd(), "src")

// ---- RULES ----
const RULES = [
  {
    name: "Hardcoded hex color",
    pattern: /#[0-9A-Fa-f]{3,8}(?=['",\s])/g,
    severity: "ERROR",
    fix: "Replace with colors.[token] from src/theme/colors.ts",
  },
  {
    name: "Hardcoded rgb/rgba color",
    pattern: /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g,
    severity: "ERROR",
    fix: "Replace with colors.[token] from src/theme/colors.ts",
  },
  {
    name: "Inline style object",
    pattern: /style=\{\{/g,
    severity: "WARN",
    fix: "Move to StyleSheet.create in *.styles.ts file",
  },
  {
    name: "Hardcoded font size",
    pattern: /fontSize:\s*\d+(?!\s*\/\/\s*ok)/g,
    severity: "ERROR",
    fix: "Replace with typography.[token].fontSize from src/theme/typography.ts",
  },
  {
    name: "Hardcoded font weight string",
    pattern: /fontWeight:\s*['"][0-9]{3}['"]/g,
    severity: "WARN",
    fix: "Replace with typography.[token].fontWeight from src/theme/typography.ts",
  },
  {
    name: "Hardcoded padding/margin number (likely raw px)",
    pattern: /(?:padding|margin)(?:Top|Right|Bottom|Left|Horizontal|Vertical)?:\s*(?!0\b)\d{2,}/g,
    severity: "WARN",
    fix: "Replace with spacing.[token] from src/theme/spacing.ts",
  },
  {
    name: "Missing accessibilityLabel on Pressable",
    pattern: /<Pressable(?![^>]*accessibilityLabel)/g,
    severity: "WARN",
    fix: "Add accessibilityLabel prop to every Pressable",
  },
  {
    name: "Using TouchableOpacity (prefer Pressable)",
    pattern: /TouchableOpacity/g,
    severity: "INFO",
    fix: "Consider migrating to Pressable for consistency",
  },
  {
    name: "Direct Firebase call in screen (not in service)",
    pattern: /(?:getDatabase|ref|get|set|push|onValue)\(/g,
    severity: "ERROR",
    fix: "Move Firebase calls to src/services/firebase/*.ts",
  },
  {
    name: "TypeScript any type",
    pattern: /:\s*any(?:\s|;|,|\))/g,
    severity: "WARN",
    fix: "Replace with a proper TypeScript type",
  },
  {
    name: "console.log (remove before commit)",
    pattern: /console\.log\(/g,
    severity: "INFO",
    fix: "Remove or replace with a logger utility",
  },
]

// ---- FILE SCANNER ----
function getAllFiles(dir, exts = [".ts", ".tsx"], files = []) {
  if (!fs.existsSync(dir)) return files
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) getAllFiles(fullPath, exts, files)
    else if (exts.some((e) => file.endsWith(e))) files.push(fullPath)
  })
  return files
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8")
  const lines = content.split("\n")
  const issues = []

  RULES.forEach((rule) => {
    lines.forEach((line, i) => {
      const matches = [...line.matchAll(rule.pattern)]
      matches.forEach((match) => {
        // Skip comments and imports
        const trimmed = line.trim()
        if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("import"))
          return
        // Skip theme files themselves
        if (filePath.includes("/theme/")) return

        issues.push({
          severity: rule.severity,
          rule: rule.name,
          line: i + 1,
          col: match.index + 1,
          code: line.trim().substring(0, 80),
          fix: rule.fix,
        })
      })
    })
  })

  return issues
}

// ---- SCREEN STATE CHECK ----
function checkScreenStates(filePath, content) {
  const warnings = []
  const isScreen = filePath.includes("/screens/")
  if (!isScreen) return warnings

  if (!content.includes("isLoading") && !content.includes("loading")) {
    warnings.push({
      severity: "WARN",
      rule: "Missing loading state",
      line: 1,
      col: 1,
      code: "(whole file)",
      fix: "Add isLoading state with ActivityIndicator",
    })
  }
  if (!content.includes("empty") && !content.includes("Empty") && content.includes("FlatList")) {
    warnings.push({
      severity: "WARN",
      rule: "FlatList missing empty state",
      line: 1,
      col: 1,
      code: "(whole file)",
      fix: "Add ListEmptyComponent to FlatList",
    })
  }
  if (!content.includes("keyExtractor") && content.includes("FlatList")) {
    warnings.push({
      severity: "ERROR",
      rule: "FlatList missing keyExtractor",
      line: 1,
      col: 1,
      code: "(whole file)",
      fix: "Add keyExtractor prop to FlatList",
    })
  }

  return warnings
}

// ---- MAIN ----
function main() {
  const allFiles = getAllFiles(SRC_DIR).filter(
    (f) =>
      !f.includes("node_modules") &&
      !f.includes("__tests__") &&
      (TARGET === "" || f.includes(TARGET)),
  )

  console.log(
    `\n🔍 QA Check — scanning ${allFiles.length} files${TARGET ? ` matching "${TARGET}"` : ""}\n`,
  )

  let totalErrors = 0
  let totalWarns = 0
  let totalInfo = 0
  const fileResults = []

  allFiles.forEach((filePath) => {
    let content
    try {
      content = fs.readFileSync(filePath, "utf-8")
    } catch {
      return
    }

    const issues = [...scanFile(filePath), ...checkScreenStates(filePath, content)]

    if (issues.length > 0) {
      fileResults.push({ file: filePath.replace(SRC_DIR, "src"), issues })
      issues.forEach((i) => {
        if (i.severity === "ERROR") totalErrors++
        if (i.severity === "WARN") totalWarns++
        if (i.severity === "INFO") totalInfo++
      })
    }
  })

  // ---- PRINT RESULTS ----
  fileResults.forEach(({ file, issues }) => {
    console.log(`📄 ${file}`)
    issues.forEach((issue) => {
      const icon = issue.severity === "ERROR" ? "❌" : issue.severity === "WARN" ? "⚠️ " : "ℹ️ "
      console.log(`   ${icon} [${issue.severity}] Line ${issue.line}: ${issue.rule}`)
      console.log(`      Code: ${issue.code}`)
      console.log(`      Fix:  ${issue.fix}`)
    })
    console.log("")
  })

  // ---- SUMMARY ----
  console.log("─".repeat(60))
  console.log(`SUMMARY:`)
  console.log(`  ❌ Errors:   ${totalErrors}  (must fix before commit)`)
  console.log(`  ⚠️  Warnings: ${totalWarns}  (should fix)`)
  console.log(`  ℹ️  Info:     ${totalInfo}  (nice to fix)`)
  console.log(`  📄 Files with issues: ${fileResults.length} / ${allFiles.length}`)

  if (totalErrors === 0 && totalWarns === 0) {
    console.log("\n✅  All checks passed! Safe to commit.\n")
  } else if (totalErrors === 0) {
    console.log("\n🟡  No errors, but review warnings before committing.\n")
  } else {
    console.log("\n🔴  Errors found. Fix them before committing.\n")
    process.exit(1)
  }
}

main()
