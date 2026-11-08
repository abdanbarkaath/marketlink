# Product resources and working guidance

See [MarketLink's product notes](../../PRODUCT.md), the [design contract](../../DESIGN.md), and the [product inspiration guide](inspiration.md) for decisions that apply across the project.

## Graphify

Use [Graphify](https://github.com/Graphify-Labs/graphify) to locate relationships across files. Read the relevant source before editing. For an exact lookup or a stylesheet, use `rg` directly.

Run these commands from the repo root in PowerShell with Python 3.12 available. Version `0.9.104` was verified for this setup.

```powershell
python -m venv .local-tools/graphify
& ./.local-tools/graphify/Scripts/python.exe -m pip install graphifyy==0.9.104
$env:GRAPHIFY_BACKEND = 'none'
$env:GRAPHIFY_QUERY_LOG_DISABLE = '1'
& ./.local-tools/graphify/Scripts/graphify.exe update .
& ./.local-tools/graphify/Scripts/graphify.exe explain parseServiceGroups
```

Run `update .` again when the graph is out of date. The code index stays in `graphify-out/`. `.graphifyignore` excludes dependencies, local tooling, previews, alternate checkouts, and common credential files.

## Design and engineering skills

- Use UI/UX Pro Max to check hierarchy, accessibility, and responsive behavior. Use Avoid AI Design to review generic design patterns.
- Use the [project's Impeccable skill](../../.agents/skills/impeccable/SKILL.md) to refine the selected design. Check rendered desktop and mobile states before calling a change complete.
- Use [Ponytail](https://github.com/DietrichGebert/ponytail) for the smallest complete implementation. Reuse existing code and keep verification proportional to the change. Check that personal skills are installed when switching machines.
- Use [axe-core](https://github.com/dequelabs/axe-core) and [Lighthouse](https://github.com/GoogleChrome/lighthouse) for automated checks where appropriate. Verify key interactions with the keyboard as well.

## Product research

- Use the [Founder's Playbook](https://github.com/lloyd-c137/the-founders-playbook) to frame the customer problem, choose a small experiment, and decide how to measure the outcome.
- Use [TinyTroupe with Ollama](https://github.com/microsoft/TinyTroupe/blob/main/docs/guides/ollama.md) for optional local persona exploration. [MiroFish](https://github.com/666ghj/MiroFish) is a reference for larger simulations. Treat simulated reactions as hypotheses to check with customers.
