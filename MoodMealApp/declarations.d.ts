// declarations.d.ts
// ============================================================
// Place this file in your project root (or src/ folder)
// Tells TypeScript how to handle SVG file imports
// ============================================================

declare module "*.svg" {
  const content: any
  export default content
}

declare module "*.png" {
  const value: number
  export default value
}

declare module "*.jpg" {
  const value: number
  export default value
}

declare module "*.jpeg" {
  const value: number
  export default value
}

declare module "*.gif" {
  const value: number
  export default value
}

declare module "*.webp" {
  const value: number
  export default value
}
