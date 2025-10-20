# DeepWiki Integration

AI-powered documentation search integrated into the KubeVela documentation site.

## Current Implementation

### Search Options
1. **Algolia Search** (built-in)
   - Traditional keyword search via search bar or `cmd+K`

2. **"Ask Devin" Link** (navbar, right side)
   - Icon + text in navbar (docusaurus.config.js:90-94)
   - Opens DeepWiki AI search in new tab

3. **DeepWiki Badge** (README.md:3)
   - Auto-refreshes DeepWiki docs when present

## Files

### Active Implementation
- `docusaurus.config.js` (lines 90-94) - Navbar link configuration
- `static/img/deepwiki-icon.svg` - Icon file
- `README.md` (line 3) - DeepWiki badge

### Optional Dropdown Component (Not Active)
If you want a dropdown with both search options:
- `src/theme/NavbarItem/ComponentTypes.js`
- `src/theme/NavbarItem/DeepWikiSearchNavbarItem.jsx`
- `src/theme/NavbarItem/DeepWikiSearchNavbarItem.module.css`

Enable by adding to `docusaurus.config.js` before line 90:
```javascript
{
  type: 'custom-deepwiki-search',
  position: 'right',
},
```

## Customization

### Change text label
Edit line 93 in `docusaurus.config.js`, update `<span>` content

### Icon only (no text)
Remove the `<span>Ask Devin</span>` from line 93

### Change URL
Update `href` value in line 93

### Styling
Add CSS for `.header-deepwiki-link` in `src/css/custom.scss`

## Resources

- [DeepWiki for KubeVela](https://deepwiki.com/kubevela/kubevela)
- [DeepWiki Official Site](https://deepwiki.com/)
