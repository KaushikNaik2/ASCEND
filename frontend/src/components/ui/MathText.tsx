import katex from 'katex'
import 'katex/dist/katex.min.css'

/**
 * MathText: Renders text with inline LaTeX.
 * Supports:
 *   - $...$  for inline math (e.g., $\frac{dy}{dx}$)
 *   - $$...$$ for block/display math (e.g., $$\int_0^1 x^2 dx$$)
 * 
 * Non-math text passes through unchanged.
 */
export default function MathText({ text, className = '' }: { text: string; className?: string }) {
    if (!text) return null

    // Replace $$...$$ (display) and $...$ (inline) with rendered HTML
    const html = text
        // Display math first (greedy: $$...$$)
        .replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
            try {
                return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false })
            } catch {
                return `$$${tex}$$`
            }
        })
        // Then inline math ($...$)
        .replace(/\$([\s\S]*?)\$/g, (_, tex) => {
            try {
                return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false })
            } catch {
                return `$${tex}$`
            }
        })

    return (
        <span
            className={className}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}
