// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Shade Protocol Docs",
  tagline: "Privacy on Citrea (Bitcoin L2)",
  favicon: "img/logo.svg",

  url: "https://docs.shade-protocol.com",
  baseUrl: "/",

  organizationName: "shadeprotocolcom",
  projectName: "shade-protocol",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.js",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: "dark",
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: "Shade Protocol",
        logo: {
          alt: "Shade Protocol Logo",
          src: "img/logo.svg",
        },
        items: [
          {
            href: "https://github.com/shadeprotocolcom",
            label: "GitHub",
            position: "right",
          },
          {
            href: "https://shade-protocol.com",
            label: "Website",
            position: "right",
          },
          {
            href: "https://x.com/cShadeProtocol",
            label: "X",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Documentation",
            items: [
              { label: "Introduction", to: "/" },
              { label: "Architecture", to: "/architecture/overview" },
              { label: "Circuits", to: "/circuits" },
              { label: "Contracts", to: "/contracts" },
            ],
          },
          {
            title: "Repositories",
            items: [
              {
                label: "Monorepo",
                href: "https://github.com/shadeprotocolcom/shade-protocol",
              },
              {
                label: "Circuits",
                href: "https://github.com/shadeprotocolcom/shade-protocol/tree/main/packages/circuits",
              },
              {
                label: "Contracts",
                href: "https://github.com/shadeprotocolcom/shade-protocol/tree/main/packages/contracts",
              },
              {
                label: "SDK",
                href: "https://github.com/shadeprotocolcom/shade-protocol/tree/main/packages/sdk",
              },
              {
                label: "Indexer",
                href: "https://github.com/shadeprotocolcom/shade-protocol/tree/main/packages/indexer",
              },
              {
                label: "Prover",
                href: "https://github.com/shadeprotocolcom/shade-protocol/tree/main/packages/prover",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "GitHub",
                href: "https://github.com/shadeprotocolcom",
              },
              {
                label: "X (Twitter)",
                href: "https://x.com/cShadeProtocol",
              },
            ],
          },
        ],
        copyright: `Copyright ${new Date().getFullYear()} Shade Protocol.`,
      },
      prism: {
        additionalLanguages: ["solidity", "bash", "json"],
      },
    }),
};

module.exports = config;
