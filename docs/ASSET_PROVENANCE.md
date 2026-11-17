# Public asset provenance register

Reviewed 2026-11-17. Public release is blocked until every unresolved food image has source/author/license and redistribution permission evidence. No image was deleted or replaced during this audit. Hashes identify the reviewed bytes; they do not grant rights.

| Asset | SHA-256 | Evidence / decision |
|---|---|---|
| public/icons/icon-192.png | 2bf5b0fd06649dfdb89b184093fdb806b0fcf058b78c091ab3267983ef566fa7 | Original geometric S generator; byte-for-byte reproduction verified using scripts/generate-pwa-icons.mjs --check. |
| public/icons/icon-512.png | c4fd25495c0cfee54892e3e2dc75c74e3cc4598f11fbddb3722ccc5d5d3365ca | Original geometric S generator; byte-for-byte reproduction verified using scripts/generate-pwa-icons.mjs --check. |
| public/icons/maskable-512.png | 88319bbb9cd1621499dda4da4e8614b53a682c65b238b7e363014436695796b3 | Original geometric S generator; byte-for-byte reproduction verified using scripts/generate-pwa-icons.mjs --check. |
| public/images/biryani.jpg | 227a80a71aa4e4824f8bf84a10232763054b3760b35139356cb785f0e285636c | UNVERIFIED: author, original source and usage/redistribution license required. Do not publish yet. |
| public/images/burger.jpg | bb378e516c801dccc7f3a3d6e3068afaa017c7207f12c1586f069c8980ffa000 | UNVERIFIED: author, original source and usage/redistribution license required. Do not publish yet. |
| public/images/chicken-65.jpg | 54ad3f0ed38f84954551042dadd5faf65272d37aacb30a6ad6624a0d9e2cef50 | UNVERIFIED: author, original source and usage/redistribution license required. Do not publish yet. |
| public/images/gulab-jamun.jpg | 961e9bf698d02675ce5d68564547673c41da63c55c8a907d0be6d20bdd926507 | UNVERIFIED: author, original source and usage/redistribution license required. Do not publish yet. |
| public/images/hero-biryani.jpg | e9da9c0b86fc6cc3204e47a71aa1a1008aca07628604eebef9688f3761860d59 | UNVERIFIED: author, original source and usage/redistribution license required. Do not publish yet. |
| public/images/masala-dosa.jpg | e28ce6205947c6737fa16346ed9456d25cec2fdc8152442aabd494bedfa19046 | UNVERIFIED: author, original source and usage/redistribution license required. Do not publish yet. |
| public/images/paneer-butter-masala.jpg | 4bbe19fd0b515823076e7f20f3fc2b98233f84917ed4c9757170b4cca7bd220d | UNVERIFIED: author, original source and usage/redistribution license required. Do not publish yet. |

All reviewed PNG/JPEG files have no EXIF, IPTC or XMP blocks. This does not prove copyright clearance. No FirstClub reference archive, HTML, logo or companion asset directory is tracked; the seven existing food photos still need independent proof.

## Third-party presentation dependencies

- DM Sans and Playfair Display are loaded from Google Fonts; font binaries are not vendored. Upstream source confirms SIL Open Font License 1.1: [DM Sans](https://github.com/google/fonts/blob/main/ofl/dmsans/OFL.txt), [Playfair Display](https://github.com/google/fonts/blob/main/ofl/playfairdisplay/OFL.txt). Preserve the applicable notices/license if later bundling font files.
- Lucide React is imported through the locked npm dependency. The installed package includes ISC terms and Feather-derived MIT notices; preserve that exact package license when distributing built dependencies. The upstream [Lucide license](https://github.com/lucide-icons/lucide/blob/main/LICENSE) is a reference; it does not replace the version-specific package notice.
- Other npm dependencies are installed from the lockfile; node_modules and build outputs are excluded from Git. This is not a full distributable dependency-license certification. No project-wide open-source license is assumed or invented. Owner/client publication approval remains required.
