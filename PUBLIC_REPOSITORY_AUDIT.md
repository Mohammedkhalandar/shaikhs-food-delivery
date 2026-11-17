# Public repository security audit — 2026-11-17

**Decision: NO — do not change visibility.** The private repository remains a local-development candidate, not an approved public release.

## Scope and file completeness

Reviewed all 272 tracked files and all 274 unique reachable blobs across the two existing commits: `251e3bfeb6be5d4b3e96a50b534b6c79819ec807` and `f751270e43c36f10fddeda200da02a03914ba21b`. Repeated identical blobs were inspected once and mapped to both trees. Reviewed commit author/committer metadata, documentation, source/configuration/fixtures, the 10 image binaries and their metadata. New audit fixes receive a staged scan before committing.

The customer redesign, ordering APIs, role dashboards, Prisma schema, all 15 migration SQL files, 26 test files, package lockfile, CI workflow, README, environment example, setup/deployment instructions and PWA assets are tracked. No required source file in the audited completeness checklist is missing. Root project licensing/owner redistribution approval and the food-photo provenance evidence are missing release evidence, not missing application code.

## Findings and fixes

| Area | Evidence and status |
|---|---|
| Provider credentials, private keys and database exports | No real credential/private-key/dump found in the scanned reachable files. `.env.example` contains placeholders; actual environments, backups, evidence, certificates and private tailnet policy files are ignored. Pattern scans and manual candidate review are evidence, not a mathematical guarantee that no secret can exist. |
| Credential-like fixtures | Reviewed provider negative-test keys, mock secrets, synthetic database URLs, generated UUID passwords and reserved example email/domain strings. These are test data, not functioning external credentials. Loopback addresses, CI service URLs, RFC1918 examples and dependency version strings are intentional; they are not discovered private network endpoints. |
| Commit metadata — BLOCKER | Both existing commits contain the developer's personal author/committer name and email. A later commit cannot remove these from history. No private email value is reproduced in this report. Configure a GitHub-confirmed no-reply identity for future commits and obtain a separately authorized history/publication decision before public release. |
| Operational reports — BLOCKER in old history | Existing reports retained a real development-host label. Current copies replace it with a generic host placeholder; the literal compiled tailnet IPv6 range is also replaced. Original operator evidence stays in ignored private artifacts. The two earlier commits still retain the old text. No actual Serve hostname, full host IP, credential or personal filesystem path was found by this audit's tracked-content patterns. |
| CI-generated secrets | Earlier CI logs printed generated disposable-only JWT/mail/backup key values after GITHUB_ENV export. They were not production/provider credentials or committed keys. The workflow now masks each generated key before export. Historical run logs/artifacts need a separate private review/removal decision before public visibility; a normal source commit does not sanitize old logs. |
| Images — BLOCKER | All 10 public image binaries are normal PNG/JPEG assets without EXIF/IPTC/XMP blocks. The three original PWA icons reproduce byte-for-byte from the recovered original generator, now included in source. None of the seven food JPEGs has sufficient author/source/license/redistribution evidence. Retain privately until permission is documented or replace with cleared originals; replacement alone does not remove old copies from history. See [asset provenance](docs/ASSET_PROVENANCE.md). |
| FirstClub reference | No reference HTML/archive, FirstClub-branded product code, logos or companion image directory is tracked. Documentation names the supplied visual reference, which is not itself a copied asset. Food-photo provenance remains unverified; lack of a brand-string match cannot establish their legal origin. |
| Migration preservation | Six applied SQL files had lost original mixed line endings during initial publication. Their exact original bytes were recovered by matching existing stored checksums without changing any database row/history. Git attributes now prevent SQL newline conversion; keep this preservation fix. Never reformat applied SQL, reset databases or alter recorded checksums to silence diagnostics. |

## Required public-release remediation

1. Keep the repository PRIVATE. Obtain owner/client approval for publishing the application and choose an appropriate project license; this audit grants no redistribution rights.
2. Supply asset-by-asset proof for all food images, or replace them with cleared original/licensed assets and plan removal of uncleared historical copies. Preserve the local application and original private evidence.
3. Decide whether personal commit identity/old operational text may be public. If not, separately authorize a private backup and a coordinated history sanitization or a newly prepared clean public repository. Review every branch/tag/ref and avoid publishing old objects. This task performs no history rewrite, force-push, repository deletion or visibility change. A normal corrective commit is insufficient to clean earlier commits.
4. Review historical Actions logs/artifacts privately, including printed disposable keys, screenshots and fixture evidence. Remove affected records only with explicit approval; retest masking on a new run. No claim is made that historical logs have been deleted.
5. If a real credential is subsequently identified, revoke/rotate it first, inspect its usage, then use an explicitly approved history-cleanup procedure (for example git-filter-repo), coordinate clones/forks and GitHub cached references, rescan all refs and rerun checks. No real credential identified here requires an invented rotation or a database-password reset.
6. Complete release checks and inspect the pushed candidate's actual Actions conclusion. The previous CI run succeeded; that is not evidence for unpushed changes. The interrupted local build had a Windows Prisma DLL lock; a local migration-validator attempt correctly refused the already-populated database because it requires a NEW empty disposable target. Neither failure is a passed check or authorization to reset existing data.

The unrelated private-demo documentation changes present at audit start are preserved locally. No database, Docker, payment, messaging, payout or public-deployment setting is changed by this audit.

## Executed audit checks

17 focused tests passed; TypeScript, Prisma validation, zero-warning full ESLint, static CI guard, icon-byte reproduction and an actual Bash execution of the CI-key generation/masking block passed. Staged-file plus reachable-history pattern scan: no unreviewed credential findings; the manually confirmed privacy/copyright blockers above remain unresolved. No full production-build success is claimed for this candidate. Prior unrelated private-demo documentation remains unstaged.
