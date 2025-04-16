// Force app to use new script by logging version
console.log("Loading app.js - DEBUG VERSION - " + new Date().toISOString());

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const queryInput = document.getElementById('query-input');
    const sendQueryBtn = document.getElementById('send-query-btn');
    const exampleQueryBtns = document.querySelectorAll('.example-query-btn');
    const merchantSelect = document.getElementById('merchant-select');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Templates
    const userMessageTemplate = document.getElementById('user-message-template');
    const aiMessageTemplate = document.getElementById('ai-message-template');
    const agentMessageTemplate = document.getElementById('agent-message-template');
    
    // API URL - Change this to your backend URL in production
    const API_URL = 'http://localhost:5000/api';
    
    // Session ID for maintaining conversation
    let sessionId = null;
    
    // Add event listeners
    sendQueryBtn.addEventListener('click', handleSendQuery);
    queryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSendQuery();
        }
    });
    
    exampleQueryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            queryInput.value = btn.textContent;
            handleSendQuery();
        });
    });
    
    // IMPORTANT: Modified function to always use the agent endpoint
    async function handleSendQuery() {
        const query = queryInput.value.trim();
        
        if (!query) return;
        
        console.log("DEBUG: Submit button clicked, query:", query);
        
        // Add user message to chat
        addUserMessage(query);
        
        // Clear input
        queryInput.value = '';
        
        // Show loading overlay
        loadingOverlay.classList.add('active');
        
        try {
            // Get merchant ID
            const merchantId = merchantSelect.value;
            
            // Prepare request data - FIXED: uses message parameter
            const requestData = {
                query: query,
                merchant_id: merchantId
            };
            
            // Add session ID if we have one
            if (sessionId) {
                requestData.session_id = sessionId;
            }
            
            console.log("DEBUG: Sending to /agent endpoint with data:", JSON.stringify(requestData));
            
            // Send query to AGENT API - explicitly using /agent
            const response = await fetch(`${API_URL}/agent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
            
            console.log("DEBUG: Response status:", response.status);
            
            // Process response
            const data = await response.json();
            console.log("DEBUG: Response data:", data);
            
            // Save session ID for future requests
            if (data.session_id) {
                sessionId = data.session_id;
                console.log("DEBUG: Session ID saved:", sessionId);
            }
            
            // Hide loading overlay
            loadingOverlay.classList.remove('active');
            
            if (response.ok) {
                if (data.error) {
                    // Add error message
                    addSystemMessage(`Error: ${data.error}`);
                } else if (data.message) {
                    // Add agent response
                    addAgentResponse(data);
                } else {
                    // Add AI response with visualization (fallback)
                    addAiMessage(data);
                }
            } else {
                addSystemMessage(`An error occurred: ${data.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('Error:', error);
            loadingOverlay.classList.remove('active');
            addSystemMessage('An error occurred while processing your request. Please try again.');
        }
        
        // Scroll to bottom of chat
        scrollToBottom();
    }
    
    // Function to add a user message to the chat
    function addUserMessage(message) {
        const messageEl = userMessageTemplate.content.cloneNode(true);
        messageEl.querySelector('p').textContent = message;
        chatMessages.appendChild(messageEl);
        scrollToBottom();
    }
    
    // Function to add an agent response
    function addAgentResponse(data) {
        console.log("DEBUG: Adding agent response:", data);
        
        // First check if we should use an existing template
        if (agentMessageTemplate) {
            // Use the agent template if available
            const messageEl = agentMessageTemplate.content.cloneNode(true);
            
            // Add response text
            const responseEl = messageEl.querySelector('.agent-response');
            if (responseEl) {
                responseEl.textContent = data.message;
            }
            
            // Check if we have action details to display
            if (data.success && data.action_taken) {
                const actionResultEl = messageEl.querySelector('.action-result');
                if (actionResultEl) {
                    actionResultEl.style.display = 'block';
                    
                    let actionDetailsHTML = '';
                    
                    // Format based on action type
                    if (data.action_taken === 'add_menu_item' && data.menu_item) {
                        const item = data.menu_item;
                        actionDetailsHTML = `
                            <p><strong>Item:</strong> ${item.name}</p>
                            <p><strong>Category:</strong> ${item.category}</p>
                            <p><strong>Price:</strong> €${item.price}</p>
                            <p><strong>Availability:</strong> ${formatAvailability(item)}</p>
                        `;
                    } else {
                        actionDetailsHTML = `<p>Action completed: ${data.action_taken}</p>`;
                    }
                    
                    const actionDetailsEl = messageEl.querySelector('.action-details');
                    if (actionDetailsEl) {
                        actionDetailsEl.innerHTML = actionDetailsHTML;
                    }
                }
            }
            
            chatMessages.appendChild(messageEl);
        } else {
            console.log("DEBUG: Agent message template not found, using fallback");
            // Fallback if agent template isn't available
            const systemMessageEl = document.createElement('div');
            systemMessageEl.className = 'message ai';
            
            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';
            
            const textEl = document.createElement('p');
            textEl.textContent = data.message;
            
            contentEl.appendChild(textEl);
            
            // If successful action, add details
            if (data.success && data.action_taken) {
                const actionEl = document.createElement('div');
                actionEl.className = 'action-result';
                actionEl.style.marginTop = '0.5rem';
                actionEl.style.padding = '0.5rem';
                actionEl.style.backgroundColor = '#f0f9e8';
                actionEl.style.borderRadius = '4px';
                
                const actionText = document.createElement('p');
                actionText.innerHTML = `<strong>Action completed:</strong> ${data.action_taken}`;
                actionEl.appendChild(actionText);
                
                contentEl.appendChild(actionEl);
            }
            
            systemMessageEl.appendChild(contentEl);
            chatMessages.appendChild(systemMessageEl);
        }
    }
    
    // Helper function to format availability options
    function formatAvailability(item) {
        const options = [];
        if (item.available_for_takeaway) options.push('Takeaway');
        if (item.available_for_delivery) options.push('Delivery');
        
        if (options.length === 0) return 'Dine-in only';
        return options.join(', ');
    }
    
    // Function to add an AI message with visualization
    function addAiMessage(data) {
        console.log("DEBUG: Adding AI message for visualization");
        
        const messageEl = aiMessageTemplate.content.cloneNode(true);
        
        // Add insights text
        messageEl.querySelector('.insights').textContent = data.insights || '';
        
        // Add visualization image
        if (data.chartImage) {
            const img = messageEl.querySelector('.visualization img');
            img.src = `data:image/png;base64,${data.chartImage}`;
            img.alt = `${data.chartType} Chart`;
        } else {
            messageEl.querySelector('.visualization').style.display = 'none';
        }
        
        // Add SQL query if available
        if (data.sql) {
            messageEl.querySelector('.sql-query').textContent = data.sql;
        } else {
            messageEl.querySelector('.sql-container').style.display = 'none';
        }
        
        chatMessages.appendChild(messageEl);
    }
    
    // Function to add a system message
    function addSystemMessage(message) {
        console.log("DEBUG: Adding system message:", message);
        
        const systemMessageEl = document.createElement('div');
        systemMessageEl.className = 'message system';
        
        const contentEl = document.createElement('div');
        contentEl.className = 'message-content';
        
        const textEl = document.createElement('p');
        textEl.textContent = message;
        
        contentEl.appendChild(textEl);
        systemMessageEl.appendChild(contentEl);
        chatMessages.appendChild(systemMessageEl);
    }
    
    // Function to scroll to the bottom of the chat
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Health check on load
    console.log("DEBUG: Performing health check");
    fetch(`${API_URL}/health`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'healthy') {
                console.log('DEBUG: Backend is healthy');
                addSystemMessage('Connected to POS system successfully! Agent mode is active.');
            } else {
                console.log('DEBUG: Backend health check failed');
                addSystemMessage('Warning: Backend service may not be available.');
            }
        })
        .catch(error => {
            console.error('DEBUG: Health check failed:', error);
            addSystemMessage('Warning: Could not connect to the backend service.');
        });
});