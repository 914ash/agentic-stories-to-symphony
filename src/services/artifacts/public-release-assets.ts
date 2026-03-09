interface ReleaseAssetFile {
  path: string;
  content: string;
}

interface TranscriptEntry {
  kind: "multiline" | "status" | "select" | "confirm";
  message: string;
  response?: string | boolean;
  choices?: string[];
}

export interface PublicReleaseAssets {
  transcriptPath: string;
  transcript: TranscriptEntry[];
  files: ReleaseAssetFile[];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTerminalSvg(input: { title: string; lines: string[] }): string {
  const width = 1400;
  const height = 880;
  const lineHeight = 30;
  const title = escapeXml(input.title);
  const renderedLines = input.lines
    .map((line, index) => {
      const y = 150 + index * lineHeight;
      return `<text x="72" y="${y}" fill="#e5efe8">${escapeXml(line)}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
  <rect width="${width}" height="${height}" fill="#07131a" rx="28"/>
  <rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="#0f1d25" stroke="#204154" stroke-width="2" rx="22"/>
  <circle cx="80" cy="78" r="10" fill="#ff6b6b"/>
  <circle cx="110" cy="78" r="10" fill="#ffd166"/>
  <circle cx="140" cy="78" r="10" fill="#06d6a0"/>
  <text x="190" y="86" fill="#9ac0d1" font-size="28" font-family="Consolas, 'Courier New', monospace">${title}</text>
  <text x="72" y="122" fill="#5d8295" font-size="22" font-family="Consolas, 'Courier New', monospace">agentic-stories-to-symphony public release fixture</text>
  <g font-size="24" font-family="Consolas, 'Courier New', monospace">${renderedLines}</g>
</svg>`;
}

export function buildPublicReleaseAssets(): PublicReleaseAssets {
  const transcript: TranscriptEntry[] = [
    {
      kind: "multiline",
      message: "Describe the product outcome",
      response: "Turn approved product requirements into Linear stories that Symphony can execute agentically."
    },
    {
      kind: "multiline",
      message: "List the intended users",
      response: "Product lead\nDelivery lead"
    },
    {
      kind: "multiline",
      message: "Describe the core workflow",
      response:
        "Guide the operator through intake, approve the plan, project user stories into Linear, and let Symphony pick up the work."
    },
    {
      kind: "multiline",
      message: "List the must-have features",
      response: "Spec-first intake\nLinear story projection\nAgentic Symphony execution handoff"
    },
    {
      kind: "multiline",
      message: "List what is out of scope",
      response: "Tracker-first planning\nBi-directional sync from Linear"
    },
    {
      kind: "multiline",
      message: "List the implementation constraints",
      response: "Spec remains canonical\nApproval is explicit\nProjection is deterministic"
    },
    {
      kind: "status",
      message:
        "Outcome: Turn approved product requirements into Linear stories that Symphony can execute agentically.\nUsers: Product lead, Delivery lead\nFeatures: Spec-first intake, Linear story projection, Agentic Symphony execution handoff"
    },
    {
      kind: "select",
      message: "Review the compiled intake draft",
      response: "continue",
      choices: ["Continue to approval", "Edit answers", "Save and exit"]
    },
    {
      kind: "confirm",
      message: "Approve this spec revision and write it to Linear?",
      response: true
    },
    {
      kind: "status",
      message:
        "# Agentic Stories To Symphony Workflow\n\n## Product Outcome\nTurn approved product requirements into Linear stories that Symphony can execute agentically.\n\n## Intended Users\n- Product lead\n- Delivery lead\n\n## Core Workflow\nGuide the operator through intake, approve the plan, project user stories into Linear, and let Symphony pick up the work.\n\n## Must-Have Features\n- Spec-first intake\n- Linear story projection\n- Agentic Symphony execution handoff\n\n## Out Of Scope\n- Tracker-first planning\n- Bi-directional sync from Linear\n\n## Constraints\n- Spec remains canonical\n- Approval is explicit\n- Projection is deterministic"
    },
    { kind: "status", message: "Projected ASTS-101 (issue-demo-1)" },
    { kind: "status", message: "Projected ASTS-102 (issue-demo-2)" },
    { kind: "status", message: "Projected ASTS-101 into Linear." },
    { kind: "status", message: "Symphony picked up ASTS-101." },
    { kind: "status", message: "ASTS-101 moved to In Progress." },
    { kind: "status", message: "ASTS-101 completed in Done." }
  ];

  const files: ReleaseAssetFile[] = [
    {
      path: "artifacts/public-release/01-intake-prompts.svg",
      content: renderTerminalSvg({
        title: "Agentic Stories To Symphony",
        lines: [
          "$ npm run intake -- --approve-as demo-reviewer --no-watch",
          "",
          "? Describe the product outcome",
          "> Turn approved product requirements into Linear stories that Symphony can execute agentically.",
          "",
          "? List the intended users",
          "> Product lead",
          "> Delivery lead",
          "",
          "? Describe the core workflow",
          "> Guide the operator through intake, approve the plan, project user stories into Linear,",
          "> and let Symphony pick up the work."
        ]
      })
    },
    {
      path: "artifacts/public-release/02-review-summary.svg",
      content: renderTerminalSvg({
        title: "Review Summary",
        lines: [
          "Outcome: Turn approved product requirements into Linear stories that Symphony can execute agentically.",
          "Users: Product lead, Delivery lead",
          "Features: Spec-first intake, Linear story projection, Agentic Symphony execution handoff",
          "",
          "? Review the compiled intake draft",
          "> Continue to approval"
        ]
      })
    },
    {
      path: "artifacts/public-release/03-approval.svg",
      content: renderTerminalSvg({
        title: "Approval Gate",
        lines: [
          "? Approve this spec revision and write it to Linear?",
          "> Yes",
          "",
          "Approval is explicit.",
          "Linear remains the operational board.",
          "The repo-local spec remains canonical."
        ]
      })
    },
    {
      path: "artifacts/public-release/04-spec-preview.svg",
      content: renderTerminalSvg({
        title: "Spec Preview",
        lines: [
          "# Agentic Stories To Symphony Workflow",
          "",
          "## Product Outcome",
          "Turn approved product requirements into Linear stories that Symphony can execute agentically.",
          "",
          "## Must-Have Features",
          "- Spec-first intake",
          "- Linear story projection",
          "- Agentic Symphony execution handoff"
        ]
      })
    },
    {
      path: "artifacts/public-release/05-linear-projection.svg",
      content: renderTerminalSvg({
        title: "Linear Projection",
        lines: [
          "Projected ASTS-101 (issue-demo-1)",
          "Projected ASTS-102 (issue-demo-2)",
          "",
          "Team: ASTS",
          "Initial state: Todo",
          "Labels: generated:spec",
          "Provenance: spec-first planning revision"
        ]
      })
    },
    {
      path: "artifacts/public-release/06-execution-watch.svg",
      content: renderTerminalSvg({
        title: "Agentic Stories To Symphony",
        lines: [
          "Projected ASTS-101 into Linear.",
          "Symphony picked up ASTS-101.",
          "ASTS-101 moved to In Progress.",
          "ASTS-101 completed in Done.",
          "",
          "Active stories: 0",
          "Completed stories: 1",
          "Latest event: Story execution finished with verification-ready handoff."
        ]
      })
    },
    {
      path: "artifacts/public-release/README.md",
      content: [
        "# Public Release Artifacts",
        "",
        "Generated from the fixture-based snapshot pipeline for the public README and user guide.",
        "Run `npm run artifacts:public` to refresh these sanitized assets."
      ].join("\n")
    }
  ];

  return {
    transcriptPath: "artifacts/public-release/transcript.json",
    transcript,
    files
  };
}
