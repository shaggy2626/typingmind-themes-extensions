# Deepseek Reasoning Display Extension

This extension enhances the Typing Mind interface when using Deepseek models by displaying the model's reasoning process alongside its responses.

## Installation

Add this URL to your TypingMind extensions:
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions/extensions/deepseek_reasoning/deepseek_reasoning.js
```

## What it Does

The Deepseek models provide two types of content in their responses:
1. `reasoning_content`: The model's internal thought process
2. `content`: The final response

By default, Typing Mind only shows the final response (`content`). This extension modifies the display to show both parts:
- Shows the reasoning process first, styled with a quote block
- Adds a separator
- Shows the final response

## Features

- Works with streaming responses
- Only activates for Deepseek model calls
- Maintains proper formatting with quote blocks
- Preserves paragraph structure
- Clean separation between reasoning and response

## How it Works

The extension:
1. Intercepts API calls to Deepseek endpoints
2. Checks if it's a Deepseek model response
3. Takes the `reasoning_content` and displays it as quoted text
4. Adds a separator line
5. Shows the regular `content` response

## Example

When you chat with a Deepseek model, instead of seeing just:
```
Here's how to write a Python script...
```

You'll see:
```
> First, let me understand what the user needs. They want help with Python scripting.
> I should provide clear steps and examples to guide them.

---

Here's how to write a Python script...
```

## Requirements

- Only works with Deepseek models
- Requires Typing Mind's extension feature
- Works with both streaming and non-streaming responses 