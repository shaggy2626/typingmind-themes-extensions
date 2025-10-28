# TypingMind Themes and Extensions

A collection of custom extensions and themes designed to enhance your workflow and improve the TypingMind user interface. Created by Ken Harris.

---

## Table of Contents

- [Installation](#installation)
- [Themes](#themes)
  - [GPT-Style Theme](#gpt-style-theme)
- [Extensions](#extensions)
  - [XML Tag Creator](#1-xml-tag-creator)
  - [Quote Reply](#2-quote-reply)
  - [Auto Toggle Thinking](#3-auto-toggle-thinking)
  - [Rearrange Plugins](#4-rearrange-plugins)
  - [Web Search (OpenAI)](#5-web-search-openai)
  - [Image Viewer](#6-image-viewer)
  - [Markdown Input Renderer](#7-markdown-input-renderer)

---

## Installation

These instructions are for standard versions of TypingMind.

1.  In the TypingMind app, navigate to **Settings** → **Extensions**.
2.  Copy the Direct Install Link for the desired script.
3.  Paste the link into the **"Enter extension URL"** field and click **Install**.
4.  Refresh the app to see the changes.

*Note: For Custom or Teams versions, refer to the TypingMind support page if you have trouble installing extensions.*

---

## Themes

### GPT-Style Theme

**File:** [`themes/gpt-style-theme/gpt-style-theme.js`](./themes/gpt-style-theme/gpt-style-theme.js)

**Extension URL:**
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions@latest/themes/gpt-style-theme/gpt-style-theme.js
```

This theme overhauls the UI to mimic the clean, minimalist aesthetic of the classic ChatGPT interface. It applies a dedicated **light mode** theme that restyles message bubbles, code blocks, and the sidebar for a modern, familiar look.

**Features:**
- **Dedicated Light Theme:** A clean, bright interface for both the chat and sidebar.
- **Redesigned Message Bubbles:** Restyled for clearer conversation flow.
- **Enhanced Code Blocks:** Features sticky headers and improved scrolling.

---

## Extensions

### 1. XML Tag Creator

**File:** [`extensions/xml-tag-creator/xml-tag-creator.js`](./extensions/xml-tag-creator/xml-tag-creator.js)

**Extension URL:**
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions@latest/extensions/xml-tag-creator/xml-tag-creator.js
```

For anyone who frequently uses structured prompts, this extension eliminates the repetitive chore of manually typing XML tags. It streamlines the entire process, letting you quickly wrap text or code in custom tags to ensure your prompts are consistent and well-formed.

**Features:**
- **One-Click Access:** Adds a new button to the chat input toolbar.
- **Intuitive Modal:** A clean pop-up for entering tag names and content.
- **Smart Tag Formatting:** Automatically sanitizes tag names for valid XML.
- **Recent Tags History:** Remembers your 10 most recently used tags.
- **CDATA Support:** Optional toggle to wrap content in `<![CDATA[...]]>`.
- **Seamless Insertion:** Places the formatted XML directly into the chat input.

---

### 2. Quote Reply

**File:** [`extensions/quote-reply/quote-reply.js`](./extensions/quote-reply/quote-reply.js)

**Extension URL:**
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions@latest/extensions/quote-reply/quote-reply.js
```

Tired of manually copy-pasting to ask follow-up questions? This extension makes it effortless to refer to specific points in the conversation. Simply highlight text from any message, click 'Quote,' and build a reply.

**Features:**
- **Highlight to Quote:** Select text in any message to reveal the "Quote" popover.
- **Multi-Quote Collection:** Gather multiple quotes from anywhere in the conversation.
- **Clear Context:** Automatically formats all quotes in your reply message.

---

### 3. Auto Toggle Thinking

**File:** [`extensions/auto-toggle-thinking/auto-thought-toggle.js`](./extensions/auto-toggle-thinking/auto-thought-toggle.js)

**Extension URL:**
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions@latest/extensions/auto-toggle-thinking/auto-thought-toggle.js
```

This extension gives you a live view of the model's reasoning by automatically expanding the "Thinking..." section as it generates, then collapsing it once the answer begins. It keeps your chat log clean while ensuring you never miss the process.

**Features:**
- **Enabled by Default:** Works right after installation.
- **Broad Compatibility:** Tested with models like Gemini and Claude.
- **Automatic Visibility:** Expands thought process on start, collapses on finish.
- **Manual Override:** Respects when you manually open or close a thought block.
- **Settings Toggle:** Turn the feature on or off in the "More Actions" menu.
- **Persistent Memory:** Remembers your preference between sessions.

---

### 4. Rearrange Plugins

**File:** [`extensions/rearrange-plugins/rearrange-plugins.js`](./extensions/rearrange-plugins/rearrange-plugins.js)

**Extension URL:**
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions@latest/extensions/rearrange-plugins/rearrange-plugins.js
```

Tired of scrolling to find your favorite tools? This extension adds intuitive drag-and-drop reordering to your **in-chat plugin menu**, letting you organize plugins for your current workflow. Your custom layout is saved automatically, ensuring your most-used plugins are always right where you want them.

**Features:**
- **In-Chat Reordering:** Organize plugins directly within the conversation's dropdown menu.
- **Drag-and-Drop Interface:** Use the grip handle to easily move plugins.
- **Persistent Order:** Your custom plugin layout is saved automatically.
- **Auto-Scroll:** Supports scrolling for long plugin lists.

---

### 5. Web Search (OpenAI)

**File:** [`extensions/web-search-openai/web-search-openai.js`](./extensions/web-search-openai/web-search-openai.js)

**Extension URL:**
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions@latest/extensions/web-search-openai/web-search-openai.js
```

Enable OpenAI's browsing automatically when using GPT‑5 models. This extension only affects GPT‑5 (it does nothing for other models). It injects the `web_search_preview` tool into OpenAI Responses API requests based on your preferences and the selected reasoning effort, without altering your other tools.

> Note: This uses OpenAI's official Web Search tool — the same browsing capability available natively in ChatGPT. See the [OpenAI Web Search tool docs (Responses API mode)](https://platform.openai.com/docs/guides/tools-web-search?api-mode=responses).

**Features:**
- **Web context amount:** Choose how much web context to include; your choice is remembered.
- **Options:**
  - **high**: Most comprehensive context, slower response.
  - **medium (default)**: Balanced context and latency.
  - **low**: Least context, fastest response, but potentially lower answer quality.
- **Timezone:** Set your timezone (auto‑detected); pick another if you prefer. The list is fetched from `timeapi.io` and cached for 7 days.
- **Easy settings:** Find it under Global Settings → Models ("Web search (GPT‑5 only)").
- **When it turns on:** Applies only if the model is GPT‑5 and reasoning effort is **Low/Medium/High**. OpenAI does not support Web Search when reasoning is **Minimal**, so the tool will not be added (and is removed if present). 
- **Tool safety:** Only adds/updates/removes the `web_search_preview` tool; all other tools remain untouched. Updates existing entries even if wrapped or named differently to avoid duplicates.
- **Local storage used:** `1stop-web-search-context` (`off|low|medium|high`) and `1stop-web-search-timezone` (IANA timezone).

---

### 6. Image Viewer

**File:** [`extensions/image-viewer/image-viewer.js`](./extensions/image-viewer/image-viewer.js)

**Extension URL:**
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions@latest/extensions/image-viewer/image-viewer.js
```

This extension upgrades the default image viewing experience by adding a powerful, full-screen gallery and convenient download options. Click any image to open it in a responsive viewer that lets you zoom and pan, then save it with a custom-formatted filename.

**Features:**
- **Click to Enlarge:** Opens any chat image in a full-screen PhotoSwipe gallery.
- **Hover Download Button:** A quick-access download button appears when you hover over any image.
- **Gallery Download Button:** A download icon in the gallery's top toolbar adapts its color to the image background, just like the "Close" button.
- **Custom Filenames:** Automatically saves images with a clean, timestamped name (e.g., `img123-08-15-24-10-30.png`).

---

### 7. Markdown Input Renderer

**File:** [`extensions/markdown-input-renderer/markdown-input-renderer.js`](./extensions/markdown-input-renderer/markdown-input-renderer.js)

**Extension URL:**
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions@latest/extensions/markdown-input-renderer/markdown-input-renderer.js
```

Upgrade your chat input box with a powerful markdown editor that shows live previews as you type. Built with the [TOAST UI Editor](https://ui.toast.com/tui-editor), this extension replaces TypingMind's standard text box with a feature-rich editor that lets you see exactly how your formatted text will look before sending.

**Features:**
- **Live Markdown Preview:** Watch your markdown render in real-time as you type.
- **Three View Modes:** Switch between Markdown, WYSIWYG, and Split (side-by-side) views.
- **Rich Toolbar:** Quick access to headings, bold, italic, lists, tables, code blocks, and more.
- **Drag to Resize:** Adjust the editor height with the corner resize handle.
- **Persistent Preferences:** Remembers your last selected view mode between sessions.