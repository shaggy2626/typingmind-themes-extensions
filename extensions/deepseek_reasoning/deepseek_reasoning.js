(function() {
    const originalFetch = window.fetch;
    const DEEPSEEK_API_URL = 'api.deepseek.com/v1/chat/completions';
  
    window.fetch = async function(...args) {
      try {
        // Check if this is a Deepseek API call by URL
        if (!args[0]?.includes(DEEPSEEK_API_URL)) {
          return originalFetch.apply(this, args);
        }
  
        // Check if this is a Deepseek model by looking at the request body
        const requestBody = args[1]?.body;
        if (!requestBody) {
          return originalFetch.apply(this, args);
        }
  
        try {
          const body = JSON.parse(requestBody);
          if (!body.model?.includes('deepseek')) {
            return originalFetch.apply(this, args);
          }
          
          // Check if this is a title generation request
          const isTitleRequest = body.messages?.[body.messages.length - 1]?.content?.includes('What would be a short and relevant title for this chat?');
          if (isTitleRequest) {
            return originalFetch.apply(this, args);
          }
        } catch {
          return originalFetch.apply(this, args);
        }
  
        // If we get here, it's definitely a Deepseek call (but not a title request)
        const response = await originalFetch.apply(this, args);
      
        // Handle streaming response
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let contentStarted = false;
          let reasoningEnded = false;
          let lastWasNewline = false;
          
          const stream = new ReadableStream({
            async start(controller) {
              const textEncoder = new TextEncoder();
              
              try {
                while (true) {
                  const {done, value} = await reader.read();
                  if (done) break;
                  
                  buffer += decoder.decode(value, {stream: true});
                  const lines = buffer.split('\n');
                  buffer = lines.pop() || '';
                  
                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      try {
                        // Skip the [DONE] message
                        if (line.includes('[DONE]')) {
                          controller.enqueue(textEncoder.encode(line + '\n'));
                          continue;
                        }
                        
                        const data = JSON.parse(line.slice(6));
                        if (data?.choices?.[0]?.delta) {
                          const delta = data.choices[0].delta;
                          
                          // If there's reasoning content, convert it to regular content
                          if (delta.reasoning_content) {
                            if (!contentStarted) {
                              // Add thinking start header
                              const thinkingHeader = {
                                ...data,
                                choices: [{
                                  ...data.choices[0],
                                  delta: { content: "💭 Thinking...\n\n> " }
                                }]
                              };
                              controller.enqueue(textEncoder.encode(`data: ${JSON.stringify(thinkingHeader)}\n\n`));
                              contentStarted = true;
                            }
                            
                            // Check if we need to add a quote prefix after a newline
                            let content = delta.reasoning_content;
                            if (lastWasNewline && content.trim()) {
                              content = "> " + content;
                            }
                            // Update lastWasNewline state
                            lastWasNewline = content.endsWith('\n');
                            
                            // Convert reasoning_content to content
                            const modifiedData = {
                              ...data,
                              choices: [{
                                ...data.choices[0],
                                delta: { content }
                              }]
                            };
                            controller.enqueue(textEncoder.encode(`data: ${JSON.stringify(modifiedData)}\n\n`));
                          } 
                          // If it's regular content and we're switching from reasoning
                          else if (delta.content && !reasoningEnded) {
                            // Add thinking complete and separator
                            const separatorData = {
                              ...data,
                              choices: [{
                                ...data.choices[0],
                                delta: { content: "\n\nThinking complete\n\n---\n\n" }
                              }]
                            };
                            controller.enqueue(textEncoder.encode(`data: ${JSON.stringify(separatorData)}\n\n`));
                            reasoningEnded = true;
                            controller.enqueue(textEncoder.encode(line + '\n'));
                          } else {
                            controller.enqueue(textEncoder.encode(line + '\n'));
                          }
                        } else {
                          controller.enqueue(textEncoder.encode(line + '\n'));
                        }
                      } catch (e) {
                        console.error('Error parsing streaming data:', e);
                        controller.enqueue(textEncoder.encode(line + '\n'));
                      }
                    } else {
                      controller.enqueue(textEncoder.encode(line + '\n'));
                    }
                  }
                }
                controller.close();
              } catch (e) {
                controller.error(e);
              }
            }
          });
  
          return new Response(stream, {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText
          });
        }
        
        // Handle non-streaming response
        try {
          const data = await response.clone().json();
          if (data?.choices?.[0]?.message?.reasoning_content) {
            const message = data.choices[0].message;
            // Add quote prefix to each line of reasoning
            const quotedReasoning = message.reasoning_content
              .split('\n')
              .map(line => line.trim() ? `> ${line}` : '>')
              .join('\n');
            message.content = `${quotedReasoning}\n\n---\n\n${message.content}`;
            return new Response(JSON.stringify(data), {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            });
          }
        } catch (error) {
          console.error('Error in Deepseek reasoning extension:', error);
        }
        
        return response;
      } catch (error) {
        console.error('Error in fetch interceptor:', error);
        return originalFetch.apply(this, args);
      }
    };
  
    console.log('Deepseek reasoning extension loaded (with model-specific check)!');
  })(); 