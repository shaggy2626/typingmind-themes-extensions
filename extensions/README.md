# Insert Code XML Creator Extension for TypingMind

A powerful extension that adds a code insertion button to the TypingMind chat interface, allowing users to easily insert formatted code blocks with language detection and custom XML tags.

### Disclaimer
This extension is provided "as is" without any warranties. Use at your own risk. The creator is not responsible for any issues that may arise from using this extension.

## Features

- 🎯 One-click code insertion button in the chat toolbar
- 🔍 Automatic language detection using highlight.js
- ✨ Support for 180+ programming languages
- 🏷️ Custom XML tag creation
- 💅 Syntax highlighting preview
- 📝 Markdown-aware detection
- 🎨 Modern and intuitive UI

## Installation

### Option 1: Direct CDN Link
Add this URL to your TypingMind extensions:
```
https://cdn.jsdelivr.net/gh/shaggy2626/typingmind-themes-extensions/extensions/insert_code_xml_creator.js
```

### Option 2: Manual Installation
1. Copy the `insert_code_xml_creator.js` file to your TypingMind extensions directory
2. Enable the extension in your TypingMind settings

## Usage

1. Click the code icon (<>) in the chat input toolbar
2. Paste your code in the textarea
3. The language will be automatically detected
4. (Optional) Modify the language or add a custom XML tag
5. Click "Insert Code" to add the formatted code block to your chat

## Supported Languages

The extension supports all languages available in highlight.js, including but not limited to:
- JavaScript/TypeScript
- Python
- Java
- C/C++
- Ruby
- Go
- And 175+ more!

## XML Tag Format

The extension creates XML tags in the following format:
```
<language_or_custom_tag>
```code
your code here
```
</language_or_custom_tag>
```

## Features in Detail

### Automatic Language Detection
- Uses highlight.js for accurate language detection
- Special handling for Markdown content
- Fallback to 'plaintext' when language cannot be determined

### Custom Tags
- Create custom XML tags for special use cases
- Automatic sanitization of tag names
- Preserves compatibility with XML specifications

### UI Features
- Modern modal interface
- Real-time language detection display
- Searchable language dropdown
- Responsive design
- Keyboard navigation support

## Technical Details

- No external dependencies required (highlight.js is loaded dynamically)
- Lightweight implementation
- Non-intrusive UI integration
- Preserves chat input cursor position
- Handles special characters and edge cases

## License

MIT 
