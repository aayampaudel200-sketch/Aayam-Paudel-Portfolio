# Publishing a technical article

No article is published yet. Do not create a post until it is based on work or learning that can be described accurately. The `docs/article-template.html` file provides the reusable responsive article shell with a publication date, reading-time field, table of contents, responsive code blocks, lightweight token classes for code highlighting, and a related-articles section.

## Publish a real article

1. Copy `docs/article-template.html` to `notes/<descriptive-slug>.html`. Keep the topic and claims grounded in a project, coursework, or technical experiment you actually completed.
2. Replace every `{{PLACEHOLDER}}`: title, description, canonical URL, real publication date, reading time, headings, table of contents, text, author, and related articles. Calculate reading time from the final body word count at a clearly chosen rate; do not invent dates or metrics. Add `dateModified` only after a real substantial update.
3. Keep the existing shared stylesheet and navigation paths working from the nested `notes/` route. Code samples should use `<pre><code>` for keyboard-friendly horizontal scrolling. For a few manually highlighted tokens, use `.code-keyword`, `.code-string`, and `.code-comment`; do not add a remote highlighter dependency without a concrete need.
4. Use the existing Article plus BreadcrumbList JSON-LD structure in the template. Ensure the structured-data title, author, dates, URL, and visible article match exactly. Do not add Article schema to the empty notes listing.
5. Add the post to the notes listing only after the article is complete and reviewed. Link related articles only when they exist.
6. Run the SEO and internal-link audits, validate the JSON-LD, then run `python scripts/generate_sitemap.py`. The sitemap tool discovers public nested HTML routes and omits `lastmod` unless reliable dates are implemented later.
7. Verify the page on a local HTTP server and a deployment preview at mobile and desktop widths before publishing.

The generator excludes hidden, private, administrative, draft, documentation, test, and tooling paths. Keep unpublished drafts outside the public route tree or mark them `noindex` and store them outside the repository.
