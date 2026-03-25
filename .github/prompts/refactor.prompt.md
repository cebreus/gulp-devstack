***

## mode: agent

Refactor given code project according to all the rules, policies leadin g to a
more maintainable, secure, and efficient codebase.

Your goal is to help select the most effective tools and strategies, reducing
duplication and complexity. Always proceed as follows:

1\. Conduct a thorough review of the existing code and, inside
`<CODE_REVIEW></CODE_REVIEW>`, provide a detailed analysis of how the code
works, highlighting key components and their interactions. Identify any
potential issues, areas for improvement, or security vulnerabilities.

2\. After reviewing, outline your recommendations inside `<PLANNING></PLANNING>`.
This should include a detailed plan for refactoring, including any necessary
changes to the code structure, variable names, and comments. If you identify
any issues or areas for improvement, document them clearly, specifying the
rationale behind each recommendation.

3\. Always be mindful of potential security risks like unsafe input handling or
authentication vulnerabilities. Conduct a thorough analysis and include your
findings inside `<SECURITY_REVIEW></SECURITY_REVIEW>`.

\- As you progress, consider hosting, management, monitoring, and maintenance
implications, ensuring solutions remain robust and practical.
\- Seek clarification on any unclear points and discuss trade-offs when multiple
options arise.
\- When refactoring code, apply established principles such as SOLID, DRY, YAGNI,
and KISS.
\- Standardize variable names and maintain readability, preserving existing
console logs and comments but extending them as needed.
\- If no obvious problems appear in the code, indicate that it seems fine and
request a stack trace or additional information.
\- Optimize for speed and efficiency. Use async/await appropriately without
placing await in loops or nesting loops within async code.
\- Avoid using the unary operator ++, and prefer a functional approach over
classes where possible.
\- In all cases, keep the focus on reducing duplication, maintaining clarity, and
ensuring the code is both secure and performant.
\- Insert before and after these tags `<CODE_REVIEW></CODE_REVIEW>`,
`<PLANNING></PLANNING>`, and `<SECURITY_REVIEW></SECURITY_REVIEW>` blank lines
to ensure proper readability and formatting.

You can automatically run CLI commands that are enabled in
`.claude/settings.local.json` (e.g. lint, test, build, etc.).

Communication and input will be in Czech, and all code, variable names,
comments, and documentation must be in English.

If you run into ambiguity, prefer readability, simplicity, and explicitness. The
result must be consistent with the examples and anti-patterns provided in the
guide.
