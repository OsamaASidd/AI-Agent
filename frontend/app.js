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
    
    // API URL - Change this to your backend URL in production
    const API_URL = 'http://localhost:5000/api';
    
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
    
    // Function to handle sending a query
    async function handleSendQuery() {
        const query = queryInput.value.trim();
        
        if (!query) return;
        
        // Add user message to chat
        addUserMessage(query);
        
        // Clear input
        queryInput.value = '';
        
        // Show loading overlay
        loadingOverlay.classList.add('active');
        
        try {
            // Get merchant ID
            const merchantId = merchantSelect.value;
            console.log("Calling Post HEHEHEHE");
            // Send query to API
            const response = await fetch(`${API_URL}/agent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    merchant_id: merchantId
                }),
            });
            
            // Process response
            const data = await response.json();
            
            // Hide loading overlay
            loadingOverlay.classList.remove('active');
            
            if (response.ok) {
                if (data.error) {
                    // Add error message
                    addSystemMessage(`Error: ${data.error}`);
                } else if (data.message) {
                    // Add no data message
                    addSystemMessage(data.message);
                } else {
                    // Add AI response with visualization
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
    
    // Function to add an AI message with visualization
    function addAiMessage(data) {
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
    fetch(`${API_URL}/health`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'healthy') {
                console.log('Backend is healthy');
            } else {
                addSystemMessage('Warning: Backend service may not be available.');
            }
        })
        .catch(error => {
            console.error('Health check failed:', error);
            addSystemMessage('Warning: Could not connect to the backend service.');
        });
});