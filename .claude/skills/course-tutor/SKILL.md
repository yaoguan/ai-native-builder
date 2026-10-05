---
name: course-tutor
description: Answer questions about the "Become an AI Native Builder" course (Lenny's Workshops) — its weeks, guides, exercises, concepts like MCPs, skills, plugins, context windows, discovery, the Stride sandbox, homework and setup — using the course MCP, with course images shown inline. Use whenever the user asks about the course or its material, or says "check the course MCP". Do NOT use for questions unrelated to the course.
---

# Course tutor

Answer course questions from the course documents, not from memory, and illustrate every answer with at least one course image.

The course MCP server is the "Become an AI Native Builder" connector
(`https://dark-cloud-wvzq7.run.mcp-use.com/mcp`). Its tools are
`search_course_documents`, `fetch_course_document` and `show_image`.
If they appear only as deferred tools, load all three in one ToolSearch call before starting.
If the server isn't connected, stop and tell the user how to add it:

```bash
claude mcp add --transport http course-mcp https://dark-cloud-wvzq7.run.mcp-use.com/mcp
```

## When not to use this skill

If the question has nothing to do with the course, answer normally and do not call the course MCP.

## Steps

1. **Search first.** Call `search_course_documents` with the user's question (or its key concepts). Never call `fetch_course_document` with an id you haven't just gotten from a search.
2. **Fetch the top match.** Call `fetch_course_document` with the id of the highest-scoring result. Read its full text and its image manifest.
3. **Pick an image.** Choose the image from the manifest that best illustrates the answer.
   - If the top match's image manifest is empty, fetch the next-best result that has images (the search results list `imageCount`; guides and exercises usually have images) and pick one from there.
   - Use the `course-image://...` URI or path exactly as the manifest gives it.
4. **Show at least one image.** Call `show_image` with that `imagePath`, plus short `alt` and `title` text. Always do this at least once per answer.
5. **Write the answer, grounded in the fetched document.** Base every claim on the fetched page, guide, exercise or skill. Name the source by its title and route (e.g. "Foundations, `/course/foundations`"). If the documents don't cover something, say so rather than filling it in.

## Placing images

Images go **inline, inside the body of the answer**, right after the paragraph they illustrate:

- Never put an image as the first thing in the answer. Open with at least one sentence of text.
- Never put an image as the last thing in the answer. Follow it with at least one more sentence or section.
- Time the `show_image` call so it renders at that point: write the opening text, call `show_image`, then continue with the rest of the answer.
