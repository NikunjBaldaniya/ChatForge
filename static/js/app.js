const MODELS = {
    'OpenAI': ['gpt-5.1', 'gpt-5.1-chat-latest', 'gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-chat-latest', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini', 'o1', 'o3', 'o3-mini', 'o4-mini', 'openrouter:openai/gpt-oss-120b:exacto', 'openrouter:openai/gpt-oss-safeguard-20b'],

    'OpenAI Codex': [
        "openrouter:openai/codex-mini",
        "openrouter:openai/gpt-5-codex",
        "openrouter:openai/gpt-5.1-codex-max",
    ],

    'Claude': ['claude-sonnet-4-5', 'claude-opus-4', 'claude-opus-4-5', 'claude-haiku-4-5'],

    'DeepSeek': ['deepseek/deepseek-chat-v3-0324', 'deepseek/deepseek-chat-v3.1', 'deepseek/deepseek-prover-v2', 'deepseek/deepseek-r1', 'deepseek/deepseek-r1-0528', 'deepseek/deepseek-r1-0528-qwen3-8b', 'deepseek/deepseek-r1-distill-qwen-14b', 'deepseek/deepseek-r1-distill-qwen-32b', 'deepseek/deepseek-v3.1-terminus', 'deepseek/deepseek-v3.2-exp'],

    'Google Gemini': ['gemini-3-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'],

    'Google Gemma': ['google/gemma-2-27b-it', 'google/gemma-2-9b-it', 'google/gemma-3-27b-it', 'google/gemma-3-4b-it',],

    'Grok': ['x-ai/grok-2-1212', 'x-ai/grok-2-vision-1212', 'x-ai/grok-3', 'x-ai/grok-3-beta', 'x-ai/grok-3-mini', 'x-ai/grok-3-mini-beta', 'x-ai/grok-4', 'x-ai/grok-4.1-fast', 'x-ai/grok-code-fast-1'],

    'Amazon Nova': [
        "amazon/nova-2-lite-v1",
        "amazon/nova-lite-v1",
        "amazon/nova-micro-v1",
        "amazon/nova-premier-v1",
        "amazon/nova-pro-v1"
    ]
};

const GUEST_MODELS = {
    'OpenAI': ['gpt-4o'],
    'Claude': ['claude-haiku-4-5'],
    'DeepSeek': ['deepseek/deepseek-r1'],
    'Google Gemini': ['gemini-2.0-flash', 'gemini-2.5-flash'],
    'Google Gemma': ['google/gemma-3-4b-it'],
    'Grok': ['x-ai/grok-3-mini']
};

const FREE_MODELS = ['gpt-5', 'gpt-4o', 'claude-haiku-4-5', 'deepseek/deepseek-r1', 'gemini-2.5-flash', 'gemini-2.0-flash', 'google/gemma-3-4b-it', 'x-ai/grok-3', 'x-ai/grok-3-mini'];
const PRO_MODELS = Object.values(MODELS).flat();

let messages = [];
let uploadedFile = null;
let isLoggedIn = false;
let currentSessionId = generateUUID();
let editingSessionId = null;
let isBotResponding = false;
let currentMessageCount = 0;
let userSubscription = 'free';
let userSubscriptionPlan = 'Free Plan';
let userSubscriptionExpiry = null;
let firstUserInput = null;

marked.setOptions({ renderer: getRenderer() });

function getRenderer() {
    const renderer = new marked.Renderer();
    renderer.code = (code, lang) => `
        <div class="code-block">
            <div class="code-header">
                <span>${lang || 'text'}</span>
                <button class="btn-copy" onclick="copyCode(this)">Copy</button>
            </div>
            <pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </div>
    `;
    return renderer;
}

function copyCode(btn) {
    const code = btn.parentElement.nextElementSibling.textContent;
    navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
    });
}

let currentMode = 'search';
let currentProvider = 'OpenAI';
let currentModel = 'gpt-5.1';
let userNickname = '';
let userSystemPrompt = '';
let selectedPlan = 'monthly';
let selectedPlanPrice = 9.99;
let selectedPlanDays = 30;
let selectedPaymentMethod = 'card';

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

function toggleProviderSelector() {
    const selector = document.getElementById('providerSelector');
    const modelSelector = document.getElementById('modelSelector');
    modelSelector.style.display = 'none';
    selector.style.display = selector.style.display === 'none' ? 'block' : 'none';

    if (selector.style.display === 'block') {
        populateProviderList();
    }
}

function toggleModelSelector() {
    const selector = document.getElementById('modelSelector');
    const providerSelector = document.getElementById('providerSelector');
    providerSelector.style.display = 'none';
    selector.style.display = selector.style.display === 'none' ? 'block' : 'none';

    if (selector.style.display === 'block') {
        populateModelList();
    }
}

function populateProviderList() {
    const list = document.getElementById('providerList');
    list.innerHTML = '';

    Object.keys(MODELS).forEach(provider => {
        const item = document.createElement('div');
        item.className = 'selector-item' + (provider === currentProvider ? ' active' : '');
        item.innerHTML = `<i class="fas fa-building"></i><span>${provider}</span>`;
        item.onclick = () => selectProvider(provider);
        list.appendChild(item);
    });
}

function populateModelList() {
    const list = document.getElementById('modelList');
    list.innerHTML = '';

    const models = MODELS[currentProvider] || [];

    // Separate free and pro models
    const freeModels = [];
    const proModels = [];

    models.forEach(model => {
        if (!isLoggedIn) {
            if (isGuestModel(model)) {
                freeModels.push(model);
            } else {
                proModels.push(model);
            }
        } else if (userSubscription === 'free') {
            if (FREE_MODELS.includes(model)) {
                freeModels.push(model);
            } else {
                proModels.push(model);
            }
        } else {
            freeModels.push(model);
        }
    });

    // Render free models first
    freeModels.forEach(model => {
        const item = document.createElement('div');
        item.className = 'selector-item' + (model === currentModel ? ' active' : '');
        item.innerHTML = `<i class="fas fa-microchip"></i><span>${model}</span>`;
        item.onclick = () => selectModel(model);
        list.appendChild(item);
    });

    // Add divider if there are pro models
    if (proModels.length > 0) {
        const divider = document.createElement('div');
        divider.style.cssText = 'padding: 8px 16px; font-size: 0.75rem; font-weight: 600; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.05em; background: var(--bg-2);';
        divider.textContent = 'Pro Models';
        list.appendChild(divider);
    }

    // Render pro models
    proModels.forEach(model => {
        const item = document.createElement('div');
        item.className = 'selector-item disabled';

        let badge = '';
        if (!isLoggedIn) {
            badge = '<span class="model-badge" style="background: #ffc107; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 8px;">Login</span>';
        } else if (userSubscription === 'free') {
            badge = '<span class="model-badge" style="background: #10a37f; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 8px;">Pro</span>';
        }

        item.innerHTML = `<i class="fas fa-microchip"></i><span>${model}</span>${badge}`;
        item.onclick = () => selectModel(model);
        list.appendChild(item);
    });
}

function isGuestModel(model) {
    const guestModels = GUEST_MODELS[currentProvider] || [];
    return guestModels.includes(model);
}

function canUseModel(model) {
    if (!isLoggedIn) {
        return isGuestModel(model);
    }
    if (userSubscription === 'free') {
        return FREE_MODELS.includes(model);
    }
    return true;
}

function selectProvider(provider) {
    currentProvider = provider;
    document.getElementById('providerSelector').style.display = 'none';

    if (MODELS[provider] && MODELS[provider].length > 0) {
        selectModel(MODELS[provider][0]);
    }
}

function selectModel(model) {
    if (!canUseModel(model)) {
        if (!isLoggedIn) {
            showAuthRequiredModal();
        } else if (userSubscription === 'free') {
            showProRequiredModal();
        }
        return;
    }
    currentModel = model;
    document.getElementById('modelSelector').style.display = 'none';
}

function showAuthRequiredModal() {
    const modal = new bootstrap.Modal(document.getElementById('authRequiredModal'));
    modal.show();
}

function showProRequiredModal() {
    const modal = new bootstrap.Modal(document.getElementById('proRequiredModal'));
    modal.show();
}

function goToLogin() {
    window.location.href = '/login';
}

function goToSignup() {
    window.location.href = '/signup';
}

async function sendMessage() {
    if (isBotResponding) return;

    const input = document.getElementById('messageInput');
    const text = input.textContent.trim();
    if (!text && !uploadedFile) return;

    if (isLoggedIn && userSubscription === 'free') {
        currentMessageCount++;

        if (currentMessageCount >= 20) {
            showUpgradeModal('limit');
            return;
        } else if (currentMessageCount === 15) {
            showUpgradeModal('warning');
        }
    }

    if (!firstUserInput && text) {
        firstUserInput = text;
    }

    const model = currentModel;

    isBotResponding = true;
    disableInput();

    hideWelcome();
    addMessage(text || 'Analyze file', 'user');
    input.textContent = '';

    if (messages.length === 0 && (userNickname || userSystemPrompt)) {
        let systemContext = '';
        if (userNickname) systemContext += `The user's name is ${userNickname}. Address them by their name when appropriate. `;
        if (userSystemPrompt) systemContext += userSystemPrompt;
        messages.push({ role: 'system', content: systemContext });
    }

    messages.push({ role: 'user', content: text });

    if (isLoggedIn) await saveMsg('user', text, model);

    showThinking();

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, model })
        });

        const data = await res.json();

        if (!data.success) {
            hideThinking();
            addMessage(data.message, 'bot');
            isBotResponding = false;
            enableInput();
            return;
        }

        let aiRes;
        if (uploadedFile) {
            aiRes = await puter.ai.chat(text || 'What is this?', uploadedFile, { model });
            uploadedFile = null;
            document.getElementById('filePreview').innerHTML = '';
        } else {
            aiRes = await puter.ai.chat(messages, { model });
        }

        hideThinking();
        const reply = aiRes.message?.content || 'No response';
        messages.push(aiRes.message);
        addMessage(reply, 'bot');

        if (isLoggedIn) await saveMsg('assistant', reply, model);

        if (messages.length === 2 && isLoggedIn && firstUserInput) generateTitle();

        updateCredits();
    } catch (error) {
        hideThinking();
        addMessage('⚠️ Error occurred. Try a different model or check your connection.', 'bot');
    } finally {
        isBotResponding = false;
        enableInput();
    }
}

function disableInput() {
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('sendBtn').style.opacity = '0.5';
}

function enableInput() {
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('sendBtn').style.opacity = '1';
}

async function saveMsg(role, content, model) {
    await fetch('/api/save-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSessionId, role, content, model })
    });
}

async function generateTitle() {
    if (!firstUserInput || firstUserInput.trim().length === 0) return;

    const res = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_user_input: firstUserInput, session_id: currentSessionId })
    });
    const data = await res.json();
    if (data.success) {
        loadHistory();
    }
}

function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `message ${type}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-comments"></i>';

    const content = document.createElement('div');
    content.className = 'message-content';

    if (type === 'user') {
        content.textContent = text;
    } else {
        typeText(content, text);
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn-copy-message';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.onclick = () => copyMessage(text, copyBtn);
        div.appendChild(copyBtn);
    }

    div.appendChild(avatar);
    div.appendChild(content);
    document.getElementById('messages').appendChild(div);
    scrollToBottom();
}

function copyMessage(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i>', 1500);
    });
}

function typeText(el, text, i = 0) {
    if (i === 0) el.innerHTML = '';
    if (i < text.length) {
        el.innerHTML = marked.parse(text.substring(0, i + 1));
        setTimeout(() => typeText(el, text, i + 1), 10);
        scrollToBottom();
    }
}

function showThinking() {
    hideWelcome();
    const div = document.createElement('div');
    div.id = 'thinking';
    div.className = 'message bot';
    div.innerHTML = `
        <div class="message-avatar"><i class="fas fa-comments"></i></div>
        <div class="message-content">
            <div class="thinking">
                <div class="thinking-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('messages').appendChild(div);
    scrollToBottom();
}

function hideThinking() {
    const el = document.getElementById('thinking');
    if (el) el.remove();
}

function hideWelcome() {
    const el = document.getElementById('welcomeScreen');
    if (el) el.style.display = 'none';
}

async function handleFileUpload() {
    const file = document.getElementById('fileInput').files[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    try {
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (data.success) {
            uploadedFile = data.data;
            showFile(file.name);
        }
    } catch (error) {
        alert('Upload failed');
    }
}

function showFile(name) {
    document.getElementById('filePreview').innerHTML = `
        <div class="file-chip">
            <i class="fas fa-file"></i>
            <span>${name}</span>
            <button onclick="removeFile()"><i class="fas fa-times"></i></button>
        </div>
    `;
}

function removeFile() {
    uploadedFile = null;
    document.getElementById('filePreview').innerHTML = '';
    document.getElementById('fileInput').value = '';
}

function newChat() {
    messages = [];
    uploadedFile = null;
    currentSessionId = generateUUID();
    currentMessageCount = 0;
    firstUserInput = null;
    document.getElementById('messages').innerHTML = '';
    document.getElementById('messageInput').textContent = '';
    document.getElementById('filePreview').innerHTML = '';
    document.getElementById('welcomeScreen').style.display = 'flex';
    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));

    if (isLoggedIn && (userNickname || userSystemPrompt)) {
        let systemContext = '';
        if (userNickname) systemContext += `The user's name is ${userNickname}. Address them by their name when appropriate. `;
        if (userSystemPrompt) systemContext += userSystemPrompt;
        messages.push({ role: 'system', content: systemContext });
    }
}

function showUpgradeModal(type) {
    const modal = new bootstrap.Modal(document.getElementById('upgradeModal'));
    const title = document.getElementById('upgradeModalTitle');
    const body = document.getElementById('upgradeModalBody');

    if (type === 'warning') {
        title.textContent = 'Approaching Message Limit';
        body.innerHTML = '<p>You have 5 messages remaining in this chat. Upgrade to Pro for unlimited messages!</p>';
        document.getElementById('upgradeModalCancel').style.display = 'inline-block';
    } else {
        title.textContent = 'Message Limit Reached';
        body.innerHTML = '<p>You\'ve reached the 20 message limit for free users in this chat. Upgrade to Pro or start a new chat!</p>';
        document.getElementById('upgradeModalCancel').style.display = 'none';
    }

    modal.show();
}

function quickStart(text) {
    document.getElementById('messageInput').textContent = text;
    sendMessage();
}

async function updateCredits() {
    const res = await fetch('/api/credits');
    const data = await res.json();
    document.getElementById('creditsCount').textContent = data.credits;
    isLoggedIn = data.logged_in;
    userSubscription = data.subscription || 'guest';
    userSubscriptionPlan = data.subscription_plan || 'Free Plan';
    userSubscriptionExpiry = data.subscription_expiry;

    if (data.welcome_type) {
        setTimeout(() => {
            showWelcomeModal(data.welcome_type, data.username);
        }, 500);
    }

    if (isLoggedIn) {
        await loadPersonalization();
    }

    updateUI();
}

function showWelcomeModal(type, username) {
    const title = document.getElementById('welcomeModalTitle');
    const body = document.getElementById('welcomeModalBody');

    if (type === 'signup') {
        title.textContent = 'Welcome to ChatForge!';
        body.innerHTML = `
            <p>🎉 Thanks for joining us, ${username || 'there'}! Here's what you get:</p>
            <ul>
                <li>100 free credits daily</li>
                <li>Access to 70+ AI models</li>
                <li>Chat history saved automatically</li>
                <li>Personalization options</li>
            </ul>
            <p>Start chatting now and explore the power of AI!</p>
        `;
    } else {
        title.textContent = 'Welcome Back!';
        body.innerHTML = `
            <p>👋 Great to see you again, ${username || 'there'}!</p>
            <ul>
                <li>Your credits have been refreshed</li>
                <li>All your chat history is ready</li>
                <li>Continue where you left off</li>
            </ul>
            <p>Ready to continue your AI journey?</p>
        `;
    }

    const modal = new bootstrap.Modal(document.getElementById('welcomeModal'));
    modal.show();
}

function updateUI() {
    const footer = document.getElementById('sidebarFooter');
    const menu = document.getElementById('userDropdownMenu');

    if (isLoggedIn) {
        footer.classList.remove('hidden');

        let planBadge = '';
        if (userSubscription === 'pro') {
            planBadge = '<span style="background: #10a37f; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 8px;">PRO</span>';
        }

        menu.innerHTML = `
            <li><span class="dropdown-item-text" style="font-weight: 600;" id="username"></span></li>
            <li><span class="dropdown-item-text" style="font-size: 0.85rem; color: var(--text-2);">${userSubscriptionPlan}${planBadge}</span></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="openSettings()"><i class="fas fa-cog me-2"></i>Settings</a></li>
            <li><a class="dropdown-item" href="/upgrade"><i class="fas fa-crown me-2"></i>Upgrade</a></li>
            <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Sign Out</a></li>
        `;
        loadHistory();
    } else {
        footer.classList.add('hidden');
        menu.innerHTML = `
            <li><a class="dropdown-item" href="/login"><i class="fas fa-sign-in-alt me-2"></i>Sign In</a></li>
            <li><a class="dropdown-item" href="/signup"><i class="fas fa-user-plus me-2"></i>Sign Up</a></li>
        `;
        document.getElementById('chatHistory').innerHTML = '';
    }
}

async function loadHistory() {
    if (!isLoggedIn) return;

    try {
        const res = await fetch('/api/chat-sessions');
        const data = await res.json();

        const container = document.getElementById('chatHistory');
        container.innerHTML = '';

        if (data.success && data.sessions && data.sessions.length > 0) {
            data.sessions.forEach(s => {
                const div = document.createElement('div');
                div.className = 'history-item' + (s.session_id === currentSessionId ? ' active' : '');
                const safeTitle = (s.title || 'New Chat').replace(/'/g, "\\'");
                div.innerHTML = `
                    <span title="${safeTitle}">${s.title || 'New Chat'}</span>
                    <div class="history-actions">
                        <button class="btn-history" onclick="editTitle('${s.session_id}', '${safeTitle}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-history" onclick="deleteChat('${s.session_id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                div.onclick = (e) => {
                    if (!e.target.closest('.btn-history')) loadSession(s.session_id);
                };
                container.appendChild(div);
            });
        } else if (data.success) {
            container.innerHTML = '<div style="padding: 12px; color: var(--text-2); font-size: 0.9rem; text-align: center;">No chat history yet</div>';
        }
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

async function loadSession(id) {
    try {
        const res = await fetch(`/api/load-session/${id}`);
        const data = await res.json();

        if (data.success) {
            currentSessionId = id;
            messages = [];
            currentMessageCount = data.message_count || 0;
            firstUserInput = null;

            if (userNickname || userSystemPrompt) {
                let systemContext = '';
                if (userNickname) systemContext += `The user's name is ${userNickname}. Address them by their name when appropriate. `;
                if (userSystemPrompt) systemContext += userSystemPrompt;
                messages.push({ role: 'system', content: systemContext });
            }

            document.getElementById('messages').innerHTML = '';
            document.getElementById('welcomeScreen').style.display = 'none';

            if (data.messages && data.messages.length > 0) {
                data.messages.forEach(m => {
                    messages.push({ role: m.role, content: m.content });
                    addMessageInstant(m.content, m.role === 'user' ? 'user' : 'bot');
                });
            } else {
                document.getElementById('welcomeScreen').style.display = 'flex';
            }

            loadHistory();
            scrollToBottom();
        } else {
            alert(data.message || 'Failed to load chat');
        }
    } catch (error) {
        console.error('Failed to load session:', error);
        alert('Failed to load chat session');
    }
}

function addMessageInstant(text, type) {
    const div = document.createElement('div');
    div.className = `message ${type}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-comments"></i>';

    const content = document.createElement('div');
    content.className = 'message-content';

    if (type === 'user') {
        content.textContent = text;
    } else {
        content.innerHTML = marked.parse(text);
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn-copy-message';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.onclick = () => copyMessage(text, copyBtn);
        div.appendChild(copyBtn);
    }

    div.appendChild(avatar);
    div.appendChild(content);
    document.getElementById('messages').appendChild(div);
}

function editTitle(id, title) {
    event.stopPropagation();
    editingSessionId = id;
    document.getElementById('editTitleInput').value = title.replace(/\\'/g, "'");
    new bootstrap.Modal(document.getElementById('editTitleModal')).show();
}

async function saveTitle() {
    const title = document.getElementById('editTitleInput').value.trim();
    if (!title) {
        alert('Title cannot be empty');
        return;
    }

    try {
        const res = await fetch('/api/update-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: editingSessionId, title })
        });

        const data = await res.json();
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('editTitleModal')).hide();
            loadHistory();
        } else {
            alert(data.message || 'Failed to update title');
        }
    } catch (error) {
        console.error('Failed to save title:', error);
        alert('Failed to save title');
    }
}

async function deleteChat(id) {
    if (!confirm('Delete this chat? This action cannot be undone.')) return;

    try {
        const res = await fetch('/api/delete-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: id })
        });

        const data = await res.json();
        if (data.success) {
            if (id === currentSessionId) {
                newChat();
            }
            loadHistory();
        } else {
            alert(data.message || 'Failed to delete chat');
        }
    } catch (error) {
        console.error('Failed to delete chat:', error);
        alert('Failed to delete chat');
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    const dark = document.body.classList.contains('dark-theme');
    document.getElementById('themeToggle').innerHTML = `<i class="fas fa-${dark ? 'sun' : 'moon'}"></i>`;
    localStorage.setItem('theme', dark ? 'dark' : 'light');
}

function openSettings() {
    if (!isLoggedIn) {
        window.location.href = '/login';
        return;
    }
    loadPersonalization();
    new bootstrap.Modal(document.getElementById('settingsModal')).show();
}

function showTab(tab) {
    document.querySelectorAll('.settings-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.settings-nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
    event.target.classList.add('active');
}

async function loadPersonalization() {
    const res = await fetch('/api/personalization');
    const data = await res.json();

    if (data.success) {
        userNickname = data.nickname || '';
        userSystemPrompt = data.system_prompt || '';
        document.getElementById('nicknameInput').value = userNickname;
        document.getElementById('systemPromptInput').value = userSystemPrompt;
    }
}

async function savePersonalization() {
    const nickname = document.getElementById('nicknameInput').value.trim();
    const systemPrompt = document.getElementById('systemPromptInput').value.trim();

    try {
        const res = await fetch('/api/personalization', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nickname: nickname,
                system_prompt: systemPrompt,
                optimized_prompt: ''
            })
        });

        const data = await res.json();
        if (data.success) {
            userNickname = nickname;
            userSystemPrompt = systemPrompt;
            alert('Personalization saved successfully!');
        } else {
            alert('Failed to save personalization');
        }
    } catch (error) {
        console.error('Failed to save:', error);
        alert('Failed to save personalization');
    }
}

async function optimizePrompt() {
    const nickname = document.getElementById('nicknameInput').value.trim();
    const prompt = document.getElementById('systemPromptInput').value.trim();

    if (!nickname && !prompt) {
        alert('Enter nickname or prompt');
        return;
    }

    const res = await fetch('/api/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, system_prompt: prompt })
    });

    const data = await res.json();
    if (data.success) {
        document.getElementById('optimizedText').textContent = data.optimized_prompt;
        new bootstrap.Modal(document.getElementById('optimizedModal')).show();
    }
}

async function useOptimized() {
    const optimized = document.getElementById('optimizedText').textContent;

    await fetch('/api/personalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nickname: document.getElementById('nicknameInput').value,
            system_prompt: document.getElementById('systemPromptInput').value,
            optimized_prompt: optimized
        })
    });

    bootstrap.Modal.getInstance(document.getElementById('optimizedModal')).hide();
    alert('Saved!');
}

function copyOptimized() {
    const text = document.getElementById('optimizedText').textContent;
    navigator.clipboard.writeText(text).then(() => alert('Copied!'));
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = sidebar.querySelector('.btn-toggle i');

    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('show');
    } else {
        sidebar.classList.toggle('expanded');
        if (sidebar.classList.contains('expanded')) {
            toggle.className = 'fas fa-angles-left';
        } else {
            toggle.className = 'fas fa-angles-right';
        }
    }
}

function handleScroll() {
    const container = document.getElementById('chatContainer');
    const btn = document.getElementById('scrollBtn');
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    btn.style.display = atBottom ? 'none' : 'flex';
}

function scrollToBottom() {
    document.getElementById('chatContainer').scrollTop = document.getElementById('chatContainer').scrollHeight;
}



function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    location.reload();
}

document.getElementById('messageInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isBotResponding) sendMessage();
    }
});

document.getElementById('messageInput').addEventListener('paste', e => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
});

// Init
const theme = localStorage.getItem('theme') || 'light';
document.body.className = theme + '-theme';
document.getElementById('themeToggle').innerHTML = `<i class="fas fa-${theme === 'dark' ? 'sun' : 'moon'}"></i>`;

if (sessionStorage.getItem('justUpgraded') === 'true') {
    const newCredits = sessionStorage.getItem('newCredits');

    if (newCredits) {
        document.getElementById('creditsCount').textContent = newCredits;
    }

    sessionStorage.removeItem('justUpgraded');
    sessionStorage.removeItem('newCredits');
    sessionStorage.removeItem('newPlan');

    setTimeout(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }, 500);
}

updateCredits();

function startNewChatFromModal() {
    bootstrap.Modal.getInstance(document.getElementById('upgradeModal')).hide();
    newChat();
}

function goToUpgrade() {
    bootstrap.Modal.getInstance(document.getElementById('upgradeModal'))?.hide();
    bootstrap.Modal.getInstance(document.getElementById('proRequiredModal'))?.hide();
    window.location.href = `/payment?plan=${selectedPlan}&price=${selectedPlanPrice}&days=${selectedPlanDays}`;
}

function showPaymentModal() {
    window.location.href = `/payment?plan=${selectedPlan}&price=${selectedPlanPrice}&days=${selectedPlanDays}`;
}

function selectPlan(plan, price, element) {
    selectedPlan = plan;
    selectedPlanPrice = price;

    if (plan === 'monthly') selectedPlanDays = 30;
    else if (plan === 'quarterly') selectedPlanDays = 90;
    else if (plan === 'yearly') selectedPlanDays = 365;

    document.querySelectorAll('.plan-card').forEach(el => el.style.borderColor = 'var(--border)');
    element.style.borderColor = 'var(--accent)';
    document.getElementById('payAmount').textContent = '$' + price;
}

function selectPaymentMethod(method, element) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-method-btn').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    document.getElementById('cardPayment').style.display = 'none';
    document.getElementById('paypalPayment').style.display = 'none';
    document.getElementById('cryptoPayment').style.display = 'none';

    if (method === 'card') document.getElementById('cardPayment').style.display = 'block';
    else if (method === 'paypal') document.getElementById('paypalPayment').style.display = 'block';
    else if (method === 'crypto') document.getElementById('cryptoPayment').style.display = 'block';
}

function processPayment() {
    let paymentData = {};

    if (selectedPaymentMethod === 'card') {
        const cardNumber = document.getElementById('cardNumber').value;
        const cardName = document.getElementById('cardName').value;
        const cardExpiry = document.getElementById('cardExpiry').value;
        const cardCvv = document.getElementById('cardCvv').value;

        if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
            alert('Please fill in all card details');
            return;
        }
        paymentData = { cardNumber, cardName, cardExpiry, cardCvv };
    } else if (selectedPaymentMethod === 'paypal') {
        const paypalEmail = document.getElementById('paypalEmail').value;
        if (!paypalEmail) {
            alert('Please enter PayPal email');
            return;
        }
        paymentData = { paypalEmail };
    } else if (selectedPaymentMethod === 'crypto') {
        const cryptoWallet = document.getElementById('cryptoWallet').value;
        const cryptoType = document.getElementById('cryptoType').value;
        if (!cryptoWallet) {
            alert('Please enter wallet address');
            return;
        }
        paymentData = { cryptoWallet, cryptoType };
    }

    document.getElementById('paymentCloseBtn').disabled = true;
    const btn = document.getElementById('payBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
        showProcessingModal();
    }, 500);
}

function showProcessingModal() {
    const modal = new bootstrap.Modal(document.getElementById('processingModal'));
    modal.show();

    const progressBar = document.getElementById('progressBar');
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        progressBar.style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('processingModal')).hide();
                showPaymentSuccess();
            }, 500);
        }
    }, 60);
}

function showPaymentSuccess() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + selectedPlanDays);
    const formattedDate = expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    document.getElementById('expiryDate').textContent = formattedDate;

    const modal = new bootstrap.Modal(document.getElementById('successModal'));
    modal.show();

    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });

    setTimeout(async () => {
        await fetch('/api/upgrade-pro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plan: selectedPlan,
                days: selectedPlanDays,
                amount: selectedPlanPrice,
                payment_method: selectedPaymentMethod
            })
        });
        userSubscription = 'pro';
        bootstrap.Modal.getInstance(document.getElementById('successModal')).hide();
        location.reload();
    }, 3000);
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.input-box')) {
        document.getElementById('providerSelector').style.display = 'none';
        document.getElementById('modelSelector').style.display = 'none';
    }
});
