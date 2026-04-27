# Welcome to your new tequity app!

> The latest and greatest boilerplate for Tequity opinions

This is the boilerplate that [Tequity](https://tequity.io) uses as a way to test bleeding-edge changes to our React Native stack.

- [Quick start documentation](https://github.com/rohits-tequity/-tequity-rn-cli/blob/master/docs/boilerplate/Boilerplate.md)
- [Full documentation](https://github.com/rohits-tequity/-tequity-rn-cli/blob/master/docs/README.md)

## Getting Started

```bash
npm run
npm run start
```

To make things work on your local simulator, or on your phone, you need first to [run `eas build`](https://github.com/rohits-tequity/-tequity-rn-cli/blob/master/docs/expo/EAS.md). We have many shortcuts on `package.json` to make it easier:

```bash
npm run build:ios:sim # build for ios simulator
npm run build:ios:device # build for ios device
npm run build:ios:prod # build for ios device
```

## Figma Asset Workflow (AI setup)

This project includes scripts and files for syncing assets from Figma into `src/assets`.

### 1) Configure `.env`

Copy `.env.example` to `.env` and fill in:

- `FIGMA_TOKEN` (Figma personal access token)
- `FIGMA_FILE_KEY` (optional, for one-command sync)
- `FIGMA_FILE_URL` (optional reference)

If your design is from Figma Community, duplicate it into your account first:

1. Open the community file page
2. Click **Open in Figma**
3. Use the duplicated file's URL/key in this project

### 2) Fetch assets manually

```bash
# list assets only (no download)
npm run figma:dry -- <figma-file-key>

# download SVG + PNG assets into src/assets
npm run figma:assets -- <figma-file-key>

# svg-only or png-only
npm run figma:assets:svg -- <figma-file-key>
npm run figma:assets:png -- <figma-file-key>
```

### 3) Sync latest assets via `.env`

After setting `FIGMA_FILE_KEY` in `.env`:

```bash
npm run figma:sync
```

This re-pulls latest UI assets and updates:

- `src/assets/icons/`
- `src/assets/images/`
- `src/assets/index.ts`
- `ASSETS_REPORT.md`

### Edge cases / troubleshooting

- **No frames found**: likely a community file not duplicated to your account yet.
- **Invalid token / access error**: verify `FIGMA_TOKEN` and file permissions.
- **No assets found**: ensure target nodes have export settings in Figma and/or use `--page`.
- **Need specific screen only**: run with `--page=<page-name>` in the underlying script command.

### Local generation error (from CLI repo)

If you are generating this app from a local Tequity CLI clone and see:

```text
Error: Destination path already exists /.../myNewFigmaTestApp/metro.config.js
```

your target folder already contains files from a previous run.

Use:

```bash
npm run tequtiy-cli:dev -- new myNewFigmaTestApp --overwrite=true
```

or choose a new output path/app name.

### Default and custom output paths (when generating from CLI)

By default, Tequity CLI creates apps in:

```bash
./projects/<AppName>
```

You can override this with `--target-path`:

```bash
# absolute path
npm run tequtiy-cli:dev -- new MyApp --target-path=/Users/me/work/MyApp

# relative path
npm run tequtiy-cli:dev -- new MyApp --target-path=../MyApp

# home path
npm run tequtiy-cli:dev -- new MyApp --target-path=~/apps/MyApp
```

Path/copy edge-case handling:

- Parent folders are created automatically when possible.
- Existing destination folders are blocked by default.
- Use `--overwrite=true` to replace existing destination folders.
- Boilerplate + AI workflow files are copied consistently for custom paths too.
- If you see permission errors, choose a writable location or adjust OS permissions.

### `./assets`

This directory is designed to organize and store various assets, making it easy for you to manage and use them in your application. The assets are further categorized into subdirectories, including `icons` and `images`:

```tree
assets
├── icons
└── images
```

**icons**
This is where your icon assets will live. These icons can be used for buttons, navigation elements, or any other UI components. The recommended format for icons is PNG, but other formats can be used as well.

Tequity comes with a built-in `Icon` component. You can find detailed usage instructions in the [docs](https://github.com/rohits-tequity/-tequity-rn-cli/blob/master/docs/boilerplate/app/components/Icon.md).

**images**
This is where your images will live, such as background images, logos, or any other graphics. You can use various formats such as PNG, JPEG, or GIF for your images.

Another valuable built-in component within Tequity is the `AutoImage` component. You can find detailed usage instructions in the [docs](https://github.com/rohits-tequity/-tequity-rn-cli/blob/master/docs/Components-AutoImage.md).

How to use your `icon` or `image` assets:

```typescript
import { Image } from 'react-native';

const MyComponent = () => {
  return (
    <Image source={require('assets/images/my_image.png')} />
  );
};
```

## Running Maestro end-to-end tests

Follow our [Maestro Setup](https://tequtiycookbook.com/docs/recipes/MaestroSetup) recipe.

## Next Steps

### Tequtiy Cookbook

[Tequtiy Cookbook](https://tequtiycookbook.com/) is an easy way for developers to browse and share code snippets (or “recipes”) that actually work.

### Upgrade Tequity boilerplate

Read our [Upgrade Guide](https://tequtiycookbook.com/docs/recipes/UpdatingTequtiy) to learn how to upgrade your Tequity project.

## Community

⭐️ Help us out by [starring on GitHub](https://github.com/rohits-tequity/-tequity-rn-cli), filing bug reports in [issues](https://github.com/rohits-tequity/-tequity-rn-cli/issues) or [ask questions](https://github.com/rohits-tequity/-tequity-rn-cli/discussions).

💬 Join us on [Slack](https://join.slack.com/t/infiniteredcommunity/shared_invite/zt-1f137np4h-zPTq_CbaRFUOR_glUFs2UA) to discuss.

📰 Make our Editor-in-chief happy by [reading the React Native Newsletter](https://reactnativenewsletter.com/).
