# Gemini System Rules for DryFi

## Project Context
You are modifying the **DryFi** repository.

## Specific Agent Directives
1. **Frontend Operations**: Always execute frontend commands from `c:\Users\philg\OneDrive\Documents\Coding\dryfi\DryFi\front-end`. The legacy application lives under `front-end-legacy` and should not be modified.
2. **UI Implementation Execution**: When writing Angular HTML templates, apply the "dynamic design" prompt automatically. Do not ask for styling permission; assume the highest degree of modern web layout implementation. 
3. **Angular CLI Usage**: Ensure any `ng` invocations run through NPM (`npm run ng -- ...`) or `npx @angular/cli@latest` as global CLI binaries may not be synchronized.
4. **Environment Awareness**: You are working in a Windows PowerShell environment. Use standard PowerShell cmdlets (e.g., `Rename-Item`, `Remove-Item`) instead of bash variants when using the `run_command` tool.
5. **No Placeholders**: When asked to create demonstrations or mockup images for this dashboard, use your `generate_image` tool directly rather than dropping static placeholder images like `https://placehold.co`.
