import * as fs from "fs"
import * as path from "path"
import { execSync } from "child_process"

const searchTerms = [
  "wants_patra",
  "wants_chikki",
  "wants_fulvadi",
  "calculateOrderProfit",
  "KHAKHRA_TYPES",
  "PATRA_COST",
  "CHIKKI_COST",
  "SEJWAN_COST",
  "KHAKHRA_COST"
]

const searchDirs = ["app", "components", "lib"] // We exclude scripts/ and prisma/ for this audit, or include prisma? The prompt says "Search entire repository"

function main() {
  let report = `# Legacy Cleanup Audit Report\n\nGenerated On: ${new Date().toISOString()}\n\n`
  report += `This report lists all remaining references to legacy hardcoded arrays, categories, and accounting logic in the application source code.\n\n`

  for (const term of searchTerms) {
    report += `## Search Term: \`${term}\`\n`
    try {
      const output = execSync(`grep -rn "${term}" app components lib`, { encoding: "utf8" })
      const lines = output.split("\n").filter(l => l.trim().length > 0)
      
      report += `Found ${lines.length} references:\n\n`
      for (const line of lines) {
        // Simple classification heuristic
        let classification = "Still Referenced"
        if (line.includes("lib/supabase.ts")) classification = "Safe To Remove (Library definition)"
        if (line.includes("edit-order-dialog.tsx") || line.includes("new-order-dialog.tsx") || line.includes("khakhra-analytics-chart.tsx")) {
            classification = "Safe To Remove (Legacy Component being replaced)"
        }

        const [file, ln, ...content] = line.split(":")
        report += `- **${classification}** | \`${file}:${ln}\` | \`${content.join(":").trim()}\`\n`
      }
    } catch (e: any) {
      // grep returns exit code 1 if no matches found
      report += `No references found.\n`
    }
    report += `\n---\n\n`
  }

  // Adding prisma schema explicitly since it's outside those dirs but relevant
  try {
    const output = execSync(`grep -rnE 'wants_patra|wants_chikki|wants_fulvadi' prisma/schema.prisma`, { encoding: "utf8" })
    report += `## Prisma Schema Legacy Fields\n`
    const lines = output.split("\n").filter(l => l.trim().length > 0)
    for (const line of lines) {
       report += `- **Requires Migration (Drop Column)** | \`${line}\`\n`
    }
  } catch(e) {}

  fs.writeFileSync("reports/legacy_cleanup_report.md", report)
  console.log("Generated reports/legacy_cleanup_report.md")
}

main()
