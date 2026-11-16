# Sanjay Gupta — Personal Portfolio

Source code for my personal portfolio website, hosted on GitHub Pages.

**Live site:** https://sanjaywe6.github.io/sanjayweb/

## About

I'm a cybersecurity engineer working in application security, vulnerability research and secure backend development. This site covers my work across:

- Web and API security (OWASP Top 10, authentication, session security)
- Offensive security and penetration testing
- Vulnerability research and responsible disclosure
- Security automation and backend engineering in Python
- Linux server hardening and infrastructure security

## Tech Stack

- HTML, CSS and vanilla JavaScript
- No frameworks, no build step and no runtime dependencies
- Deployed to GitHub Pages with GitHub Actions

## Project Structure

```
.
├── index.html                  # Single-page site (all content lives here)
├── assets/
│   ├── css/style.css           # Styles, animations, responsive layout
│   ├── js/main.js              # Terminal, navigation, lightbox and other interactions
│   └── img/
│       ├── portrait.webp       # Hero portrait (background removed; animated in main.js)
│       ├── certs/              # Optimized WebP certificate images and thumbnails
│       ├── favicon.svg         # Favicons and Open Graph image
│       └── og-image.png
└── .github/
    └── workflows/
        └── static.yml          # GitHub Pages deployment workflow
```

## Running Locally

The site is static, so you can open `index.html` in a browser directly. To serve it locally:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Deployment

Every push to `main` runs the [Deploy static content to Pages](.github/workflows/static.yml) workflow, which publishes the repository to GitHub Pages. You can also start the workflow manually from the **Actions** tab.

All asset paths are relative, so the site works when served from the `/sanjayweb/` project subpath.

## Credits

Tool and technology icons come from [Simple Icons](https://simpleicons.org) (CC0-1.0). The source SVGs are in `assets/img/icons/` and are inlined as a sprite in `index.html`. All trademarks belong to their respective owners.

## License

© Sanjay Gupta. All rights reserved. The content, certificates and personal information in this repository may not be reused without permission.
