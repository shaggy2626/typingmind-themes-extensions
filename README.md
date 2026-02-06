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
  - [Context Token Badge](#8-context-token-badge)
  - [Sidebar Pin](#9-sidebar-pin)
  - [Reasoning Effort Toolbar](#10-reasoning-effort-toolbar)

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

This theme overhauls the UI to mimic the clean, minimalist aesthetic of the classic ChatGPT interface. It restyles message bubbles, code blocks, and the sidebar for a modern, familiar look—and automatically adapts to your TypingMind theme setting.

**Features:**
- **Auto Light/Dark Mode:** Seamlessly follows TypingMind's theme setting—no manual switching required.
- **ChatGPT-Inspired Colors:** Light mode uses clean whites and grays; dark mode uses ChatGPT's signature dark palette (`#212121` background).
- **Redesigned Message Bubbles:** Restyled user message bubbles for clearer conversation flow.
- **Enhanced Code Blocks:** Features sticky headers, proper syntax highlighting backgrounds, and improved scrolling.
- **Complete Sidebar Styling:** Both light and dark themes apply to the entire sidebar including search, chat items, and menus.

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

### 5. Web Search Enhancer (OpenAI)

**File:** [`extensions/web-search-openai/web-search-openai.js`](./extensions/web-search-openai/web-search-openai.js)

**Extension URL:**
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions@latest/extensions/web-search-openai/web-search-openai.js
```

Enhances TypingMind's native Web Browser model tool for OpenAI by adding timezone and search context size parameters. This extension works alongside TypingMind's built-in web search—it only modifies existing `web_search` requests, it does NOT add or enable web search itself.

> **Prerequisite:** Enable TypingMind's native "Web Browser" model tool in Plugins → Model tools before using this extension.

**How it works:**
- When TypingMind sends a web search request to OpenAI, this extension enhances it by adding:
  - `user_location.timezone` — Auto-detected from your browser
  - `search_context_size` — Your preferred context amount (low/medium/high)
- If web search is disabled in TypingMind, this extension does nothing.

**Features:**
- **Context Size Options:**
  - **low**: Faster response, less web context
  - **medium** (default): Balanced speed and context
  - **high**: More comprehensive context, slower response
- **Auto Timezone Detection:** Reads your timezone directly from the browser—no external API calls.
- **Refresh Button:** Manually refresh timezone detection if you travel or change system settings.
- **Settings Location:** Models → Global Settings → "Web Search Context Size (OpenAI)"
- **Lightweight:** Simple event listeners (no DOM polling), only intercepts OpenAI requests when web search is present.
- **Local storage:** `tmx-websearch-context-size` (low|medium|high)

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
- **Auto Light/Dark Mode:** Automatically matches TypingMind's theme setting—switches seamlessly when you toggle between light and dark mode.

---

### 8. Context Token Badge

**File:** [`extensions/context-token-badge/context-token-badge.js`](./extensions/context-token-badge/context-token-badge.js)

**Extension URL:**
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions@latest/extensions/context-token-badge/context-token-badge.js
```

Keep track of your conversation's context length without clicking into the Chat Info panel. This extension displays the current token count directly under the "About this chat" button, updating automatically as you send messages and receive responses.

**Features:**
- **Always Visible:** Shows the context length right under the "About this chat" button.
- **Smart Formatting:** Rounds numbers for easy reading (e.g., 14,062 → "14k", 580 → "580").
- **Zero Polling:** Updates only when something actually changes (new message, chat switch, or tab focus).
- **Hover Tooltip:** Shows the exact token count when you hover over the badge.
- **Lightweight:** Reads directly from TypingMind's stored data without opening dialogs or making extra network calls.

---

### 9. Sidebar Pin

*Based on an original script by @NocturnalKernel.*

**File:** [`extensions/sidebar-pin/sidebar-pin.js`](./extensions/sidebar-pin/sidebar-pin.js)

**Extension URL:**
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions@latest/extensions/sidebar-pin/sidebar-pin.js
```

Keep your sidebar always expanded and stop it from auto-collapsing when you click "New Chat" or navigate between conversations. This lightweight extension instantly re-opens the sidebar whenever TypingMind tries to collapse it, giving you a true "pinned sidebar" experience without any visible animation flicker.

**Features:**
- **Auto-Expand on Load:** Sidebar opens automatically when you first visit TypingMind.
- **No Animation Flash:** Uses microtask scheduling to re-expand before the browser can paint the collapse animation.
- **Pin/Unpin Behavior:** Click "Close sidebar" to unpin and allow manual collapse; click the compact TypingMind logo to re-pin.
- **Targeted Observer:** Watches only the nav-container's class attribute for minimal overhead.
- **Fast Response:** 150ms throttle and 30ms re-expand timing ensure instant recovery.
- **Debug API:** Access `window.sidebarPin.pin()`, `.unpin()`, `.toggle()`, and `.isPinned()` for manual control.

---

### 10. Reasoning Effort Toolbar

**File:** [`extensions/reasoning-effort-toolbar/reasoning-effort-toolbar.js`](./extensions/reasoning-effort-toolbar/reasoning-effort-toolbar.js)

**Extension URL:**
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions@latest/extensions/reasoning-effort-toolbar/reasoning-effort-toolbar.js
```

Tired of clicking the thinking lightbulb off and back on every time you want to change the reasoning effort level? This extension fixes that. Once thinking is enabled, clicking the lightbulb opens a quick effort menu right there—no toggling required. It also brings Claude Opus 4.6 up to speed with Anthropic's latest adaptive thinking API, which TypingMind hasn't implemented yet.

**Features:**
- **One-Click Effort Change:** When thinking is on, click the lightbulb to pick a new effort level instantly—Low, Medium, High, and more depending on the model.
- **Works on Every Model:** Any model with a thinking toggle gets the improved menu. No model-specific setup needed.
- **Claude Opus 4.6 Support:** Automatically uses Anthropic's new adaptive thinking mode and sends the correct effort levels (Low, Medium, High, Max) behind the scenes.
- **Disable Thinking Option:** A "Disable thinking" option at the bottom of the menu lets you turn it off when you need to—without it being the default action.
- **Native Look and Feel:** The menu matches TypingMind's own styling, icons, and layout. It looks and feels like it's part of the app.
- **Persistent Selection:** Remembers your effort choice per model between sessions.
- **Lightweight:** Uses targeted observers scoped to just the composer area—no page-wide polling or unnecessary overhead.