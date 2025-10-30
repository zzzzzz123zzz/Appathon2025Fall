# Config Directory

This directory contains configuration files for API keys and secrets.

## Setup

1. Copy `apiKeys.example.js` to `apiKeys.js`
2. Add your actual API keys to `apiKeys.js`
3. The `.gitignore` file ensures `apiKeys.js` is never committed to git

## Files

- `apiKeys.example.js` - Example template (safe to commit)
- `apiKeys.js` - Your actual keys (gitignored, DO NOT commit)

## Security

⚠️ **NEVER commit actual API keys to git!**

✅ Use `apiKeys.example.js` as a template
✅ Keep actual keys in `apiKeys.js` (gitignored)
✅ Rotate keys regularly (every 90 days)
✅ Set spending limits on API providers
