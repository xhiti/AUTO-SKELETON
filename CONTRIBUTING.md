# Contributing to @xhiti/auto-skeleton

Thank you for wanting to contribute! This guide covers our branching strategy, development workflow, and release process.

---

## 🌿 Branch Strategy

We use a **3-branch promotion model**:

```
development  →  staging  →  production
  (code)       (test)      (release + npm publish)
```

| Branch | Purpose | Auto-deploys |
|--------|---------|-------------|
| `development` | Active development. All feature branches merge here. | CI runs (typecheck + build) |
| `staging` | Pre-release testing. Merge `development` → `staging` when ready to test. | CI runs (typecheck + build) |
| `production` | Stable releases. Merge `staging` → `production` to release. | **Publishes to npm** + creates GitHub Release |

### Flow

```
feature/my-feature  ──PR──▶  development  ──PR──▶  staging  ──PR──▶  production
                              (develop)           (test)           (release)
```

1. **Create a feature branch** from `development`
2. **Open a PR** to `development` — CI validates typecheck + build
3. **Merge PR** into `development`
4. **When ready to test**: Open a PR from `development` → `staging`
5. **Test on staging** — run manual/automated tests
6. **When ready to release**: Open a PR from `staging` → `production`
7. **Merge to production** triggers automatic npm publish

---

## 🚀 Development Workflow

### 1. Clone and setup

```bash
git clone https://github.com/xhiti/auto-skeleton.git
cd auto-skeleton
npm install
```

### 2. Create a feature branch

```bash
git checkout development
git pull origin development
git checkout -b feature/my-feature
```

### 3. Make your changes

Edit files in `src/`. The main component is in `src/index.tsx`.

### 4. Validate locally

```bash
# TypeScript check
npm run typecheck

# Build the package
npm run build

# Watch mode for development
npm run dev
```

### 5. Commit and push

```bash
git add .
git commit -m "feat: add my awesome feature"
git push origin feature/my-feature
```

### 6. Open a Pull Request

Open a PR from `feature/my-feature` → `development` on GitHub.

---

## 📦 Release Process

### Bumping the version

Before merging `staging` → `production`, bump the version in `package.json`:

```bash
# On staging branch
git checkout staging

# Bump version (choose one)
npm version patch   # 1.0.0 → 1.0.1 (bug fixes)
npm version minor   # 1.0.0 → 1.1.0 (new features)
npm version major   # 1.0.0 → 2.0.0 (breaking changes)

git push origin staging
```

Then open a PR from `staging` → `production`. Once merged:

1. ✅ GitHub Actions validates the build
2. ✅ Checks if version is already published (skips if so)
3. ✅ Publishes to npm with `--provenance`
4. ✅ Creates a Git tag (`v1.0.1`)
5. ✅ Creates a GitHub Release with auto-generated notes

### Manual publish (first time only)

For the very first publish, you may want to do it manually:

```bash
git checkout production
npm run build
npm publish --access public
```

After that, set up the `NPM_TOKEN` secret in GitHub and let the workflow handle it.

---

## 🔑 Setting up NPM_TOKEN

1. Go to [npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~/tokens)
2. Create a new **Automation** token
3. In your GitHub repo: **Settings** → **Secrets and variables** → **Actions**
4. Add a new secret: Name = `NPM_TOKEN`, Value = your token

---

## 📝 Commit Convention

We recommend [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation changes |
| `refactor:` | Code refactoring |
| `chore:` | Maintenance tasks |
| `test:` | Adding/updating tests |

Examples:
```
feat: add shimmer animation variant
fix: handle React.Fragment children correctly
docs: update README with new hooks API
```

---

## 🧪 Testing

Currently, the package is validated via:
- **TypeScript typecheck** (`npm run typecheck`)
- **Build verification** (`npm run build`)
- **Manual testing** by importing into a Next.js project

To test locally in another project:

```bash
# In auto-skeleton/
npm run build
npm link

# In your test project/
npm link @xhiti/auto-skeleton
```

---

## 📁 Project Structure

```
auto-skeleton/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI: runs on dev/staging pushes + all PRs
│       └── publish.yml     # Publish: runs on production push
├── src/
│   ├── index.tsx           # Core AutoSkeleton component + hooks
│   └── styles.css          # Optional CSS animations
├── dist/                   # Built output (gitignored)
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── .gitignore
└── .npmignore
```
