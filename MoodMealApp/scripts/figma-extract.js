#!/usr/bin/env node
/* eslint-env node */
// ============================================================
// figma-extract.js
// Automated Figma → DESIGN_CONTEXT.md extractor
// ============================================================
// SETUP:
//   1. npm install node-fetch dotenv (run once)
//   2. Create .env file with FIGMA_TOKEN=your_token
//      (Get token: Figma → Account Settings → Personal Access Tokens)
//   3. Run: node scripts/figma-extract.js <figma-file-key>
//
// EXAMPLE:
//   node scripts/figma-extract.js 1242943045226413091
//   (the key is the ID in the Figma community URL)
//
// OUTPUT:
//   Prints extracted tokens to console — copy into DESIGN_CONTEXT.md
//   Also writes FIGMA_SCREENS.md with all frame names found
// ============================================================

const fs = require("fs")
const https = require("https")
const path = require("path")

// ---- CONFIG ----
const FIGMA_TOKEN = process.env.FIGMA_TOKEN
const FILE_KEY = process.argv[2]

if (!FIGMA_TOKEN) {
  console.error("❌  Missing FIGMA_TOKEN in environment. Add it to .env")
  process.exit(1)
}
if (!FILE_KEY) {
  console.error("❌  Usage: node scripts/figma-extract.js <figma-file-key>")
  process.exit(1)
}

// ---- HELPERS ----
function figmaGet(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.figma.com",
      path: `/v1/${endpoint}`,
      method: "GET",
      headers: { "X-Figma-Token": FIGMA_TOKEN },
    }
    const req = https.request(options, (res) => {
      let data = ""
      res.on("data", (chunk) => (data += chunk))
      res.on("end", () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          reject(new Error("Failed to parse response"))
        }
      })
    })
    req.on("error", reject)
    req.end()
  })
}

function hexColor(r, g, b) {
  const toHex = (v) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

function collectAllNodes(node, results = []) {
  results.push(node)
  if (node.children) node.children.forEach((c) => collectAllNodes(c, results))
  return results
}

// ---- MAIN ----
async function main() {
  console.log(`\n🔍 Fetching Figma file: ${FILE_KEY}\n`)

  let fileData
  try {
    fileData = await figmaGet(`files/${FILE_KEY}?depth=3`)
  } catch {
    console.error("❌  Failed to fetch file. Check your token and file key.")
    process.exit(1)
  }

  if (fileData.error) {
    console.error("❌  Figma API error:", fileData.status, fileData.err)
    process.exit(1)
  }

  const doc = fileData.document
  console.log(`✅  File: "${fileData.name}"\n`)

  // ---- EXTRACT SCREENS (frames on page) ----
  const screens = []
  const pages = doc.children || []

  pages.forEach((page) => {
    ;(page.children || []).forEach((node) => {
      if (node.type === "FRAME" || node.type === "COMPONENT") {
        screens.push({
          name: node.name,
          id: node.id,
          width: node.absoluteBoundingBox?.width,
          height: node.absoluteBoundingBox?.height,
          page: page.name,
        })
      }
    })
  })

  // ---- EXTRACT COLORS from all nodes ----
  const foundColors = new Set()
  const allNodes = collectAllNodes(doc)

  allNodes.forEach((node) => {
    if (node.fills && Array.isArray(node.fills)) {
      node.fills.forEach((fill) => {
        if (fill.type === "SOLID" && fill.color) {
          const hex = hexColor(fill.color.r, fill.color.g, fill.color.b)
          foundColors.add(hex)
        }
      })
    }
  })

  // ---- EXTRACT TEXT STYLES from all nodes ----
  const foundTextStyles = new Map()

  allNodes.forEach((node) => {
    if (node.type === "TEXT" && node.style) {
      const s = node.style
      const key = `${s.fontSize}-${s.fontWeight}-${s.lineHeightPx}`
      if (!foundTextStyles.has(key)) {
        foundTextStyles.set(key, {
          fontSize: s.fontSize,
          fontWeight: s.fontWeight || 400,
          lineHeight: Math.round(s.lineHeightPx || s.fontSize * 1.4),
          fontFamily: s.fontFamily,
          sample: node.characters?.substring(0, 30),
        })
      }
    }
  })

  // ---- EXTRACT SPACING from frame padding ----
  const foundSpacing = new Set()

  allNodes.forEach((node) => {
    ;["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"].forEach(
      (prop) => {
        if (node[prop] && node[prop] > 0) foundSpacing.add(node[prop])
      },
    )
  })

  // ---- EXTRACT BORDER RADII ----
  const foundRadii = new Set()

  allNodes.forEach((node) => {
    if (node.cornerRadius && node.cornerRadius > 0) foundRadii.add(node.cornerRadius)
    if (node.rectangleCornerRadii) {
      node.rectangleCornerRadii.forEach((r) => {
        if (r > 0) foundRadii.add(r)
      })
    }
  })

  // ---- OUTPUT ----
  const sortedColors = [...foundColors].sort()
  const sortedSpacing = [...foundSpacing].sort((a, b) => a - b)
  const sortedRadii = [...foundRadii].sort((a, b) => a - b)
  const sortedText = [...foundTextStyles.values()].sort((a, b) => b.fontSize - a.fontSize)

  let output = `# DESIGN_CONTEXT.md (AUTO-GENERATED)
# Source: "${fileData.name}"
# Figma file key: ${FILE_KEY}
# Generated: ${new Date().toISOString()}
# ⚠️  Review and rename tokens before using — auto-extraction gives raw values
# ============================================================

## COLOR TOKENS (extracted — name these manually)
`

  sortedColors.forEach((hex, i) => {
    output += `color${String(i + 1).padStart(2, "0")}    ${hex}\n`
  })

  output += `\n## SPACING TOKENS (extracted — map to xs/sm/md/lg/xl)\n`
  sortedSpacing.forEach((v) => {
    output += `${v}px\n`
  })

  output += `\n## BORDER RADIUS TOKENS (extracted)\n`
  sortedRadii.forEach((r) => {
    output += `${r}px\n`
  })

  output += `\n## TYPOGRAPHY TOKENS (extracted — name these manually)\n`
  sortedText.forEach((t) => {
    output += `fontSize: ${t.fontSize}, fontWeight: '${t.fontWeight}', lineHeight: ${t.lineHeight}`
    if (t.sample) output += `    — sample: "${t.sample}"`
    output += "\n"
  })

  output += `\n## SCREENS FOUND (${screens.length} frames)\n`
  screens.forEach((s, i) => {
    output += `${String(i + 1).padStart(2, " ")}. [${s.page}] ${s.name}  (${s.width}×${s.height})  id: ${s.id}\n`
  })

  output += `\n## NEXT STEPS
# 1. Rename color01..colorN to semantic names (primary, background, text, etc.)
# 2. Map spacing values to token names (xs=4, sm=8, md=16, lg=24, xl=32, etc.)
# 3. Name each typography style (displayLg, headingMd, bodyMd, etc.)
# 4. Copy this into DESIGN_CONTEXT.md and fill in the component specs manually
# 5. Use SCREEN IDs above to share deep links with Cursor:
#    https://www.figma.com/file/${FILE_KEY}?node-id=<id>
`

  console.log(output)

  // Write screen list for reference
  const screensMd = `# FIGMA_SCREENS.md (AUTO-GENERATED)
# Use these node IDs to share exact Figma frame links with Cursor
# Link format: https://www.figma.com/file/${FILE_KEY}?node-id=<id>

${screens
  .map(
    (s, i) =>
      `## Screen ${i + 1}: ${s.name}
- Page: ${s.page}
- Size: ${s.width}×${s.height}
- Node ID: ${s.id}
- Deep link: https://www.figma.com/file/${FILE_KEY}?node-id=${encodeURIComponent(s.id)}
`,
  )
  .join("\n")}`

  const screensPath = path.join(process.cwd(), "FIGMA_SCREENS.md")
  fs.writeFileSync(screensPath, screensMd)
  console.log(`\n📄 Screens list written to: FIGMA_SCREENS.md`)
  console.log(`\n✅ Done! Review the output above and paste into DESIGN_CONTEXT.md\n`)
}

main().catch((err) => {
  console.error("❌  Unexpected error:", err.message)
  process.exit(1)
})
