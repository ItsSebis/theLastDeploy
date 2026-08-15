export interface ExplorerFileNode {
  type: "file";
  id: string;
  name: string;
  itemId: string | null;
  fileText: string;
}

export interface ExplorerFolderNode {
  type: "folder";
  name: string;
  children: ExplorerNode[];
}

export type ExplorerNode = ExplorerFileNode | ExplorerFolderNode;

export const EXPLORER_TREE: ExplorerFolderNode = {
  type: "folder",
  name: "legendary-repo",
  children: [
    {
      type: "folder",
      name: "linuxdoom-1.10",
      children: [
        {
          type: "file",
          id: "p_enemy",
          name: "p_enemy.c",
          itemId: "rubber_duck",
          fileText: "// AI state machine for demons.\n// A rubber duck sits on the monitor. It has opinions about this switch statement.",
        },
        {
          type: "file",
          id: "r_bsp",
          name: "r_bsp.c",
          itemId: null,
          fileText: "// BSP tree traversal for rendering.\n// Nothing here but math and old comments.",
        },
        {
          type: "file",
          id: "w_wad",
          name: "w_wad.c",
          itemId: "hotfix_script",
          fileText: "// WAD file loader.\n// A hotfix script is taped to the bottom of this function. Never tested. Always run.",
        },
        {
          type: "file",
          id: "m_menu",
          name: "m_menu.c",
          itemId: null,
          fileText: "// Menu system.\n// You scroll through options you'll never use. Nothing to grab.",
        },
        {
          type: "file",
          id: "z_zone",
          name: "z_zone.c",
          itemId: "signed_nda",
          fileText: "// Memory zone management.\n// A signed NDA is stapled to a printout of this file. You can't say why.",
        },
        {
          type: "file",
          id: "p_mobj",
          name: "p_mobj.c",
          itemId: null,
          fileText: "// Map object thinking and physics.\n// A sticky note reads 'DO NOT TOUCH — signed, everyone who touched it.' Nothing to grab.",
        },
        {
          type: "file",
          id: "sounds",
          name: "sounds.c",
          itemId: null,
          fileText: "// Sound effect lookup tables.\n// Every entry is named 'temp_final_v3'. Nothing here but regret.",
        },
      ],
    },
    {
      type: "folder",
      name: "legacy",
      children: [
        {
          type: "file",
          id: "jquery_min",
          name: "jquery.min.js",
          itemId: "it_works_on_my_machine_badge",
          fileText: "// Minified. Unreadable.\n// Someone left a laminated badge taped to their monitor, pointing at this file.",
        },
        {
          type: "file",
          id: "ie6_hacks",
          name: "ie6-hacks.css",
          itemId: null,
          fileText: "/* IE6 conditional hacks. */\n/* A monument to a browser nobody misses. Nothing to grab. */",
        },
        {
          type: "file",
          id: "webpack_legacy",
          name: "webpack.config.legacy.js",
          itemId: null,
          fileText: "// A build config from a build tool nobody uses now.\n// It still somehow runs. Nothing to grab.",
        },
      ],
    },
    {
      type: "folder",
      name: ".config",
      children: [
        {
          type: "file",
          id: "env_backup",
          name: ".env.backup",
          itemId: "laptop_charger",
          fileText: "# old secrets, mostly expired\n# A charger cable is coiled up next to this file on the desk.",
        },
        {
          type: "file",
          id: "deploy_yml",
          name: "deploy.yml",
          itemId: "readme_nobody_wrote",
          fileText: "# deploy pipeline, undocumented\n# Someone started a README for this. It has one line: TODO.",
        },
        {
          type: "file",
          id: "old_todo",
          name: "old_todo.txt",
          itemId: null,
          fileText: "1. fix the thing\n2. ??? \n// Nothing to grab, just a reminder of a plan that went nowhere.",
        },
        {
          type: "file",
          id: "eslintrc_ancient",
          name: ".eslintrc.ancient.json",
          itemId: null,
          fileText: "// Lint rules from a stricter era.\n// Every rule is set to 'off'. Nothing to grab.",
        },
      ],
    },
  ],
};

export function findExplorerFile(id: string, node: ExplorerNode = EXPLORER_TREE): ExplorerFileNode | undefined {
  if (node.type === "file") {
    return node.id === id ? node : undefined;
  }
  for (const child of node.children) {
    const found = findExplorerFile(id, child);
    if (found) return found;
  }
  return undefined;
}

export interface ScrambleListEntry {
  id: string;
  label: string;
  description: string;
  itemId: string | null;
}

export const SOURCE_CONTROL_ENTRIES: ScrambleListEntry[] = [
  {
    id: "git_stash_entry",
    label: "stash@{0}: WIP on main",
    description: "git stash list. Three entries. You have no memory of any of them.",
    itemId: "git_stash",
  },
  {
    id: "uncommitted_diff",
    label: "12 uncommitted changes",
    description: "Whitespace changes, one very passive-aggressive comment, and a stray bug_repro_final.mov staged by accident.",
    itemId: "screen_recording_of_the_bug",
  },
  {
    id: "ci_status_check",
    label: "✓ 1 check passed",
    description: "The only green checkmark in this repo's history. Nobody knows why it passes. Nobody dares touch it.",
    itemId: "the_one_working_unit_test",
  },
];

export const EXTENSIONS_ENTRIES: ScrambleListEntry[] = [
  {
    id: "stack_overflow_ext",
    label: "Stack Overflow Importer",
    description: "Pastes the top answer directly into your file. A bookmark is pinned inside its settings page.",
    itemId: "stack_overflow_bookmark",
  },
  {
    id: "gitlens_trial",
    label: "GitLens (trial expired)",
    description: "Wants you to upgrade. You will not upgrade. Nothing to grab.",
    itemId: null,
  },
  {
    id: "prettier_uninstalled",
    label: "Prettier — Code Formatter",
    description: "Uninstalled two jobs ago. Somehow still running. Nothing to grab.",
    itemId: null,
  },
  {
    id: "eslint_vs_prettier",
    label: "ESLint vs. Prettier (holy war)",
    description: "Two formatters fighting over the same file. You picked a side in 2019 and never looked back.",
    itemId: "tabs_vs_spaces_allegiance",
  },
];
