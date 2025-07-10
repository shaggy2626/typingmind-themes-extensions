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