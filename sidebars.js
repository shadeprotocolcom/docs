/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    "intro",
    {
      type: "category",
      label: "Architecture",
      items: [
        "architecture/overview",
        "architecture/trust-model",
        "architecture/key-hierarchy",
        "architecture/note-format",
        "architecture/transaction-flow",
        "architecture/encryption",
      ],
    },
    "circuits",
    "contracts",
    "sdk",
    {
      type: "category",
      label: "Infrastructure",
      items: [
        "infrastructure/indexer",
        "infrastructure/prover",
        "infrastructure/deployment",
      ],
    },
    "risks",
  ],
};

module.exports = sidebars;
