// ============================================================================
// GEARHUB FLOATING AI CONSULTANT & SHOPPING ASSISTANT
// ============================================================================

let chatHistory = [];

function toggleAiChat() {
  if (typeof document === 'undefined') return;
  const win = document.getElementById('ai-chat-window');
  if (!win) return;
  const isOpen = win.classList.toggle('open');
  if (isOpen) {
    document.getElementById('ai-chat-input')?.focus();
  }
}

function sendQuickPrompt(promptText) {
  if (typeof document === 'undefined') return;
  const input = document.getElementById('ai-chat-input');
  if (input) {
    input.value = promptText;
    handleAiChatSubmit();
  }
}

async function handleAiChatSubmit(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  if (typeof document === 'undefined') return;

  const input = document.getElementById('ai-chat-input');
  if (!input) return;
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  appendChatBubble('user', message);

  const typing = document.getElementById('chat-typing-indicator');
  if (typing) typing.style.display = 'block';
  scrollChatToBottom();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: chatHistory })
    });
    const data = await res.json();
    if (typing) typing.style.display = 'none';

    if (data.success) {
      chatHistory.push({ role: 'user', content: message });
      chatHistory.push({ role: 'model', content: data.reply });
      appendChatBubble('bot', data.reply, data.suggestedProducts);
    } else {
      appendChatBubble('bot', 'Hiện tại kết nối tư vấn đang gián đoạn, bạn vui lòng thử lại sau giây lát.');
    }
  } catch (err) {
    if (typing) typing.style.display = 'none';
    console.error('Lỗi gọi chat AI:', err);
    appendChatBubble('bot', 'Hệ thống tư vấn đang bận, bạn vui lòng gửi lại câu hỏi.');
  }

  scrollChatToBottom();
}

function appendChatBubble(role, text, suggestedProducts = []) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${role === 'user' ? 'user' : 'bot'}`;

  const formattedText = (text || '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  let miniCardsHtml = '';
  const fmt = typeof formatMoney === 'function' ? formatMoney : (v) => v + ' ₫';
  if (Array.isArray(suggestedProducts) && suggestedProducts.length > 0) {
    miniCardsHtml = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem;">
        ${suggestedProducts
          .map(
            (p) => `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.5rem; background-color: var(--surface);">
            <div>
              <div style="font-weight: 600; font-size: 0.8125rem;">${p.name}</div>
              <div class="tabular" style="color: var(--accent-text); font-size: 0.8125rem;">${fmt(p.price)}</div>
            </div>
            <div style="display: flex; gap: 0.35rem;">
              <button type="button" style="padding: 0.3rem 0.55rem; background-color: var(--bg); font-size: 0.8125rem;" onclick="openProductDetailModal('${p.id}')">Xem</button>
              <button type="button" style="padding: 0.3rem 0.55rem; background-color: var(--accent); color: var(--accent-ink); font-weight: 600; font-size: 0.8125rem;" onclick="addToCart('${p.id}')">Mua</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  msgDiv.innerHTML = `<div class="msg-bubble">${formattedText}${miniCardsHtml}</div>`;
  container.appendChild(msgDiv);
  scrollChatToBottom();
}

function scrollChatToBottom() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('ai-chat-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}
