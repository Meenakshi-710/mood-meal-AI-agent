#!/usr/bin/env node
/* eslint-env node */
// ============================================================
// figma-assets.js
// Automated Figma → React Native assets extractor
// ============================================================
// Extracts and downloads:
//   - All SVG icons/illustrations (as .svg files)
//   - All images/bitmaps (@1x, @2x, @3x PNGs for RN)
//   - All exported components marked for export in Figma
//   - Generates an index file for easy imports
//
// SETUP:
//   npm install node-fetch dotenv (run once)
//   Add to .env: FIGMA_TOKEN=your_personal_access_token
//
// USAGE:
//   node scripts/figma-assets.js <file-key>                    → all assets
//   node scripts/figma-assets.js <file-key> --type=svg        → SVGs only
//   node scripts/figma-assets.js <file-key> --type=png        → PNGs only
//   node scripts/figma-assets.js <file-key> --page=Icons      → one page only
//   node scripts/figma-assets.js <file-key> --scale=2,3       → 2x and 3x only
//   node scripts/figma-assets.js <file-key> --dry-run         → list only, no download
//
// OUTPUT STRUCTURE (React Native ready):
//   src/assets/
//     icons/          → SVG icons (use react-native-svg)
//     images/         → PNG images at 1x/2x/3x
//       logo.png
//       logo@2x.png
//       logo@3x.png
//     illustrations/  → SVG or large PNG illustrations
//     index.ts        → typed export map for all assets
//   ASSETS_REPORT.md  → full manifest with node IDs
// ============================================================

const fs = require("fs")
const http = require("http")
const https = require("https")
const path = require("path")
const { URL } = require("url")

// ---- LOAD ENV ----
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env")
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf-8")
      .split("\n")
      .forEach((line) => {
        const [key, ...vals] = line.split("=")
        if (key && vals.length) process.env[key.trim()] = vals.join("=").trim()
      })
  }
}
loadEnv()

// ---- PARSE ARGS ----
const args = process.argv.slice(2)
const FILE_KEY = args.find((a) => !a.startsWith("--"))
const FLAG = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1]
const HAS_FLAG = (name) => args.includes(`--${name}`)

const FILTER_TYPE = FLAG("type") // 'svg' | 'png' | null (both)
const FILTER_PAGE = FLAG("page") // page name filter
const SCALES = FLAG("scale")?.split(",").map(Number) || [1, 2, 3]
const DRY_RUN = HAS_FLAG("dry-run")
const FIGMA_TOKEN = process.env.FIGMA_TOKEN

const OUT_DIR = path.join(process.cwd(), "src", "assets")
const ICONS_DIR = path.join(OUT_DIR, "icons")
const IMAGES_DIR = path.join(OUT_DIR, "images")
const ILLUS_DIR = path.join(OUT_DIR, "illustrations")

// ---- GUARDS ----
if (!FIGMA_TOKEN) {
  console.error("\n❌  FIGMA_TOKEN not found.")
  console.error("    Add it to .env: FIGMA_TOKEN=your_token")
  console.error("    Get it: Figma → Account Settings → Personal Access Tokens\n")
  process.exit(1)
}
if (!FILE_KEY) {
  console.error("\n❌  Usage: node scripts/figma-assets.js <file-key> [options]\n")
  process.exit(1)
}

// ---- HTTP HELPERS ----
function request(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const isHttps = parsedUrl.protocol === "https:"
    const lib = isHttps ? https : http
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers,
    }
    lib
      .get(options, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return resolve(request(res.headers.location, headers))
        }
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () =>
          resolve({ statusCode: res.statusCode, body: data, headers: res.headers }),
        )
      })
      .on("error", reject)
  })
}

function figmaGet(endpoint) {
  return request(`https://api.figma.com/v1/${endpoint}`, { "X-Figma-Token": FIGMA_TOKEN }).then(
    (r) => JSON.parse(r.body),
  )
}

function downloadBinary(url, destPath) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const lib = parsedUrl.protocol === "https:" ? https : http
    const file = fs.createWriteStream(destPath)
    lib
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close()
          return resolve(downloadBinary(res.headers.location, destPath))
        }
        res.pipe(file)
        file.on("finish", () => {
          file.close()
          resolve()
        })
      })
      .on("error", (err) => {
        fs.unlink(destPath, () => {})
        reject(err)
      })
  })
}

// ---- NAMING HELPERS ----
function toFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

function toCamelCase(name) {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w, i) =>
      i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join("")
}

function normalizeIconAssetName(name) {
  const value = String(name || "").trim()
  // Example conversions:
  // "Iconsax/Broken/lock1"  -> "broken-lock1"
  // "Iconsax/Linear/useradd" -> "linear-useradd"
  const match = value.match(/^iconsax[\/\s_-]*(broken|linear)[\/\s_-]*(.+)$/i)
  if (match?.[1] && match?.[2]) {
    const style = match[1].toLowerCase()
    const iconCore = toFileName(match[2])
    return `${style}-${iconCore}`.replace(/-+/g, "-")
  }

  // Fallback: still remove the generic "iconsax" prefix if present.
  return toFileName(value).replace(/^iconsax-*/i, "")
}

// ---- ASSET CLASSIFIER ----
function classifyNode(node, pageName) {
  const name = node.name || ""
  const lname = name.toLowerCase()
  const pname = (pageName || "").toLowerCase()

  // Determine type
  let assetType = null

  // SVG candidates: components/frames that look like icons
  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET" || node.type === "FRAME") {
    const isSmall =
      node.absoluteBoundingBox &&
      node.absoluteBoundingBox.width <= 64 &&
      node.absoluteBoundingBox.height <= 64

    const isIconPage = pname.includes("icon") || pname.includes("svg")
    const isIconName =
      lname.includes("icon") ||
      lname.includes("ic/") ||
      lname.includes("ic_") ||
      /^ic[_\s-]/.test(lname)

    if (isIconPage || isIconName || (isSmall && node.type === "COMPONENT")) {
      assetType = "icon"
    }
  }

  // Illustration candidates: larger frames/components
  if (!assetType && (node.type === "COMPONENT" || node.type === "FRAME")) {
    const isIllusPage = pname.includes("illus") || pname.includes("illustration")
    const isIllusName =
      lname.includes("illus") || lname.includes("artwork") || lname.includes("hero")
    const isLarge = node.absoluteBoundingBox && node.absoluteBoundingBox.width > 64

    if (isIllusPage || isIllusName) {
      assetType = "illustration"
    } else if (isLarge && node.type === "FRAME" && node.exportSettings?.length > 0) {
      assetType = "image"
    }
  }

  // Explicit export settings → always include
  if (!assetType && node.exportSettings && node.exportSettings.length > 0) {
    const hasSvg = node.exportSettings.some((s) => s.format === "SVG")
    const hasPng = node.exportSettings.some((s) => s.format === "PNG")
    assetType = hasSvg ? "icon" : hasPng ? "image" : "image"
  }

  return assetType
}

// ---- COLLECT EXPORTABLE NODES ----
function collectAssets(node, pageName, assets = []) {
  const type = classifyNode(node, pageName)
  if (type) {
    assets.push({
      id: node.id,
      name: node.name,
      type,
      pageName,
      width: node.absoluteBoundingBox?.width,
      height: node.absoluteBoundingBox?.height,
      hasExportSettings: !!node.exportSettings?.length,
      exportFormats: node.exportSettings?.map((s) => s.format) || [],
    })
  }

  // Don't recurse into icons (they contain sub-shapes we don't want)
  if (type === "icon" || type === "illustration") return assets

  if (node.children) {
    node.children.forEach((child) => collectAssets(child, pageName, assets))
  }
  return assets
}

// ---- DEDUPLICATE ----
function deduplicateAssets(assets) {
  const seen = new Set()
  return assets.filter((a) => {
    const key = `${a.name}::${a.type}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ---- BATCH FETCHER (Figma rate limits: 500 nodes per request) ----
async function getImageUrls(nodeIds, format, scale = 1) {
  const BATCH_SIZE = 100
  const result = {}
  for (let i = 0; i < nodeIds.length; i += BATCH_SIZE) {
    const batch = nodeIds.slice(i, i + BATCH_SIZE)
    const params = `ids=${batch.map(encodeURIComponent).join(",")}&format=${format}${scale !== 1 ? `&scale=${scale}` : ""}`
    process.stdout.write(
      `  Fetching URLs [${i + 1}-${Math.min(i + BATCH_SIZE, nodeIds.length)}/${nodeIds.length}]...\r`,
    )
    const data = await figmaGet(`images/${FILE_KEY}?${params}`)
    if (data.err) {
      console.error(`\n  ⚠️  Figma images API error: ${data.err}`)
      continue
    }
    Object.assign(result, data.images || {})
    // Rate limit safety
    if (i + BATCH_SIZE < nodeIds.length) await sleep(300)
  }
  process.stdout.write("\n")
  return result
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function isAccessErrorResponse(fileData) {
  return Boolean(
    fileData?.error ||
    fileData?.err ||
    (typeof fileData?.status === "number" && fileData.status >= 400),
  )
}

function printAccessErrorAndExit(fileData) {
  const status = fileData?.status
  const rawError = String(fileData?.err || fileData?.message || fileData?.error || "Unknown error")
  const lowered = rawError.toLowerCase()

  console.error(`❌  Cannot access file: ${rawError}${status ? ` (status ${status})` : ""}`)

  if (status === 429 || lowered.includes("rate limit")) {
    console.error("    Cause: Figma API rate limit exceeded.")
    console.error(
      "    Fix: wait ~60 seconds, then retry. Avoid running multiple asset commands back-to-back.",
    )
  } else if (status === 401 || lowered.includes("invalid token")) {
    console.error("    Cause: invalid/expired FIGMA_TOKEN.")
    console.error("    Fix: create a new token in Figma Account Settings and update your .env.")
  } else if (status === 403) {
    console.error("    Cause: token does not have access to this file.")
    console.error(
      "    Fix: duplicate the file into your account or ask for access, then use that file key.",
    )
  } else if (status === 404) {
    console.error("    Cause: file key was not found.")
    console.error("    Fix: verify FIGMA_FILE_KEY or pass the correct key in the command.")
  } else {
    console.error(
      "    Fix: verify token + file key, then retry. If this is a community file, duplicate it into your drafts first.",
    )
  }

  process.exit(1)
}

// ---- ENSURE DIRS ----
function ensureDirs() {
  ;[OUT_DIR, ICONS_DIR, IMAGES_DIR, ILLUS_DIR].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
  })
}

// ---- GENERATE INDEX.TS ----
function generateIndex(downloadedAssets) {
  const icons = downloadedAssets.filter((a) => a.type === "icon")
  const images = downloadedAssets.filter((a) => a.type === "image")
  const illustrations = downloadedAssets.filter((a) => a.type === "illustration")

  let out = `// ============================================================
// src/assets/index.ts — AUTO-GENERATED
// DO NOT EDIT MANUALLY — regenerate with: node scripts/figma-assets.js
// ============================================================\n\n`

  if (icons.length) {
    out += `// Icons (use with react-native-svg)\n`
    icons.forEach((a) => {
      const normalizedName = normalizeIconAssetName(a.name)
      const varName = toCamelCase(normalizedName) + "Icon"
      out += `export { default as ${varName} } from './icons/${normalizedName}.svg';\n`
    })
    out += "\n"
  }

  if (images.length) {
    out += `// Images\nexport const images = {\n`
    images.forEach((a) => {
      const varName = toCamelCase(a.name)
      out += `  ${varName}: require('./images/${toFileName(a.name)}.png'),\n`
    })
    out += `} as const;\n\nexport type ImageName = keyof typeof images;\n\n`
  }

  if (illustrations.length) {
    out += `// Illustrations\nexport const illustrations = {\n`
    illustrations.forEach((a) => {
      const varName = toCamelCase(a.name)
      const ext = a.format === "svg" ? "svg" : "png"
      out += `  ${varName}: require('./illustrations/${toFileName(a.name)}.${ext}'),\n`
    })
    out += `} as const;\n`
  }

  return out
}

// ---- GENERATE REPORT ----
function generateReport(allAssets, downloadedAssets, errors) {
  const ts = new Date().toISOString()
  let md = `# ASSETS_REPORT.md
Generated: ${ts}
Figma file: https://www.figma.com/file/${FILE_KEY}

## Summary
- Total found: ${allAssets.length}
- Downloaded: ${downloadedAssets.length}
- Errors: ${errors.length}

## Downloaded Assets\n\n`

  const byType = {}
  downloadedAssets.forEach((a) => {
    if (!byType[a.type]) byType[a.type] = []
    byType[a.type].push(a)
  })

  Object.entries(byType).forEach(([type, items]) => {
    md += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s (${items.length})\n\n`
    md += `| Name | File | Size | Node ID |\n|------|------|------|---------|\n`
    items.forEach((a) => {
      md += `| ${a.name} | ${a.fileName} | ${a.width}×${a.height} | \`${a.id}\` |\n`
    })
    md += "\n"
  })

  if (errors.length) {
    md += `## Errors (${errors.length})\n\n`
    errors.forEach((e) => (md += `- **${e.name}** (${e.id}): ${e.error}\n`))
    md += "\n"
  }

  md += `## Re-extract a single asset
\`\`\`bash
# Get fresh URL for a specific node:
curl -H "X-Figma-Token: $FIGMA_TOKEN" \\
  "https://api.figma.com/v1/images/${FILE_KEY}?ids=<NODE_ID>&format=svg"
\`\`\`
`

  return md
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log(`\n🎨  Figma Asset Extractor`)
  console.log(`    File: ${FILE_KEY}`)
  console.log(`    Type filter: ${FILTER_TYPE || "all (svg + png)"}`)
  console.log(`    Page filter: ${FILTER_PAGE || "all pages"}`)
  console.log(`    Scales: ${SCALES.join("x, ")}x`)
  console.log(`    Mode: ${DRY_RUN ? "DRY RUN (no downloads)" : "DOWNLOAD"}\n`)

  // ---- FETCH FILE ----
  console.log("📡  Fetching Figma file structure...")
  const fileData = await figmaGet(`files/${FILE_KEY}?depth=4`)

  if (isAccessErrorResponse(fileData)) {
    printAccessErrorAndExit(fileData)
  }

  // Debug: inspect response shape so we know where "name" lives.
  console.log("fileData top-level keys:", Object.keys(fileData))

  const fileName = fileData.name || fileData.document?.name || fileData.meta?.name || FILE_KEY

  console.log(`✅  File: "${fileName}"\n`)

  const pages = fileData.document?.children
  if (!Array.isArray(pages) || pages.length === 0) {
    console.error(
      "No frames found. If this is a Figma Community file, open it at figma.com/community and click 'Open in Figma' to duplicate it to your account first, then use that file's key.",
    )
    process.exit(1)
  }
  console.log(`📄  Pages found: ${pages.map((p) => p.name).join(", ")}\n`)

  // ---- COLLECT ASSETS ----
  let allAssets = []
  pages.forEach((page) => {
    if (FILTER_PAGE && !page.name.toLowerCase().includes(FILTER_PAGE.toLowerCase())) return
    page.children?.forEach((node) => collectAssets(node, page.name, allAssets))
  })

  allAssets = deduplicateAssets(allAssets)

  // Apply type filter
  if (FILTER_TYPE === "svg")
    allAssets = allAssets.filter((a) => a.type === "icon" || a.type === "illustration")
  if (FILTER_TYPE === "png") allAssets = allAssets.filter((a) => a.type === "image")

  console.log(`🔍  Assets found: ${allAssets.length}`)
  console.log(`    Icons/SVGs:      ${allAssets.filter((a) => a.type === "icon").length}`)
  console.log(`    Images/PNGs:     ${allAssets.filter((a) => a.type === "image").length}`)
  console.log(`    Illustrations:   ${allAssets.filter((a) => a.type === "illustration").length}\n`)

  if (allAssets.length === 0) {
    console.log("⚠️   No assets found. Tips:")
    console.log("    - In Figma, select components/frames → right panel → Export → add export")
    console.log('    - Name icon frames with "icon" or "ic_" prefix')
    console.log('    - Put icons on a page named "Icons"')
    console.log("    - Run with --page=<pagename> to target a specific page\n")
    process.exit(0)
  }

  if (DRY_RUN) {
    console.log("DRY RUN — asset list:\n")
    allAssets.forEach((a, i) => {
      console.log(
        `  ${String(i + 1).padStart(3)}. [${a.type.padEnd(12)}] ${a.name} (${a.width}×${a.height}) — id: ${a.id}`,
      )
    })
    console.log("\nRun without --dry-run to download.\n")
    return
  }

  // ---- CREATE OUTPUT DIRS ----
  ensureDirs()

  const downloadedAssets = []
  const errors = []

  // ---- DOWNLOAD SVGs (icons + illustrations) ----
  const svgAssets = allAssets.filter((a) => a.type === "icon" || a.type === "illustration")
  if (svgAssets.length > 0 && FILTER_TYPE !== "png") {
    console.log(`\n⬇️   Downloading ${svgAssets.length} SVG files...`)
    const nodeIds = svgAssets.map((a) => a.id)
    const svgUrls = await getImageUrls(nodeIds, "svg", 1)

    let done = 0
    for (const asset of svgAssets) {
      const url = svgUrls[asset.id]
      if (!url) {
        errors.push({ ...asset, error: "No URL returned by Figma API" })
        done++
        continue
      }

      const baseName =
        asset.type === "icon" ? normalizeIconAssetName(asset.name) : toFileName(asset.name)
      const fileName = baseName + ".svg"
      const destDir = asset.type === "icon" ? ICONS_DIR : ILLUS_DIR
      const destPath = path.join(destDir, fileName)

      try {
        await downloadBinary(url, destPath)
        downloadedAssets.push({ ...asset, fileName, format: "svg" })
        done++
        process.stdout.write(`  [${done}/${svgAssets.length}] ✓ ${fileName}\r`)
      } catch (err) {
        errors.push({ ...asset, error: err.message })
        done++
      }
      await sleep(50) // gentle rate limiting
    }
    process.stdout.write("\n")
    console.log(
      `  ✅  SVGs done: ${downloadedAssets.filter((a) => a.format === "svg").length} files\n`,
    )
  }

  // ---- DOWNLOAD PNGs at multiple scales ----
  const pngAssets = allAssets.filter((a) => a.type === "image")
  if (pngAssets.length > 0 && FILTER_TYPE !== "svg") {
    console.log(
      `⬇️   Downloading ${pngAssets.length} images × ${SCALES.length} scales (${SCALES.map((s) => s + "x").join(", ")})...`,
    )
    const nodeIds = pngAssets.map((a) => a.id)

    for (const scale of SCALES) {
      console.log(`\n  Scale: ${scale}x`)
      const pngUrls = await getImageUrls(nodeIds, "png", scale)

      let done = 0
      for (const asset of pngAssets) {
        const url = pngUrls[asset.id]
        if (!url) {
          if (scale === 1) errors.push({ ...asset, error: "No URL returned by Figma API" })
          done++
          continue
        }

        const baseName = toFileName(asset.name)
        const suffix = scale === 1 ? "" : `@${scale}x`
        const fileName = `${baseName}${suffix}.png`
        const destPath = path.join(IMAGES_DIR, fileName)

        try {
          await downloadBinary(url, destPath)
          if (scale === 1) downloadedAssets.push({ ...asset, fileName, format: "png" })
          done++
          process.stdout.write(`  [${done}/${pngAssets.length}] ✓ ${fileName}\r`)
        } catch (err) {
          if (scale === 1) errors.push({ ...asset, error: err.message })
          done++
        }
        await sleep(50)
      }
      process.stdout.write("\n")
    }
    console.log(
      `\n  ✅  PNGs done: ${downloadedAssets.filter((a) => a.format === "png").length} files × ${SCALES.length} scales\n`,
    )
  }

  // ---- GENERATE INDEX.TS ----
  const indexContent = generateIndex(downloadedAssets)
  const indexPath = path.join(OUT_DIR, "index.ts")
  fs.writeFileSync(indexPath, indexContent)
  console.log(`📝  Generated: src/assets/index.ts`)

  // ---- GENERATE REPORT ----
  const reportContent = generateReport(allAssets, downloadedAssets, errors)
  const reportPath = path.join(process.cwd(), "ASSETS_REPORT.md")
  fs.writeFileSync(reportPath, reportContent)
  console.log(`📄  Report:    ASSETS_REPORT.md`)

  // ---- FINAL SUMMARY ----
  console.log(`\n${"═".repeat(50)}`)
  console.log(`DONE`)
  console.log(`  ✅  Downloaded: ${downloadedAssets.length} assets`)
  if (errors.length) console.log(`  ❌  Errors:     ${errors.length} (see ASSETS_REPORT.md)`)
  console.log(`\nOutput: src/assets/`)
  console.log(`  icons/         ${downloadedAssets.filter((a) => a.type === "icon").length} SVGs`)
  console.log(
    `  images/        ${downloadedAssets.filter((a) => a.type === "image").length} PNGs (${SCALES.length} scales each)`,
  )
  console.log(
    `  illustrations/ ${downloadedAssets.filter((a) => a.type === "illustration").length} files`,
  )
  console.log(`  index.ts       typed export map\n`)

  if (downloadedAssets.filter((a) => a.type === "icon").length > 0) {
    console.log(`💡  SVG usage in React Native:`)
    console.log(`    1. npm install react-native-svg`)
    console.log(`    2. npm install --save-dev react-native-svg-transformer`)
    console.log(`    3. In metro.config.js: use SvgTransformer`)
    console.log(`    4. import { homeIcon } from '@/assets'  ← typed, auto-completed\n`)
  }
}

main().catch((err) => {
  console.error("\n❌  Fatal error:", err.message)
  if (err.message.includes("ENOTFOUND")) {
    console.error("    Network error — check your internet connection")
  }
  process.exit(1)
})
