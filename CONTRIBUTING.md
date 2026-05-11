# Contributing

Thank you for improving Code Converter Studio.

## Setup

```powershell
npm start
```

Then open:

```text
http://127.0.0.1:5173
```

## Development Guidelines

- Keep the app usable as a static website whenever possible.
- Keep the local runner isolated to `server.js`.
- Keep UI changes responsive on desktop and mobile.
- Test export and share behavior after changing output logic.
- Do not commit generated files, logs, or local environment files.

## Pull Requests

Before opening a pull request:

1. Check the page in desktop view.
2. Check the page in mobile view.
3. Test at least one export format.
4. Test the share panel fallback behavior.
5. Confirm the local runner still starts with `npm start`.
