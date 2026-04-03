# Shade Protocol Docs

Documentation site for [Shade Protocol](https://shade-protocol.com), built with [Docusaurus](https://docusaurus.io/).

Deployed at [docs.shade-protocol.com](https://docs.shade-protocol.com).

## Development

```bash
# Install dependencies
npm install

# Start development server (hot reload)
npm start
```

The site opens at `http://localhost:3000`.

## Build

```bash
# Build static site
npm run build

# Preview the build locally
npm run serve
```

## Docker

```bash
# Build image
docker build -t shade-docs .

# Run container
docker run -p 80:80 shade-docs
```

## Structure

```
docs/                     Markdown documentation pages
  intro.md                Introduction
  architecture/           Architecture section
    overview.md
    trust-model.md
    key-hierarchy.md
    note-format.md
    transaction-flow.md
    encryption.md
  circuits.md             ZK circuits
  contracts.md            Smart contracts
  sdk.md                  TypeScript SDK
  infrastructure/         Infrastructure section
    indexer.md
    prover.md
    deployment.md
  risks.md                Risk assessment
static/img/               Static assets
  logo.svg                Shade Protocol logo
docusaurus.config.js      Site configuration
sidebars.js               Sidebar navigation
```
