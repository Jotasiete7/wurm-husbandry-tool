# Wurm Husbandry Tool

A web tool to keep a herd ledger for [Wurm Online](https://www.wurmonline.com/) animal husbandry: register creatures, scan traits, and track pregnancies in the browser.

The animal catalog, trait abbreviations, and breeding rules follow the husbandry screens of the deed manager prototype.

## Features

- **Herd register**: name, type, sex, age, condition, parents, traits, and notes
- **Trait shorthand**: counts by category (`4D2M`) with the full examine lines on hover
- **Filters**: search by name and filter by creature type
- **Breeding**: pair mature (or older) animals and record remaining pregnancy time
- **Pregnant table**: sire, traits, and a countdown until the due time
- **Local save**: the herd stays in `localStorage` (`wurm-husbandry-tool-state`)
- **Languages**: English, Portuguese, and Russian
- **A Guilda ecosystem**: shared header and tool switcher

## Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

```bash
npm run build
npm run preview
```

## Tech stack

- React 18
- TypeScript
- Vite
- Tailwind CSS

## Related tools

- [Wurm Carpentry Tool](https://wurm-carpentry-tool.pages.dev/)
- [Wurm Prospect Tool](https://wurm-prospect-tool.pages.dev/)

## Credits

- Creature list and traits based on the deed manager husbandry prototype and [Wurmpedia — Animal husbandry](https://www.wurmpedia.com/index.php/Animal_husbandry)
- Developed by [A Guilda](https://wurm-aguild-site.pages.dev)

## License

MIT
