# GitHub Helper

A Chrome extension (Manifest V3) built with TypeScript + Vite + React.

> Purpose TBD — scaffold only for now.

## Development

```bash
npm install
npm run dev      # Vite dev server with HMR
```

Then load the extension in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder (run `npm run build` first),
   or point it at the Vite dev output while `npm run dev` is running.

## Build

```bash
npm run build    # type-check + produce dist/
```

The packaged extension is emitted to `dist/`.

## Structure

```
manifest.json        MV3 manifest (entry points)
src/background.ts     service worker
src/content.ts        content script (github.com/*)
src/popup/            React popup UI
vite.config.ts        Vite + @crxjs/vite-plugin
```

## License

MIT
