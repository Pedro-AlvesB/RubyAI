// Elementos do DOM
const messagesContainer = document.getElementById("messages");
const userMessageInput = document.getElementById("userMessage");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");

// Cache para respostas da IA
const responseCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
let supportsWebP = false;
const speakBtn = document.getElementById("speakBtn");
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const closeSidebarBtn = document.getElementById("closeSidebar");
const savedConversationsContainer = document.getElementById("savedConversations");
const restartConversationBtn = document.getElementById("restartConversationBtn");
const settingsBtn = document.getElementById("settingsBtn");
const toggleModeBtn = document.getElementById("toggleModeBtn");
const weatherTemp = document.getElementById("weatherTemp");
const weatherCity = document.getElementById("weatherCity");

// Detector de capacidades do dispositivo
const deviceCapabilities = {
    isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isLandscape: window.matchMedia("(orientation: landscape)").matches,
    pixelRatio: window.devicePixelRatio || 1
};

// Ajustar UI baseado no dispositivo
function adjustUIForDevice() {
    const body = document.body;
    
    // Adicionar classes baseadas no dispositivo
    if (deviceCapabilities.isTouch) {
        body.classList.add('touch-device');
    }
    
    if (deviceCapabilities.isMobile) {
        body.classList.add('mobile-device');
    }
    
    if (deviceCapabilities.isIOS) {
        body.classList.add('ios-device');
    }
    
    if (deviceCapabilities.isAndroid) {
        body.classList.add('android-device');
    }
    
    // Ajustar para landscape
    if (deviceCapabilities.isLandscape) {
        body.classList.add('landscape-mode');
    }
    
    // Log para debugging (opcional)
    console.log('Device capabilities:', deviceCapabilities);
}

// Detectar mudança de orientação
function handleOrientationChange() {
    const isLandscape = window.innerWidth > window.innerHeight;
    document.body.classList.toggle('landscape-mode', isLandscape);
    deviceCapabilities.isLandscape = isLandscape;
    
    // Ajustar UI específica para landscape
    if (isLandscape) {
        console.log('Modo landscape ativado');
        // Opcional: esconder elementos não essenciais
        const suggestions = document.getElementById('suggestionsContainer');
        if (suggestions && window.innerHeight < 500) {
            suggestions.style.display = 'none';
        }
    } else {
        console.log('Modo portrait ativado');
        const suggestions = document.getElementById('suggestionsContainer');
        if (suggestions) {
            suggestions.style.display = 'flex';
        }
    }
}

// Detectar mudança de tamanho com debounce
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Handle orientation changes and UI updates
        handleOrientationChange();
        
        // Ajustar fontes em telas muito pequenas
        const width = window.innerWidth;
        if (width < 320) {
            document.body.classList.add('extra-small-screen');
        } else {
            document.body.classList.remove('extra-small-screen');
        }
        
        // Atualizar cache de viewport
        localStorage.setItem('lastViewport', `${width}x${window.innerHeight}`);
        
        // Log device configuration
        const deviceConfig = getDeviceConfig();
        console.log(`[Device] ${deviceConfig.isMobile ? 'Mobile' : deviceConfig.isTablet ? 'Tablet' : 'Desktop'} ${deviceConfig.width}x${deviceConfig.height} @${deviceConfig.dpr}x`);
        
        // Se mudou de categoria de dispositivo, recarregar previews
        if (currentImages && currentImages.length > 0) {
            renderPreviews();
        }
    }, 250);
}

// Função para verificar safe areas (iPhone X+)
function checkSafeAreas() {
    const safeAreas = {
        top: 'env(safe-area-inset-top, 0px)',
        bottom: 'env(safe-area-inset-bottom, 0px)',
        left: 'env(safe-area-inset-left, 0px)',
        right: 'env(safe-area-inset-right, 0px)'
    };
    
    // Aplicar ajustes se necessário
    if (CSS.supports('padding: env(safe-area-inset-top)')) {
        document.documentElement.style.setProperty('--safe-area-top', safeAreas.top);
        document.documentElement.style.setProperty('--safe-area-bottom', safeAreas.bottom);
        document.documentElement.style.setProperty('--safe-area-left', safeAreas.left);
        document.documentElement.style.setProperty('--safe-area-right', safeAreas.right);
    }
}

// Verificar suporte a hover (para desktop vs mobile)
function checkHoverSupport() {
    const canHover = window.matchMedia('(hover: hover)').matches;
    document.body.classList.toggle('can-hover', canHover);
    document.body.classList.toggle('no-hover', !canHover);
}

// Inicializar ajustes de dispositivo
document.addEventListener('DOMContentLoaded', () => {
    adjustUIForDevice();
    checkHoverSupport();
    checkSafeAreas();
    
    // Event listeners para responsividade
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Verificar viewport inicial
    handleResize();
});
const weatherDesc = document.getElementById("weatherDesc");
const weatherIcon = document.getElementById("weatherIcon");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettings");
const themeSelect = document.getElementById("themeSelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");
const voiceSelect = document.getElementById("voiceSelect");
const shareBtn = document.getElementById("shareBtn");
const typingIndicator = document.getElementById("typingIndicator");
const suggestionsContainer = document.getElementById("suggestionsContainer");
const suggestions = document.querySelectorAll(".suggestion");
const uploadBtn = document.getElementById("uploadBtn");
const imageUpload = document.getElementById("imageUpload");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");
const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmMessage = document.getElementById("confirmMessage");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");
const confirmOkBtn = document.getElementById("confirmOkBtn");

// Elementos do Arduino e menu do LED serão selecionados após o DOMContentLoaded
let connectArduinoBtn = null;
let ligarLedBtn = null;
let desligarLedBtn = null;
let piscarLedBtn = null;
let ledMenu = null;
let ledMenuContent = null;

// Selecionar elementos após o DOM estar carregado
document.addEventListener('DOMContentLoaded', () => {
    // Elementos do menu colapsável
    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });

    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sidebar') && !e.target.closest('.menu-toggle')) {
            sidebar.classList.remove('open');
        }
    });

    // Inicializar elementos do Arduino
    connectArduinoBtn = document.querySelector('#connectArduinoBtn');
    ligarLedBtn = document.querySelector('#ligarLedBtn');
    desligarLedBtn = document.querySelector('#desligarLedBtn');
    piscarLedBtn = document.querySelector('#piscarLedBtn');
    ledMenu = document.querySelector('.collapsible.menu-item');
    ledMenuContent = document.querySelector('.collapsible-content');

    // Adicionar listener diretamente no menu do LED
    if (ledMenu) {
        ledMenu.addEventListener('click', () => {
            ledMenu.classList.toggle('active');
            if (ledMenuContent) {
                ledMenuContent.classList.toggle('active');
            }
        });
    }
});

// Debug - Verificar se os elementos foram encontrados após o fallback
console.log('Elementos após fallback:', {
    connectArduinoBtn,
    ligarLedBtn,
    desligarLedBtn,
    piscarLedBtn,
    ledMenu,
    ledMenuContent
});

// Configurações da API
const API_KEY = 'AIzaSyBmLeZlIjo-JBlbSPjV-ryl97WdYDBLDBg';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Variáveis globais
let currentImages = [];
let port = null;
let writer = null;
let recognition = null;
let voices = [];
let currentTheme = localStorage.getItem('theme') || 'light';
let isSpeaking = false;
let isListening = false;
let currentUtterance = null;
let confirmCallback = null;
let pendingMessages = [];
let isOnline = navigator.onLine;

// Placeholders dinâmicos para o input
const placeholders = [
    "Digite sua mensagem...",
    "Pergunte sobre IA...",
    "Envie uma imagem para análise...",
    "Como posso ajudá-lo hoje?",
    "Qual sua dúvida?",
    "Descreva o que precisa...",
    "Converse comigo!"
];

let placeholderIndex = 0;

// Iniciar rotação de placeholders
setInterval(() => {
    if (userMessageInput && !userMessageInput.matches(':focus')) {
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        userMessageInput.placeholder = placeholders[placeholderIndex];
    }
}, 3000);

// Utilitário de debounce para otimizar performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Gestos de toque para dispositivos móveis
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;
    
    if (swipeDistance > swipeThreshold && touchStartX < 50) {
        sidebar.classList.add('open');
        trackEvent('sidebar_opened', { method: 'swipe' });
    } else if (swipeDistance < -swipeThreshold) {
        sidebar.classList.remove('open');
        trackEvent('sidebar_closed', { method: 'swipe' });
    }
}

// Analytics básico para rastreamento de interações
function trackEvent(eventName, data = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, data);
    }
    // Console para desenvolvimento
    console.log(`[Analytics] ${eventName}:`, data);
}

// Verificar suporte a WebP
async function checkWebPSupport() {
    return new Promise((resolve) => {
        const webP = new Image();
        webP.onload = webP.onerror = function() {
            supportsWebP = webP.height === 2;
            if (supportsWebP) {
                document.body.classList.add('webp-support');
            }
            resolve(supportsWebP);
        };
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
}

// Gerar chave de cache baseada no conteúdo
function generateCacheKey(messageText, imageDataArray) {
    const textKey = messageText ? messageText.trim().toLowerCase() : '';
    const imageKey = imageDataArray && imageDataArray.length > 0 
        ? imageDataArray.map(img => img.substring(0, 100)).join('|') 
        : '';
    
    return `${textKey}|${imageKey}`;
}

// Verificar cache antes de chamar API
async function getCachedResponse(messageText, imageDataArray) {
    const cacheKey = generateCacheKey(messageText, imageDataArray);
    const cached = responseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[Cache] Resposta recuperada do cache');
        trackEvent('cache_hit', { key: cacheKey });
        return cached.response;
    }
    
    return null;
}

// Salvar resposta no cache
function cacheResponse(messageText, imageDataArray, response) {
    const cacheKey = generateCacheKey(messageText, imageDataArray);
    responseCache.set(cacheKey, {
        response,
        timestamp: Date.now()
    });
    
    // Limitar tamanho do cache (mantém apenas os 100 mais recentes)
    if (responseCache.size > 100) {
        const oldestKey = Array.from(responseCache.keys())[0];
        responseCache.delete(oldestKey);
    }
    
    trackEvent('cache_saved', { key: cacheKey, size: responseCache.size });
}

// Inicialização do DOM e elementos
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar suporte a WebP
    await checkWebPSupport();
    // Criar botão RubyVendas dinamicamente
    const rubyVendasBtn = document.createElement('a');
    rubyVendasBtn.href = 'https://rubyiavendas.com.br ';
    rubyVendasBtn.target = '_blank';
    rubyVendasBtn.id = 'rubyVendasBtn';
    rubyVendasBtn.className = 'ruby-vendas-btn';
    rubyVendasBtn.title = 'Ir para RubyVendas';
    
    rubyVendasBtn.innerHTML = `
        <div class="btn-content">
            <i class="fas fa-shopping-cart"></i>
            <span class="btn-text">RubyVendas</span>
        </div>
        <div class="btn-tooltip">Acessar Loja Online</div>
    `;
    
    // Adicionar ao body
    document.body.appendChild(rubyVendasBtn);
    
    // Adicionar analytics tracking para o botão RubyVendas
    rubyVendasBtn.addEventListener('click', () => {
        // Tracking com timestamp melhorado
        trackEvent('rubyvendas_click', {
            source: 'floating_button',
            timestamp: Date.now()
        });
        
        // Efeito de clique adicional
        rubyVendasBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            rubyVendasBtn.style.transform = '';
        }, 150);
    });
    
    // Animação de destaque periódica após 5 segundos
    setTimeout(() => {
        rubyVendasBtn.style.animation = 'pulseCart 2s infinite ease-in-out';
    }, 5000);
});

// Verificar conexão
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
    isOnline = navigator.onLine;
    const status = isOnline ? 'online' : 'offline';
    showNotification(`Você está ${isOnline ? 'conectado' : 'desconectado'}`, !isOnline);
    
    if (isOnline) {
        // Tentar sincronizar mensagens pendentes
        syncPendingMessages();
    } else {
        // Salvar mensagens localmente para enviar depois
        localStorage.setItem('pendingMessages', JSON.stringify(pendingMessages));
    }
}

async function syncPendingMessages() {
    const saved = localStorage.getItem('pendingMessages');
    if (saved) {
        pendingMessages = JSON.parse(saved);
    }
    
    if (pendingMessages.length > 0) {
        showNotification(`Enviando ${pendingMessages.length} mensagem(ns) pendente(s)...`);
        
        // Enviar cada mensagem pendente
        pendingMessages.forEach(async (messageData) => {
            try {
                await safeApiCall(() => sendMessageToAPI(messageData.text, messageData.images), 'Erro ao enviar mensagem pendente');
                // Remover mensagem pendente após envio bem-sucedido
                pendingMessages = pendingMessages.filter(msg => msg !== messageData);
            } catch (error) {
                console.error('Erro ao enviar mensagem pendente:', error);
            }
        });
        
        // Limpar mensagens pendentes do localStorage
        localStorage.removeItem('pendingMessages');
        
        if (pendingMessages.length === 0) {
            showNotification('Todas as mensagens pendentes foram enviadas!');
        }
    }
}

// Função wrapper para API calls com tratamento de erro
async function safeApiCall(apiFunction, errorMessage) {
    try {
        return await apiFunction();
    } catch (error) {
        console.error(errorMessage, error);
        showNotification(`Erro: ${errorMessage}`, true);
        return null;
    }
}

async function sendMessageToAPI(messageText, imageDataArray) {
    // Verificar cache primeiro
    const cachedResponse = await getCachedResponse(messageText, imageDataArray);
    if (cachedResponse) {
        showNotification('Resposta recuperada do cache! 🚀', false);
        return cachedResponse;
    }

    const requestData = {
        contents: [{
            parts: []
        }]
    };

    if (messageText) {
        requestData.contents[0].parts.push({ text: messageText });
    }

    if (imageDataArray && imageDataArray.length > 0) {
        imageDataArray.forEach(ci => {
            const base64Data = ci.split(',')[1];
            const mimeMatch = ci.match(/^data:(image\/\w+);base64/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            
            requestData.contents[0].parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        });
    }

    const response = await safeApiCall(
        () => axios.post(`${API_URL}?key=${API_KEY}`, requestData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000 // Timeout de 30 segundos
        }),
        'Falha ao comunicar com a IA'
    );

    if (!response) return null;
    
    const aiResponse = response.data.candidates[0].content.parts[0].text;
    
    // Salvar no cache
    cacheResponse(messageText, imageDataArray, aiResponse);
    
    return aiResponse;
}

// Função para formatar o texto da resposta da IA
function formatAIText(text) {
    if (!text) return text;
    
    // Divide o texto em frases usando pontuação
    let formattedText = text
        // Adiciona espaço após pontuações
        .replace(/([.!?])([A-Z])/g, '$1 $2')
        // Garante espaços após vírgulas
        .replace(/,([^\s])/g, ', $1')
        // Quebra parágrafos longos
        .replace(/([.!?])\s+/g, '$1\n\n');
    
    return formattedText;
}

// Melhora a qualidade da síntese de voz em navegadores compatíveis
function enhanceSpeechSynthesis() {
    // Verificar se o navegador suporta configurações avançadas
    if ('speechSynthesis' in window) {
        // Tentar configurar para melhor qualidade
        try {
            // Alguns navegadores têm configurações adicionais
            if (speechSynthesis.getVoices().some(v => v.localService === false)) {
                console.log('Vozes de servidor (cloud) disponíveis');
            }
        } catch (e) {
            console.log('Configurações avançadas não disponíveis');
        }
    }
}

// Inicialização do reconhecimento de voz
function initializeSpeechRecognition() {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userMessageInput.value = transcript;
        };

        recognition.onend = () => {
            isListening = false;
            micBtn.classList.remove('recording');
            if (userMessageInput.value.trim()) {
                sendMessage();
            }
        };

        recognition.onerror = (event) => {
            console.error('Erro no reconhecimento de voz:', event.error);
            isListening = false;
            micBtn.classList.remove('recording');
            showNotification('Erro no reconhecimento de voz. Tente novamente.', true);
        };
    } else {
        console.error('Reconhecimento de voz não suportado neste navegador');
        micBtn.disabled = true;
        showNotification('Reconhecimento de voz não está disponível no seu navegador.', true);
    }
}

// Função para detectar todas as vozes disponíveis no sistema
function detectAllSystemVoices() {
    console.log('Buscando vozes brasileiras no sistema...');
    
    // Método para forçar detecção
    let detectedVoices = window.speechSynthesis.getVoices();
    
    // Se tiver poucas, tentar forçar
    if (detectedVoices.length <= 1) {
        try {
            const tempUtterance = new SpeechSynthesisUtterance('teste');
            tempUtterance.lang = 'pt-BR';
            window.speechSynthesis.speak(tempUtterance);
            window.speechSynthesis.cancel();
        } catch (e) {
            console.log('Erro ao forçar detecção:', e);
        }
        
        setTimeout(() => {
            detectedVoices = window.speechSynthesis.getVoices();
            filterAndShowBrazilianVoices(detectedVoices);
        }, 300);
    } else {
        filterAndShowBrazilianVoices(detectedVoices);
    }
}

function filterAndShowBrazilianVoices(voiceList) {
    // Filtrar vozes brasileiras
    const brazilianVoices = voiceList.filter(voice => {
        return voice.lang === 'pt-BR' || 
               voice.lang === 'pt_BR' ||
               voice.lang.includes('pt') || 
               voice.name.includes('Brazil') || 
               voice.name.includes('Brasil') ||
               (voice.lang.includes('pt') && voice.name.includes('Desktop'));
    });
    
    console.log('=== VOZES BRASILEIRAS ENCONTRADAS ===');
    if (brazilianVoices.length > 0) {
        brazilianVoices.forEach((voice, index) => {
            console.log(`${index + 1}. ${voice.name}`);
            console.log(`   Idioma: ${voice.lang}`);
            console.log(`   Local: ${voice.localService ? 'Sistema' : 'Online'}`);
            console.log(`   Padrão: ${voice.default ? 'SIM' : 'Não'}`);
        });
        
        // Mostrar quais são as vozes Microsoft específicas
        const microsoftVoices = brazilianVoices.filter(v => 
            v.name.includes('Microsoft') || v.name.includes('Desktop')
        );
        
        if (microsoftVoices.length > 0) {
            console.log('\n=== VOZES MICROSOFT ===');
            microsoftVoices.forEach(v => {
                console.log(`• ${v.name.replace('Microsoft', '').replace('Desktop', '').trim()}`);
            });
        }
    } else {
        console.log('Nenhuma voz brasileira encontrada!');
        
        // Mostrar todas as vozes disponíveis para debug
        console.log('\n=== TODAS AS VOZES DISPONÍVEIS ===');
        voiceList.forEach((v, i) => {
            console.log(`${i+1}. ${v.name} - ${v.lang}`);
        });
    }
    
    voices = voiceList;
    populateVoiceSelect();
}

// Função para mostrar todas as vozes (modo debug)
function showAllVoices() {
    console.log('=== TODAS AS VOZES DISPONÍVEIS ===');
    voices.forEach((voice, index) => {
        const isBrazilian = voice.lang.includes('pt') || voice.lang.includes('BR') || 
                           voice.name.includes('Brazil') || voice.name.includes('Brasil');
        console.log(`${index + 1}. ${voice.name} - ${voice.lang} ${isBrazilian ? '🇧🇷' : '🌍'}`);
    });
    
    // Mostrar notificação com contagem
    const brazilianCount = voices.filter(v => 
        v.lang.includes('pt') || v.lang.includes('BR') || 
        v.name.includes('Brazil') || v.name.includes('Brasil')
    ).length;
    
    showNotification(
        `Total: ${voices.length} vozes | Brasileiras: ${brazilianCount}\nVer console para detalhes.`,
        false
    );
}

// Função para ativar e detectar vozes do Google Cloud (natural/neural)
async function enableGoogleCloudVoices() {
    console.log('Tentando habilitar vozes do Google Cloud...');
    
    try {
        // 1. Tentar configurar para usar vozes online
        if (speechSynthesis.addEventListener) {
            speechSynthesis.addEventListener('voiceschanged', () => {
                console.log('Vozes atualizadas após configuração');
            });
        }
        
        // 2. Método específico para Chrome
        if (navigator.userAgent.includes('Chrome')) {
            console.log('Detectado Chrome. Configurando para vozes do servidor...');
            
            // Tentar usar utterance com configurações especiais
            const testUtterance = new SpeechSynthesisUtterance('teste');
            testUtterance.lang = 'pt-BR';
            testUtterance.rate = 1.0;
            
            // Configurar para priorizar vozes online
            testUtterance.onstart = () => {
                console.log('Teste de voz iniciado - verificando vozes online');
            };
            
            testUtterance.onend = () => {
                console.log('Teste de voz concluído');
                // Forçar atualização da lista
                setTimeout(() => {
                    updateVoicesList();
                }, 500);
            };
            
            // Falar e cancelar rapidamente
            speechSynthesis.speak(testUtterance);
            setTimeout(() => {
                speechSynthesis.cancel();
                updateVoicesList();
            }, 100);
        }
        
        // 3. Mostrar instruções para habilitar manualmente
        showCloudVoicesInstructions();
        
        return true;
    } catch (error) {
        console.error('Erro ao habilitar vozes do Google:', error);
        showNotification('Não foi possível ativar vozes do servidor', true);
        return false;
    }
}

function updateVoicesList() {
    const allVoices = speechSynthesis.getVoices();
    console.log(`Total de vozes após atualização: ${allVoices.length}`);
    
    // Filtrar vozes NATURAIS/NEURAL
    const naturalVoices = allVoices.filter(voice => {
        // Vozes do Google Cloud geralmente têm estas características
        return voice.name.includes('Natural') ||
               voice.name.includes('Neural') ||
               voice.name.includes('Wavenet') ||
               voice.name.includes('Studio') ||
               voice.name.includes('Cloud') ||
               voice.name.toLowerCase().includes('premium') ||
               (voice.localService === false && voice.lang.includes('pt'));
    });
    
    if (naturalVoices.length > 0) {
        console.log('=== VOZES NATURAIS ENCONTRADAS ===');
        naturalVoices.forEach(voice => {
            console.log(`✨ ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Cloud'}`);
        });
        
        showNotification(`Encontradas ${naturalVoices.length} voz(es) naturais!`, false);
    }
    
    voices = allVoices;
    populateVoiceSelect();
}

function showCloudVoicesInstructions() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'cloudVoicesModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header" style="background: linear-gradient(135deg, #4285F4, #34A853);">
                <h3><i class="fas fa-cloud"></i> Ativar Vozes Naturais do Google</h3>
                <button onclick="closeCloudModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                    <div style="font-size: 40px; color: #4285F4;">✨</div>
                    <div>
                        <h4 style="margin: 0; color: #4285F4;">Vozes Naturais Premium</h4>
                        <p style="margin: 5px 0 0 0; color: #666;">Vozes de IA com som humano do Google Cloud</p>
                    </div>
                </div>
                
                <div style="background: #E8F0FE; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h5 style="margin: 0 0 10px 0; color: #4285F4;">
                        <i class="fas fa-exclamation-circle"></i> Para o Chrome Desktop:
                    </h5>
                    <ol style="margin: 0; padding-left: 20px;">
                        <li>Digite na barra de endereços: <code>chrome://flags/#enable-experimental-web-platform-features</code></li>
                        <li><strong>Ative</strong> a flag "Experimental Web Platform features"</li>
                        <li>Reinicie o Chrome</li>
                        <li>Acesse: <code>chrome://settings/accessibility</code></li>
                        <li><strong>Ative</strong> "Usar vozes de servidor (recomendado)"</li>
                        <li>Recarregue esta página</li>
                    </ol>
                </div>
                
                <div style="background: #FEF7E0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h5 style="margin: 0 0 10px 0; color: #F4B400;">
                        <i class="fas fa-mobile-alt"></i> Para Chrome no Android:
                    </h5>
                    <ol style="margin: 0; padding-left: 20px;">
                        <li>Acesse: <code>chrome://flags</code></li>
                        <li>Busque por: "Experimental Web Platform features"</li>
                        <li>Ative e reinicie</li>
                        <li>As vozes do Google TTS serão usadas automaticamente</li>
                    </ol>
                </div>
                
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px;">
                    <button onclick="copyToClipboard('chrome://flags/#enable-experimental-web-platform-features')" 
                            style="flex: 1; min-width: 200px; padding: 10px; background: #4285F4; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-copy"></i> Copiar URL das Flags
                    </button>
                    <button onclick="copyToClipboard('chrome://settings/accessibility')" 
                            style="flex: 1; min-width: 200px; padding: 10px; background: #34A853; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-copy"></i> Copiar URL Acessibilidade
                    </button>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #F3F4F6; border-radius: 8px;">
                    <h5 style="margin: 0 0 10px 0;"><i class="fas fa-info-circle"></i> Vozes Disponíveis após ativar:</h5>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li><strong>pt-BR-Wavenet-A</strong> - Feminina natural</li>
                        <li><strong>pt-BR-Wavenet-B</strong> - Masculina natural</li>
                        <li><strong>pt-BR-Wavenet-C</strong> - Feminina 2</li>
                        <li><strong>pt-BR-Standard-A</strong> - Feminina padrão</li>
                        <li><strong>pt-BR-Standard-B</strong> - Masculina padrão</li>
                    </ul>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="closeCloudModal()" class="btn-cancel">Fechar</button>
                <button onclick="testCloudVoices()" class="btn-test-voice" style="background: linear-gradient(135deg, #4285F4, #34A853);">
                    <i class="fas fa-play"></i> Testar com Vozes Atuais
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.style.display = 'flex', 10);
}

function closeCloudModal() {
    const modal = document.getElementById('cloudVoicesModal');
    if (modal) modal.remove();
}

function testCloudVoices() {
    const testText = "Esta é uma demonstração das vozes naturais do Google. O som é quase humano!";
    
    // Verificar se há vozes do Google disponíveis
    const googleVoices = voices.filter(v => 
        v.name.includes('Wavenet') || 
        v.name.includes('Natural') ||
        v.localService === false
    );
    
    if (googleVoices.length === 0) {
        showNotification('Nenhuma voz do Google encontrada. Ative nas configurações do Chrome.', true);
        return;
    }
    
    showNotification(`Testando ${googleVoices.length} voz(es) do Google...`);
    
    let index = 0;
    
    function speakNext() {
        if (index >= googleVoices.length) {
            showNotification('Teste das vozes do Google concluído!', false);
            return;
        }
        
        const voice = googleVoices[index];
        const utterance = new SpeechSynthesisUtterance(testText);
        utterance.voice = voice;
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        utterance.onstart = () => {
            console.log(`Iniciando: ${voice.name}`);
        };
        
        utterance.onend = () => {
            showNotification(`Voz ${index + 1}/${googleVoices.length}: ${voice.name}`, false);
            index++;
            setTimeout(speakNext, 1500);
        };
        
        utterance.onerror = () => {
            showNotification(`Erro na voz: ${voice.name}`, true);
            index++;
            setTimeout(speakNext, 1000);
        };
        
        speechSynthesis.speak(utterance);
    }
    
    speechSynthesis.cancel();
    setTimeout(speakNext, 300);
}

// Função auxiliar para copiar texto para a área de transferência
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Link copiado para a área de transferência!', false);
    }).catch(err => {
        console.error('Erro ao copiar texto:', err);
    });
}

// Funções para gerenciar a seleção de vozes
function populateVoiceSelect() {
    // Limpar select
    voiceSelect.innerHTML = '';
    
    // Filtrar APENAS vozes em português do Brasil
    const brazilianVoices = voices.filter(voice => {
        // Critérios para português do Brasil
        return voice.lang === 'pt-BR' || 
               voice.lang === 'pt_BR' || 
               voice.lang === 'Portuguese (Brazil)' ||
               voice.lang === 'pt-BR' ||
               voice.lang.toLowerCase().includes('brazil') ||
               voice.lang.toLowerCase().includes('brasil') ||
               voice.name.toLowerCase().includes('brazil') ||
               voice.name.toLowerCase().includes('brasil') ||
               (voice.lang.includes('pt') && voice.name.includes('Desktop')); // Vozes Microsoft
    });
    
    console.log(`Vozes brasileiras encontradas: ${brazilianVoices.length}`);
    brazilianVoices.forEach((v, i) => {
        console.log(`  ${i+1}. ${v.name} - ${v.lang}`);
    });
    
    if (brazilianVoices.length > 0) {
        // Ordenar: vozes femininas primeiro, depois masculinas
        brazilianVoices.sort((a, b) => {
            // Verificar se é voz feminina
            const aIsFemale = a.name.toLowerCase().includes('female') || 
                             a.name.toLowerCase().includes('feminina') ||
                             a.name.toLowerCase().includes('mulher') ||
                             a.name.toLowerCase().includes('helena') ||
                             a.name.toLowerCase().includes('maria') ||
                             a.name.toLowerCase().includes('heloisa');
            
            const bIsFemale = b.name.toLowerCase().includes('female') || 
                             b.name.toLowerCase().includes('feminina') ||
                             b.name.toLowerCase().includes('mulher') ||
                             b.name.toLowerCase().includes('helena') ||
                             b.name.toLowerCase().includes('maria') ||
                             b.name.toLowerCase().includes('heloisa');
            
            if (aIsFemale && !bIsFemale) return -1;
            if (!aIsFemale && bIsFemale) return 1;
            
            // Se ambas femininas ou ambas masculinas, ordenar por nome
            return a.name.localeCompare(b.name);
        });
        
        // Adicionar cada voz brasileira
        brazilianVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            
            // Personalizar exibição com emojis
            let displayName = voice.name;
            
            // Identificar gênero da voz
            if (voice.name.toLowerCase().includes('female') || 
                voice.name.toLowerCase().includes('feminina') ||
                voice.name.toLowerCase().includes('mulher') ||
                voice.name.toLowerCase().includes('helena') ||
                voice.name.toLowerCase().includes('maria')) {
                displayName = '👩 ' + displayName;
            } else if (voice.name.toLowerCase().includes('male') || 
                      voice.name.toLowerCase().includes('masculina') ||
                      voice.name.toLowerCase().includes('homem') ||
                      voice.name.toLowerCase().includes('daniel')) {
                displayName = '👨 ' + displayName;
            }
            
            // Marcar se é voz padrão
            if (voice.default) {
                displayName += ' ⭐';
            }
            
            // Remover "Desktop" ou "Microsoft" do nome para ficar mais limpo
            displayName = displayName
                .replace('Desktop', '')
                .replace('Microsoft', '')
                .replace('  ', ' ')
                .trim();
            
            option.textContent = displayName;
            voiceSelect.appendChild(option);
        });
        
        // Selecionar voz salva ou a primeira brasileira
        const savedVoice = localStorage.getItem('selectedVoice');
        if (savedVoice && brazilianVoices.some(v => v.name === savedVoice)) {
            voiceSelect.value = savedVoice;
        } else if (brazilianVoices.length > 0) {
            // Tentar encontrar a voz padrão do sistema
            const defaultBrazilian = brazilianVoices.find(v => v.default) || brazilianVoices[0];
            voiceSelect.value = defaultBrazilian.name;
            localStorage.setItem('selectedVoice', defaultBrazilian.name);
        }
        
    } else {
        // Se não encontrar vozes brasileiras, mostrar mensagem
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Nenhuma voz brasileira encontrada';
        option.disabled = true;
        voiceSelect.appendChild(option);
        
        // Adicionar opção alternativa
        const alternativeOption = document.createElement('option');
        alternativeOption.value = 'show_all';
        alternativeOption.textContent = 'Mostrar todas as vozes disponíveis';
        voiceSelect.appendChild(alternativeOption);
        
        // Event listener para mostrar todas
        voiceSelect.addEventListener('change', function(e) {
            if (e.target.value === 'show_all') {
                showAllVoices();
                voiceSelect.value = '';
            }
        });
    }
}

function addDebugOption() {
    const option = document.createElement('option');
    option.value = 'debug_voices';
    option.textContent = '🔍 Ver detalhes das vozes...';
    option.style.color = '#FF9800';
    option.style.fontWeight = 'bold';
    voiceSelect.appendChild(option);
    
    voiceSelect.addEventListener('change', function(e) {
        if (e.target.value === 'debug_voices') {
            showVoiceDebugInfo();
            // Resetar para a voz anterior
            const savedVoice = localStorage.getItem('selectedVoice');
            if (savedVoice && voices.some(v => v.name === savedVoice)) {
                voiceSelect.value = savedVoice;
            }
        }
    });
}

function showVoiceDebugInfo() {
    let debugInfo = `=== DETALHES DAS VOZES ===\n`;
    debugInfo += `Total: ${voices.length}\n\n`;
    
    voices.forEach((voice, index) => {
        debugInfo += `${index + 1}. ${voice.name}\n`;
        debugInfo += `   Idioma: ${voice.lang}\n`;
        debugInfo += `   Local: ${voice.localService ? 'Sistema' : 'Online'}\n`;
        debugInfo += `   Padrão: ${voice.default ? 'SIM' : 'Não'}\n`;
        debugInfo += `   URI: ${voice.voiceURI}\n`;
        debugInfo += `---\n`;
    });
    
    console.log(debugInfo);
    
    // Mostrar também em notificação
    const portugueseCount = voices.filter(v => 
        v.lang.includes('pt') || v.lang.includes('PT') || v.lang.includes('br') || v.lang.includes('BR')
    ).length;
    
    showNotification(
        `Encontradas ${voices.length} vozes no total (${portugueseCount} em PT). ` +
        `Ver console para detalhes.`,
        false
    );
    
    // Copiar para área de transferência
    try {
        navigator.clipboard.writeText(debugInfo);
        console.log('Informações copiadas para área de transferência');
    } catch (e) {
        console.log('Não foi possível copiar para área de transferência');
    }
}

// Carrega as vozes disponíveis para síntese de voz
function loadVoices() {
    // Primeira tentativa
    voices = window.speechSynthesis.getVoices();
    
    // Se tiver poucas vozes, forçar nova busca
    if (voices.length <= 1) {
        console.log('Poucas vozes detectadas. Forçando atualização...');
        
        // Tentativa 1: Usar método alternativo
        try {
            // Criar utterance vazio para "ativar" as vozes
            const tempUtterance = new SpeechSynthesisUtterance('');
            window.speechSynthesis.speak(tempUtterance);
            window.speechSynthesis.cancel();
        } catch (e) {
            console.log('Método 1 falhou:', e);
        }
        
        // Tentativa 2: Aguardar e tentar novamente
        setTimeout(() => {
            voices = window.speechSynthesis.getVoices();
            console.log('Vozes após timeout:', voices.length);
            
            // Se ainda tiver poucas, tentar mais uma vez
            if (voices.length <= 2) {
                setTimeout(() => {
                    voices = window.speechSynthesis.getVoices();
                    populateVoiceSelect();
                }, 1000);
            } else {
                populateVoiceSelect();
            }
        }, 300);
        
        return;
    }

    // Filtrar vozes em português com qualidade
    const portugueseVoices = voices.filter(voice => {
        // Aceitar português do Brasil ou Portugal
        const isPortuguese = voice.lang.includes('pt') || voice.lang.includes('PT');

        // Priorizar vozes com nomes que indicam qualidade
        const qualityIndicators = ['Natural', 'Premium', 'Enhanced', 'Neural', 'WaveNet'];
        const hasQuality = qualityIndicators.some(indicator =>
            voice.name.includes(indicator)
        );

        return isPortuguese && (hasQuality || voice.default);
    });

    voiceSelect.innerHTML = '';

    if (portugueseVoices.length > 0) {
        // Ordenar por qualidade (vozes com indicadores primeiro)
        portugueseVoices.sort((a, b) => {
            const aQuality = a.name.includes('Natural') || a.name.includes('Premium') ? 1 : 0;
            const bQuality = b.name.includes('Natural') || b.name.includes('Premium') ? 1 : 0;
            return bQuality - aQuality;
        });

        portugueseVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;

            // Adicionar emojis para vozes de qualidade
            let displayName = voice.name;
            if (voice.name.includes('Natural') || voice.name.includes('Neural')) {
                displayName = '🎤 ' + displayName;
            } else if (voice.name.includes('Premium')) {
                displayName = '⭐ ' + displayName;
            } else if (voice.default) {
                displayName = '🔊 ' + displayName;
            }

            option.textContent = `${displayName} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });

        // Tentar selecionar a melhor voz disponível
        const savedVoice = localStorage.getItem('selectedVoice');
        if (savedVoice && portugueseVoices.some(v => v.name === savedVoice)) {
            voiceSelect.value = savedVoice;
        } else {
            // Selecionar a primeira voz natural, ou a default, ou a primeira disponível
            const naturalVoice = portugueseVoices.find(v =>
                v.name.includes('Natural') || v.name.includes('Neural')
            );
            const defaultVoice = portugueseVoices.find(v => v.default);

            if (naturalVoice) {
                voiceSelect.value = naturalVoice.name;
            } else if (defaultVoice) {
                voiceSelect.value = defaultVoice.name;
            } else if (portugueseVoices.length > 0) {
                voiceSelect.value = portugueseVoices[0].name;
            }
        }

        // Salvar a voz selecionada
        localStorage.setItem('selectedVoice', voiceSelect.value);
    } else {
        // Fallback para qualquer voz disponível
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });

        if (voices.length > 0) {
            voiceSelect.value = voices[0].name;
            localStorage.setItem('selectedVoice', voices[0].name);
        } else {
            const option = document.createElement('option');
            option.textContent = 'Nenhuma voz disponível';
            voiceSelect.appendChild(option);
        }
    }

    // Carregar as vozes filtradas
    naturalVoices = portugueseVoices.length > 0 ? portugueseVoices : voices;

    console.log(`Vozes carregadas: ${voices.length} total, ${naturalVoices.length} em português`);
}

function speakLastMessage() {
    if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        speakBtn.classList.remove('speaking');
        speakBtn.title = 'Ouvir resposta';
        return;
    }

    const lastMessage = messagesContainer.lastElementChild;
    if (lastMessage && !lastMessage.classList.contains("user")) {
        const textToSpeak = lastMessage.querySelector(".content")?.textContent;
        if (!textToSpeak || textToSpeak.trim().length === 0) {
            showNotification('Nenhum texto para ler', true);
            return;
        }

        // Preparar texto para síntese
        const cleanText = textToSpeak
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remover markdown bold
            .replace(/\*(.*?)\*/g, '$1') // Remover markdown italic
            .replace(/`(.*?)`/g, '$1') // Remover código inline
            .replace(/#{1,6}\s?/g, '') // Remover headers
            .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remover links

        currentUtterance = new SpeechSynthesisUtterance(cleanText);
        currentUtterance.lang = 'pt-BR';
        currentUtterance.rate = 1.0; // Velocidade normal
        currentUtterance.pitch = 1.0; // Tom normal
        currentUtterance.volume = 1.0; // Volume máximo

        // Configurar a voz selecionada
        const selectedVoiceName = localStorage.getItem('selectedVoice');
        let selectedVoice = null;

        if (selectedVoiceName) {
            selectedVoice = voices.find(v => v.name === selectedVoiceName);
        }

        // Fallback para voz padrão se não encontrar a selecionada
        if (!selectedVoice && naturalVoices.length > 0) {
            selectedVoice = naturalVoices.find(v => v.default) || naturalVoices[0];
        }

        if (selectedVoice) {
            currentUtterance.voice = selectedVoice;
            console.log(`Usando voz: ${selectedVoice.name}`);
        }

        // Eventos para controle de estado
        currentUtterance.onstart = function () {
            isSpeaking = true;
            speakBtn.classList.add('speaking');
            speakBtn.title = 'Parar leitura';
            speakBtn.innerHTML = '<i class="fas fa-stop"></i>';
        };

        currentUtterance.onend = function () {
            isSpeaking = false;
            speakBtn.classList.remove('speaking');
            speakBtn.title = 'Ouvir resposta';
            speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            currentUtterance = null;
        };

        currentUtterance.onerror = function (event) {
            console.error('Erro na síntese de voz:', event.error);
            isSpeaking = false;
            speakBtn.classList.remove('speaking');
            speakBtn.title = 'Ouvir resposta';
            speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            currentUtterance = null;

            // Mostrar mensagem amigável
            if (event.error === 'interrupted') {
                showNotification('Leitura interrompida', false);
            } else {
                showNotification('Erro na leitura de voz. Verifique as configurações.', true);
            }
        };

        // Cancelar qualquer fala em andamento
        window.speechSynthesis.cancel();

        // Adicionar pequeno delay para garantir que o cancelamento foi processado
        setTimeout(() => {
            try {
                window.speechSynthesis.speak(currentUtterance);
                trackEvent('text_to_speech_started', {
                    voice: selectedVoice ? selectedVoice.name : 'default',
                    textLength: cleanText.length
                });
            } catch (error) {
                console.error('Erro ao iniciar síntese de voz:', error);
                showNotification('Não foi possível iniciar a leitura', true);
            }
        }, 100);
    }
}

// Funções de clima
async function getWeather() {
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });

        const { latitude, longitude } = position.coords;
        try {
            const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
                params: {
                    latitude: latitude,
                    longitude: longitude,
                    current: 'temperature_2m,weathercode',
                    hourly: 'temperature_2m,relative_humidity_2m',
                    timezone: 'auto'
                }
            });

            const { current } = response.data;
            weatherTemp.innerText = `${Math.round(current.temperature_2m)}°C`;
            weatherCity.innerText = 'Localização Atual';
            weatherDesc.innerText = getWeatherDescription(current.weathercode);
            setWeatherIcon(current.weathercode);

        } catch (error) {
            console.error('Erro ao obter dados do clima:', error);
            weatherCity.innerText = 'Erro ao carregar';
            getWeatherByIP();
        }
    } catch (error) {
        console.error('Erro de geolocalização:', error.message);
        weatherCity.innerText = 'Localização não disponível';
        getWeatherByIP();
    }
}

async function getWeatherByIP() {
    try {
        const ipResponse = await axios.get('https://ipapi.co/json/');
        const { city, latitude, longitude } = ipResponse.data;

        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: latitude,
                longitude: longitude,
                current: 'temperature_2m,weathercode',
                hourly: 'temperature_2m,relative_humidity_2m',
                timezone: 'auto'
            }
        });

        const { current } = response.data;
        weatherTemp.innerText = `${Math.round(current.temperature_2m)}°C`;
        weatherCity.innerText = city || 'Localização Aproximada';
        weatherDesc.innerText = getWeatherDescription(current.weathercode);
        setWeatherIcon(current.weathercode);

    } catch (error) {
        console.error('Erro ao obter dados do clima por IP:', error);
        weatherCity.innerText = 'Não disponível';
    }
}

function getWeatherDescription(weathercode) {
    const descriptions = {
        0: 'Céu limpo',
        1: 'Parcialmente nublado',
        2: 'Parcialmente nublado',
        3: 'Nublado',
        45: 'Neblina',
        48: 'Nevoeiro',
        51: 'Chuvisco leve',
        53: 'Chuvisco moderado',
        55: 'Chuvisco intenso',
        61: 'Chuva leve',
        63: 'Chuva moderada',
        65: 'Chuva forte',
        71: 'Neve leve',
        73: 'Neve moderada',
        75: 'Neve forte',
        80: 'Pancadas de chuva leve',
        81: 'Pancadas de chuva moderada',
        82: 'Pancadas de chuva forte',
        95: 'Tempestade',
        96: 'Tempestade com granizo leve',
        99: 'Tempestade com granizo forte'
    };
    return descriptions[weathercode] || 'Condição desconhecida';
}

function setWeatherIcon(weathercode) {
    const iconClasses = {
        0: 'fas fa-sun',
        1: 'fas fa-cloud-sun',
        2: 'fas fa-cloud-sun',
        3: 'fas fa-cloud',
        45: 'fas fa-smog',
        48: 'fas fa-smog',
        51: 'fas fa-cloud-rain',
        53: 'fas fa-cloud-rain',
        55: 'fas fa-cloud-rain',
        61: 'fas fa-cloud-showers-heavy',
        63: 'fas fa-cloud-showers-heavy',
        65: 'fas fa-cloud-showers-heavy',
        80: 'fas fa-cloud-showers-heavy',
        81: 'fas fa-cloud-showers-heavy',
        82: 'fas fa-cloud-showers-heavy',
        71: 'fas fa-snowflake',
        73: 'fas fa-snowflake',
        75: 'fas fa-snowflake',
        95: 'fas fa-bolt',
        96: 'fas fa-bolt',
        99: 'fas fa-bolt'
    };

    const iconClass = iconClasses[weathercode] || 'fas fa-cloud-sun';
    weatherIcon.innerHTML = `<i class="${iconClass}"></i>`;
}

// Funções de tema
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);

    const icon = toggleModeBtn.querySelector('i');
    if (currentTheme === 'dark') {
        icon.className = 'fas fa-sun';
        toggleModeBtn.title = 'Modo Claro';
    } else {
        icon.className = 'fas fa-moon';
        toggleModeBtn.title = 'Modo Escuro';
    }
}

function applyTheme(theme) {
    document.body.className = '';
    if (theme !== 'light') {
        document.body.classList.add(`${theme}-theme`);
    }
    if (themeSelect) {
        themeSelect.value = theme;
    }
}

// Funções de notificação
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 4000);
}

// Funções de compartilhamento
function shareConversation() {
    const conversationId = localStorage.getItem("currentConversationId");
    if (!conversationId) {
        showNotification("Nenhuma conversa para compartilhar!", true);
        return;
    }

    const savedConversations = JSON.parse(localStorage.getItem("rubyIAConversations") || "[]");
    const conversation = savedConversations.find(conv => conv.id === parseInt(conversationId));

    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
        showNotification("Nenhuma conversa para compartilhar!", true);
        return;
    }

    let shareText = `Conversa com Ruby IA (${conversation.name || 'Nova Conversa'})\n\n`;
    conversation.messages.forEach(msg => {
        shareText += `${msg.isUser ? 'Você' : 'Ruby IA'}: ${msg.isUser && msg.content.startsWith("data:image") ? "[Imagem]" : msg.content}\n\n`;
    });

    if (navigator.share) {
        navigator.share({
            title: `Minha conversa com Ruby IA - ${conversation.name}`,
            text: shareText,
        }).catch(err => {
            console.error('Erro ao compartilhar conversa:', err);
        });
    } else {
        console.error('Compartilhamento não suportado neste navegador');
    }
}

// Manipulação de imagens
async function handleImageUpload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    // Limpar seleção anterior se for um novo upload
    if (event.target === imageUpload) {
        currentImages = [];
    }

    // Seleção acumulativa
    const room = Math.max(0, 5 - currentImages.length);
    const selected = files.slice(0, room);

    // Validações
    const validations = selected.every(f => {
        const isImage = f.type.match('image.*');
        const sizeValid = f.size <= 8 * 1024 * 1024; // 8MB

        if (!isImage) {
            showNotification('Apenas arquivos de imagem são permitidos.', true);
            return false;
        }

        if (!sizeValid) {
            showNotification('Cada imagem deve ter no máximo 8MB.', true);
            return false;
        }

        return true;
    });

    if (!validations) {
        event.target.value = ''; // Limpar o input
        return;
    }

    // Mostrar notificação de compressão
    if (selected.length > 0) {
        showNotification(`Comprimindo ${selected.length} imagem(ns)...`);
    }

    // Comprimir imagens com otimização
    const compressionPromises = selected.map(async (file) => {
        try {
            const compressionResult = await compressImage(file);

            // Log de estatísticas de compressão
            const savedBytes = file.size - compressionResult.compressedSize;
            const savedPercent = ((savedBytes / file.size) * 100).toFixed(1);

            console.log(`[Compressão] ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(compressionResult.compressedSize / 1024).toFixed(1)}KB (${savedPercent}% salvo)`);

            return {
                ...compressionResult,
                fileName: file.name,
                originalSize: file.size,
                savedPercent
            };
        } catch (error) {
            console.error('Erro ao comprimir imagem:', error);
            throw new Error(`Erro ao comprimir ${file.name}`);
        }
    });

    try {
        const results = await Promise.all(compressionPromises);

        // Calcular estatísticas totais
        const totalStats = results.reduce((acc, result) => {
            acc.original += result.originalSize;
            acc.compressed += result.compressedSize;
            return acc;
        }, { original: 0, compressed: 0 });

        const totalSaved = ((totalStats.original - totalStats.compressed) / 1024).toFixed(1);
        const totalPercent = ((totalSaved / (totalStats.original / 1024)) * 100).toFixed(1);

        console.log(`[Compressão Total] ${(totalStats.original / 1024).toFixed(1)}KB → ${(totalStats.compressed / 1024).toFixed(1)}KB (${totalPercent}% salvo)`);

        // Adicionar apenas URLs das imagens ao array
        const newImages = results.map(r => r.dataUrl);
        currentImages = [...currentImages, ...newImages].slice(0, 5);

        // Atualizar previews
        renderPreviews();

        // Mostrar preview
        imagePreviewContainer.style.display = 'block';
        imagePreviewContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Mostrar estatísticas de compressão
        showCompressionStats(results);

        const more = files.length > selected.length ? ' (algumas foram ignoradas pelo limite de 5)' : '';
        showNotification(`${newImages.length} imagem(ns) pronta(s) para envio!${more} Clique em Enviar para publicar.`);

        // Reset input
        imageUpload.value = '';

        trackEvent('images_compressed', {
            count: results.length,
            totalSavedKB: totalSaved,
            avgCompression: totalPercent
        });

    } catch (error) {
        console.error('Erro no processamento de imagens:', error);
        showNotification('Erro ao processar as imagens. Tente novamente.', true);
    }
}

// Mostrar estatísticas de compressão de imagens
function showCompressionStats(results) {
    if (!results || results.length === 0) return;

    const totalStats = results.reduce((acc, result) => {
        acc.original += result.originalSize;
        acc.compressed += result.compressedSize;
        return acc;
    }, { original: 0, compressed: 0 });

    const savedKB = ((totalStats.original - totalStats.compressed) / 1024).toFixed(1);
    const percent = ((savedKB / (totalStats.original / 1024)) * 100).toFixed(1);

    // Remover tooltips existentes
    document.querySelectorAll('.compression-stats').forEach(el => el.remove());

    // Criar tooltip
    const statsTooltip = document.createElement('div');
    statsTooltip.className = 'compression-stats';
    statsTooltip.innerHTML = `
        <div style="padding: 8px; color: #fff; font-size: 12px; line-height: 1.4;">
            <strong style="color: #4CAF50;">✓ Otimização Aplicada</strong><br>
            • ${results.length} imagem(ns) processada(s)<br>
            • Economia: ${savedKB} KB (${percent}%)<br>
            • Formato: ${results[0].mimeType === 'image/webp' ? 'WebP' : 'JPEG'}
        </div>
    `;

    // Estilos do tooltip
    Object.assign(statsTooltip.style, {
        position: 'fixed',
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '0',
        borderRadius: '8px',
        zIndex: '10000',
        maxWidth: '250px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        transform: 'translateY(10px)',
        opacity: '0',
        transition: 'all 0.3s ease-out',
        pointerEvents: 'none'
    });

    document.body.appendChild(statsTooltip);

    // Posicionar próximo ao botão de upload
    const uploadBtnRect = uploadBtn.getBoundingClientRect();
    const tooltipRect = statsTooltip.getBoundingClientRect();

    let top = uploadBtnRect.top - tooltipRect.height - 10;
    let left = uploadBtnRect.left;

    // Ajustar para não sair da tela
    if (top < 0) top = uploadBtnRect.bottom + 10;
    if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width - 10;
    }

    Object.assign(statsTooltip.style, {
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translateY(0)',
        opacity: '1'
    });

    // Remover após 3 segundos com animação
    setTimeout(() => {
        statsTooltip.style.opacity = '0';
        statsTooltip.style.transform = 'translateY(-10px)';

        // Remover do DOM após a animação
        setTimeout(() => {
            if (statsTooltip.parentNode) {
                statsTooltip.parentNode.removeChild(statsTooltip);
            }
        }, 300);
    }, 3000);
}

// Lazy loading para imagens
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadImage(img);
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px', // Começar a carregar 50px antes de entrar na viewport
        threshold: 0.1
    });

    lazyImages.forEach(img => imageObserver.observe(img));
}

function loadImage(img) {
    if (!img || !img.getAttribute('data-src')) return;

    const src = img.getAttribute('data-src');
    const tempImg = new Image();

    tempImg.onload = () => {
        if (img) { // Verificar se o elemento ainda existe
            img.src = src;
            img.style.opacity = '1';
            img.classList.remove('img-skeleton');
        }
    };

    tempImg.onerror = () => {
        console.error('Erro ao carregar imagem:', src);
        if (img) { // Verificar se o elemento ainda existe
            img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2NjYyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMSAxNlY0YTIgMiAwIDAgMC0yLTJINWEyIDIgMCAwIDAtMiAydjE2YTIgMiAwIDAgMCAyIDJoMTQiPjwvcGF0aD48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSI+PC9jaXJjbGU+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSI+PC9wb2x5bGluZT48L3N2Zz4=';
            img.style.opacity = '1';
            img.classList.remove('img-skeleton');
        }
    };

    tempImg.src = src;
}

function removeImage() {
    currentImages = [];
    imageUpload.value = '';
    imagePreviewContainer.style.display = 'none';
}

// Renderiza miniaturas para todas as imagens selecionadas
function renderPreviews() {
    if (!currentImages || currentImages.length === 0) {
        imagePreviewContainer.style.display = 'none';
        return;
    }

    // Limpar previews anteriores
    const existingPreviews = imagePreviewContainer.querySelectorAll('.extra-preview');
    existingPreviews.forEach(el => el.remove());

    // Configurar preview principal
    if (currentImages[0]) {
        imagePreview.setAttribute('data-src', currentImages[0]);
        imagePreview.setAttribute('loading', 'lazy');
        imagePreview.classList.add('img-skeleton');

        // Carregar preview principal imediatamente
        loadImage(imagePreview);
    }

    // Criar miniaturas lazy para as demais
    currentImages.slice(1).forEach((src, index) => {
        const img = document.createElement('img');
        img.setAttribute('data-src', src);
        img.setAttribute('loading', 'lazy');
        img.alt = `Imagem ${index + 2}`;
        img.className = 'extra-preview img-skeleton';
        img.style.maxWidth = '80px';
        img.style.maxHeight = '60px';
        img.style.borderRadius = '6px';
        img.style.margin = '6px';
        img.style.objectFit = 'cover';
        img.style.opacity = '0';

        // Inserir antes do botão de remover
        imagePreviewContainer.insertBefore(img, removeImageBtn);

        // Observar para lazy loading
        setTimeout(() => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        loadImage(img);
                        observer.unobserve(img);
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(img);
        }, 100);
    });

    imagePreviewContainer.style.display = 'block';
}

function addImageMessage(imageData) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", "user");

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("content");

    const imgContainer = document.createElement("div");
    imgContainer.className = "image-container";
    imgContainer.style.position = "relative";

    const img = document.createElement("img");
    img.setAttribute('data-src', imageData);
    img.setAttribute('loading', 'lazy');
    img.alt = "Imagem enviada pelo usuário";
    img.style.maxWidth = "100%";
    img.style.maxHeight = "300px";
    img.style.borderRadius = "8px";
    img.style.marginTop = "5px";
    img.style.opacity = "0";
    img.style.transition = "opacity 0.3s ease-in";

    // Adicionar skeleton loading
    img.classList.add('img-skeleton');

    imgContainer.appendChild(img);
    contentDiv.appendChild(imgContainer);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    // Iniciar carregamento
    setTimeout(() => loadImage(img), 100);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return messageDiv;
}

// Funções de mensagens
function addMessage(content, isUser) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", isUser ? "user" : "ai");

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("content");

    // Para mensagens da IA, formata o texto
    if (!isUser) {
        contentDiv.textContent = formatAIText(content);
        contentDiv.style.whiteSpace = 'pre-line';
        contentDiv.style.lineHeight = '1.5';
    } else {
        contentDiv.textContent = content;
    }

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    if (isUser) {
        suggestionsContainer.style.display = 'none';
    }
}

function showWelcomeMessage() {
    const welcomeDiv = document.createElement("div");
    welcomeDiv.classList.add("welcome-message");

    welcomeDiv.innerHTML = `
        <h2>Bem-vindo ao Ruby IA!</h2>
        <p>Eu sou sua assistente de inteligência artificial. Como posso te ajudar hoje?</p>
        <p>Você pode digitar uma mensagem, enviar uma imagem ou usar uma das sugestões abaixo.</p>
    `;

    messagesContainer.appendChild(welcomeDiv);
    suggestionsContainer.style.display = 'flex';
}

function showTypingIndicator() {
    typingIndicator.classList.add('show');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    typingIndicator.classList.remove('show');
}

// Função principal para enviar mensagens
async function sendMessage() {
    const messageText = userMessageInput.value.trim();

    if ((!messageText || messageText === '') && currentImages.length === 0) {
        showNotification('Digite uma mensagem ou selecione uma imagem', true);
        return;
    }

    // Fazer uma cópia das imagens atuais antes de limpar
    const imagesToSend = [...currentImages];

    // Adicionar mensagem do usuário
    if (messageText || imagesToSend.length > 0) {
        addMessage(messageText, true);

        // Adicionar imagens à mensagem
        if (imagesToSend.length > 0) {
            imagesToSend.forEach(imgData => {
                addImageMessage(imgData);
            });

            // Limpar imagens após enviar para a API
            currentImages = [];
            imagePreviewContainer.style.display = 'none';
            imageUpload.value = '';
        }
    }

    userMessageInput.value = "";

    // Salvar dados da mensagem para possível envio offline
    const messageData = {
        text: messageText || "(Consulta com imagem)",
        images: imagesToSend,
        timestamp: Date.now()
    };

    // Verificar se está online
    if (!isOnline) {
        showNotification('Você está offline. A mensagem será enviada quando a conexão for restaurada.', true);
        pendingMessages.push(messageData);
        localStorage.setItem('pendingMessages', JSON.stringify(pendingMessages));
        removeImage();
        return;
    }

    showTypingIndicator();

    try {
        // Usar a função separada para enviar à API
        const aiResponse = await sendMessageToAPI(messageData.text, messageData.images);

        hideTypingIndicator();
        addMessage(aiResponse, false);
        saveConversation(messageData.text, aiResponse);
        removeImage();
    } catch (error) {
        console.error('Erro ao obter resposta da IA:', error);
        hideTypingIndicator();

        // Se falhar por problemas de conexão, salvar como pendente
        if (!navigator.onLine || error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
            showNotification('Erro de conexão. Mensagem salva para envio posterior.', true);
            pendingMessages.push(messageData);
            localStorage.setItem('pendingMessages', JSON.stringify(pendingMessages));
        } else {
            let errorMessage = "Desculpe, não consegui responder. Tente novamente.";
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error.message || errorMessage;
            }
            addMessage(errorMessage, false);
        }
    }
}

// Gerenciamento de conversas
function saveConversation(userMessage, aiResponse) {
    const conversationId = localStorage.getItem("currentConversationId") || Date.now().toString();
    let savedConversations = JSON.parse(localStorage.getItem("rubyIAConversations") || "[]");

    let conversation = savedConversations.find(conv => conv.id === parseInt(conversationId));
    if (!conversation) {
        conversation = {
            id: parseInt(conversationId),
            name: localStorage.getItem("currentConversationName") || "Nova Conversa",
            date: new Date().toLocaleString(),
            lastUpdated: new Date().toISOString(),
            messages: []
        };
        savedConversations.push(conversation);
    }

    conversation.messages.push({ content: userMessage, isUser: true });
    conversation.messages.push({ content: aiResponse, isUser: false });
    conversation.lastUpdated = new Date().toISOString();

    localStorage.setItem("rubyIAConversations", JSON.stringify(savedConversations));
    localStorage.setItem("currentConversationId", conversationId);
    displaySavedConversations();
}

function displaySavedConversations() {
    // Garantir que o container está visível
    savedConversationsContainer.style.display = 'block';

    const savedConversations = JSON.parse(localStorage.getItem("rubyIAConversations") || "[]");
    const currentId = localStorage.getItem("currentConversationId");

    // Limpar container e adicionar título
    savedConversationsContainer.innerHTML = '<h4>Minhas Conversas</h4>';

    // Adicionar busca e ordenação
    const controlsContainer = document.createElement("div");
    controlsContainer.className = "conversation-controls";

    // Campo de busca
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Buscar conversas...";
    searchInput.className = "conversation-search";

    // Dropdown de ordenação
    const sortSelect = document.createElement("select");
    sortSelect.className = "conversation-sort";
    sortSelect.innerHTML = `
        <option value="newest">Mais recentes</option>
        <option value="oldest">Mais antigas</option>
        <option value="name">Por nome</option>
    `;

    // Recuperar último filtro e ordenação usados
    const lastSearch = localStorage.getItem("conversationSearch") || "";
    const lastSort = localStorage.getItem("conversationSort") || "newest";
    searchInput.value = lastSearch;
    sortSelect.value = lastSort;

    controlsContainer.appendChild(searchInput);
    controlsContainer.appendChild(sortSelect);
    savedConversationsContainer.appendChild(controlsContainer);

    // Função para filtrar e ordenar conversas
    const filterAndSortConversations = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const sortBy = sortSelect.value;

        // Salvar filtros no localStorage
        localStorage.setItem("conversationSearch", searchTerm);
        localStorage.setItem("conversationSort", sortBy);

        // Filtrar conversas
        let filteredConversations = savedConversations.filter(conversation => {
            const name = (conversation.name || 'Nova Conversa').toLowerCase();
            const preview = conversation.messages.length > 0
                ? conversation.messages[0].content.toLowerCase().substring(0, 50)
                : '';
            return name.includes(searchTerm) || preview.includes(searchTerm);
        });

        // Ordenar conversas
        switch (sortBy) {
            case "oldest":
                filteredConversations.sort((a, b) => a.id - b.id);
                break;
            case "name":
                filteredConversations.sort((a, b) => {
                    const nameA = (a.name || 'Nova Conversa').toLowerCase();
                    const nameB = (b.name || 'Nova Conversa').toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                break;
            case "newest":
            default:
                filteredConversations.sort((a, b) => b.id - a.id);
                break;
        }

        // Limpar conversas anteriores (mantendo controles)
        const existingConversations = savedConversationsContainer.querySelectorAll(".conversation-item");
        existingConversations.forEach(item => item.remove());

        if (filteredConversations.length === 0) {
            const noResults = document.createElement("p");
            noResults.textContent = searchTerm
                ? "Nenhuma conversa encontrada para esta busca."
                : "Nenhuma conversa salva.";
            noResults.className = "no-conversations-message";
            savedConversationsContainer.appendChild(noResults);
            return;
        }

        // Renderizar conversas filtradas e ordenadas
        filteredConversations.forEach(conversation => {
            const conversationDiv = document.createElement("div");
            conversationDiv.className = "conversation-item";

            if (currentId && conversation.id === parseInt(currentId)) {
                conversationDiv.classList.add('active-conversation');
            }

            conversationDiv.innerHTML = `
                <div class="conversation-details">
                    <span class="conversation-name">${conversation.name || 'Nova Conversa'}</span>
                    <span class="conversation-date">${new Date(conversation.id).toLocaleString('pt-BR')}</span>
                    <p class="conversation-preview">${conversation.messages.length > 0 ? conversation.messages[0].content.substring(0, 30) + '...' : '<i>Conversa vazia</i>'}</p>
                </div>
                <button class="delete-conversation-btn" title="Excluir conversa"><i class="fas fa-trash-alt"></i></button>
            `;

            conversationDiv.addEventListener("click", () => {
                loadConversation(conversation.id);
            });

            const deleteBtn = conversationDiv.querySelector(".delete-conversation-btn");
            deleteBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                showConfirmModal(
                    'Excluir Conversa',
                    `Tem certeza de que deseja excluir "${conversation.name || 'Nova Conversa'}"? Esta ação não pode ser desfeita.`,
                    () => {
                        let allConversations = JSON.parse(localStorage.getItem("rubyIAConversations") || "[]");
                        allConversations = allConversations.filter(c => c.id !== conversation.id);
                        localStorage.setItem("rubyIAConversations", JSON.stringify(allConversations));

                        if (currentId && parseInt(currentId) === conversation.id) {
                            restartConversation();
                        } else {
                            displaySavedConversations();
                        }
                    }
                );
            });

            savedConversationsContainer.appendChild(conversationDiv);
        });
    };

    // Adicionar event listeners
    searchInput.addEventListener("input", filterAndSortConversations);
    sortSelect.addEventListener("change", filterAndSortConversations);

    // Executar filtro inicial
    filterAndSortConversations();
}

function loadConversation(conversationId) {
    const savedConversations = JSON.parse(localStorage.getItem("rubyIAConversations") || "[]");
    const conversation = savedConversations.find(conv => conv.id === conversationId);

    if (!conversation) return;

    messagesContainer.innerHTML = "";
    if (conversation.messages && Array.isArray(conversation.messages)) {
        conversation.messages.forEach(msg => {
            if (msg.isUser && msg.content.startsWith("data:image")) {
                addImageMessage(msg.content);
            } else {
                addMessage(msg.content, msg.isUser);
            }
        });
    }

    localStorage.setItem("currentConversationId", conversationId.toString());
    localStorage.setItem("currentConversationName", conversation.name || "Nova Conversa");
    sidebar.classList.remove("open");
    suggestionsContainer.style.display = 'none';
}

function restartConversation() {
    showConfirmModal(
        "Reiniciar Conversa",
        "Tem certeza que deseja reiniciar a conversa? Isso irá limpar a conversa atual sem excluir as conversas salvas.",
        () => {
            // Limpar mensagens
            messagesContainer.innerHTML = "";

            // Limpar imagens atuais
            currentImages = [];
            imagePreviewContainer.style.display = 'none';
            imageUpload.value = '';

            // Limpar input de mensagem
            userMessageInput.value = "";

            // Criar novo ID de conversa
            const newConversationId = Date.now().toString();
            localStorage.setItem('currentConversationId', newConversationId);

            // Resetar histórico de mensagens
            if (window.conversationHistory) {
                window.conversationHistory = [];
            }

            // Mostrar mensagem de boas-vindas
            showWelcomeMessage();

            // Mostrar notificação
            showNotification('Conversa reiniciada com sucesso!');

            // Focar no input de mensagem
            userMessageInput.focus();
        }
    );
}

// Funções de voz
function handleMicrophone() {
    if (!recognition) {
        showNotification('Reconhecimento de voz não está disponível.', true);
        return;
    }

    if (isListening) {
        try {
            recognition.stop();
            micBtn.classList.remove('recording');
            isListening = false;

            if (userMessageInput.value.trim()) {
                sendMessage();
            }
        } catch (e) {
            console.error('Erro ao parar o reconhecimento de voz:', e);
        }
    } else {
        try {
            recognition.start();
            micBtn.classList.add('recording');
            isListening = true;
            userMessageInput.value = '';
        } catch (e) {
            console.error('Erro ao iniciar o reconhecimento de voz:', e);
            micBtn.classList.remove('recording');
            isListening = false;
        }
    }
}

// Função para obter localização
async function getLocation() {
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });

        const { latitude, longitude } = position.coords;
        try {
            const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
                params: {
                    latitude: latitude,
                    longitude: longitude,
                    current: 'temperature_2m,weathercode',
                    hourly: 'temperature_2m,relative_humidity_2m',
                    timezone: 'auto'
                }
            });

            const { current } = response.data;
            weatherTemp.innerText = `${Math.round(current.temperature_2m)}°C`;
            weatherCity.innerText = 'Localização Atual';
            weatherDesc.innerText = getWeatherDescription(current.weathercode);
            setWeatherIcon(current.weathercode);
            
        } catch (error) {
            console.error('Erro ao obter dados do clima:', error);
            weatherCity.innerText = 'Erro ao carregar';
            getWeatherByIP();
        }
    } catch (error) {
        console.error('Erro de geolocalização:', error.message);
        weatherCity.innerText = 'Localização não disponível';
        getWeatherByIP();
    }
}

async function getWeatherByIP() {
    try {
        const ipResponse = await axios.get('https://ipapi.co/json/');
        const { city, latitude, longitude } = ipResponse.data;
        
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: latitude,
                longitude: longitude,
                current: 'temperature_2m,weathercode',
                hourly: 'temperature_2m,relative_humidity_2m',
                timezone: 'auto'
            }
        });
        
        const { current } = response.data;
        weatherTemp.innerText = `${Math.round(current.temperature_2m)}°C`;
        weatherCity.innerText = city || 'Localização Aproximada';
        weatherDesc.innerText = getWeatherDescription(current.weathercode);
        setWeatherIcon(current.weathercode);
        
    } catch (error) {
        console.error('Erro ao obter dados do clima por IP:', error);
        weatherCity.innerText = 'Não disponível';
    }
}

function getWeatherDescription(weathercode) {
    const descriptions = {
        0: 'Céu limpo',
        1: 'Parcialmente nublado',
        2: 'Parcialmente nublado',
        3: 'Nublado',
        45: 'Neblina',
        48: 'Nevoeiro',
        51: 'Chuvisco leve',
        53: 'Chuvisco moderado',
        55: 'Chuvisco intenso',
        61: 'Chuva leve',
        63: 'Chuva moderada',
        65: 'Chuva forte',
        71: 'Neve leve',
        73: 'Neve moderada',
        75: 'Neve forte',
        80: 'Pancadas de chuva leve',
        81: 'Pancadas de chuva moderada',
        82: 'Pancadas de chuva forte',
        95: 'Tempestade',
        96: 'Tempestade com granizo leve',
        99: 'Tempestade com granizo forte'
    };
    return descriptions[weathercode] || 'Condição desconhecida';
}

function setWeatherIcon(weathercode) {
    const iconClasses = {
        0: 'fas fa-sun',
        1: 'fas fa-cloud-sun',
        2: 'fas fa-cloud-sun',
        3: 'fas fa-cloud',
        45: 'fas fa-smog',
        48: 'fas fa-smog',
        51: 'fas fa-cloud-rain',
        53: 'fas fa-cloud-rain',
        55: 'fas fa-cloud-rain',
        61: 'fas fa-cloud-showers-heavy',
        63: 'fas fa-cloud-showers-heavy',
        65: 'fas fa-cloud-showers-heavy',
        80: 'fas fa-cloud-showers-heavy',
        81: 'fas fa-cloud-showers-heavy',
        82: 'fas fa-cloud-showers-heavy',
        71: 'fas fa-snowflake',
        73: 'fas fa-snowflake',
        75: 'fas fa-snowflake',
        95: 'fas fa-bolt',
        96: 'fas fa-bolt',
        99: 'fas fa-bolt'
    };
    
    const iconClass = iconClasses[weathercode] || 'fas fa-cloud-sun';
    weatherIcon.innerHTML = `<i class="${iconClass}"></i>`;
}

// Funções de tema
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    const icon = toggleModeBtn.querySelector('i');
    if (currentTheme === 'dark') {
        icon.className = 'fas fa-sun';
        toggleModeBtn.title = 'Modo Claro';
    } else {
        icon.className = 'fas fa-moon';
        toggleModeBtn.title = 'Modo Escuro';
    }
}

function applyTheme(theme) {
    document.body.className = '';
    if (theme !== 'light') {
        document.body.classList.add(`${theme}-theme`);
    }
    if (themeSelect) {
        themeSelect.value = theme;
    }
}

// Funções de notificação
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 4000);
}

// Funções de compartilhamento
function shareConversation() {
    const conversationId = localStorage.getItem("currentConversationId");
    if (!conversationId) {
        showNotification("Nenhuma conversa para compartilhar!", true);
        return;
    }

    const savedConversations = JSON.parse(localStorage.getItem("rubyIAConversations") || "[]");
    const conversation = savedConversations.find(conv => conv.id === parseInt(conversationId));
    
    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
        showNotification("Nenhuma conversa para compartilhar!", true);
        return;
    }

    let shareText = `Conversa com Ruby IA (${conversation.name || 'Nova Conversa'})\n\n`;
    conversation.messages.forEach(msg => {
        shareText += `${msg.isUser ? 'Você' : 'Ruby IA'}: ${msg.isUser && msg.content.startsWith("data:image") ? "[Imagem]" : msg.content}\n\n`;
    });

    if (navigator.share) {
        navigator.share({
            title: `Minha conversa com Ruby IA - ${conversation.name}`,
            text: shareText,
        }).catch(err => {
            console.error('Erro ao compartilhar:', err);
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

async function copyToClipboard(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
            } finally {
                document.body.removeChild(textarea);
            }
        }
        
        showNotification('Texto copiado para a área de transferência!', false);
        return true;
    } catch (err) {
        console.error('Erro ao copiar texto:', err);
        showNotification('Não foi possível copiar o texto', true);
        return false;
    }
}

// Funções de confirmação
function showConfirmModal(title, message, callback) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmCallback = callback;
    confirmModal.classList.add('show');
}

// Funções do Arduino
async function connectToArduino() {
    if ('serial' in navigator) {
        try {
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });

            const textEncoder = new TextEncoderStream();
            const writableStream = port.writable;
            textEncoder.readable.pipeTo(writableStream);
            writer = textEncoder.writable.getWriter();

            showNotification('Arduino conectado com sucesso!');
            console.log('Arduino conectado.');

        } catch (err) {
            showNotification(`Erro ao conectar: ${err.message}`, true);
            console.error('Erro ao conectar com o Arduino:', err);
        }
    } else {
        showNotification('A Web Serial API não é suportada neste navegador. Use Chrome ou Edge.', true);
        console.error('Web Serial API não suportada.');
    }
}

async function sendLedCommand(command) {
    if (!port || !port.writable) {
        showNotification('Arduino não conectado. Clique em "Conectar ao Arduino" primeiro.', true);
        return;
    }

    let commandChar;
    switch (command) {
        case 'on':
            commandChar = 'L';
            break;
        case 'off':
            commandChar = 'D';
            break;
        case 'blink':
            commandChar = 'P';
            break;
        default:
            return;
    }

    try {
        await writer.write(commandChar);
        const commandPt = { on: 'Ligar', off: 'Desligar', blink: 'Piscar' };
        console.log(`Comando '${commandPt[command]}' (${commandChar}) enviado.`);
    } catch (err) {
        showNotification(`Erro ao enviar comando: ${err.message}`, true);
        console.error('Erro ao escrever na porta serial:', err);
    }
}

function turnOffAllLights() {
    document.querySelectorAll('.light-on').forEach(el => {
        el.classList.remove('active');
    });
    sendLedCommand('off');
}

// Inicializar lazy loading quando o DOM estiver pronto
function initializeLazyLoading() {
    initLazyLoading();
    
    // Observar adições dinâmicas ao DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                initLazyLoading();
            }
        });
    });

    // Observar mudanças no contêiner de mensagens
    if (messagesContainer) {
        observer.observe(messagesContainer, {
            childList: true,
            subtree: true
        });
    }
}

// Função auxiliar para detectar configuração do dispositivo
function getDeviceConfig() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    
    return {
        width,
        height,
        dpr,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isPortrait: height > width,
        isLandscape: width > height
    };
}

// Função para inicializar a biblioteca
function initializeLibrary() {
    // Garantir que o container está visível
    const savedContainer = document.getElementById('savedConversations');
    if (savedContainer) {
        savedContainer.style.display = 'block';
    }
    
    // Carregar conversas salvas
    displaySavedConversations();
}

// Função para testar vozes
function testVoice(voiceName = null) {
    const testText = "Olá! Esta é uma demonstração da voz do Ruby IA. Espero que tenha uma experiência agradável.";
    
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    let voiceToUse = null;
    
    if (voiceName) {
        voiceToUse = voices.find(v => v.name === voiceName);
    } else {
        const selectedVoiceName = localStorage.getItem('selectedVoice');
        if (selectedVoiceName) {
            voiceToUse = voices.find(v => v.name === selectedVoiceName);
        }
    }
    
    if (voiceToUse) {
        utterance.voice = voiceToUse;
    }
    
    // Parar qualquer fala em andamento
    window.speechSynthesis.cancel();
    
    utterance.onend = function() {
        showNotification('Teste de voz concluído!');
    };
    
    utterance.onerror = function() {
        showNotification('Erro no teste de voz', true);
    };
    
    setTimeout(() => {
        window.speechSynthesis.speak(utterance);
    }, 100);
}


// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
    // Inicializar otimizações
    await checkWebPSupport();
    enhanceSpeechSynthesis();
    
    // FORÇAR DETECÇÃO DE VOZES APÓS CARREGAR
    setTimeout(() => {
        console.log('Forçando detecção de vozes do sistema...');
        detectAllSystemVoices();
        
        // Tentar novamente após 2 segundos
        setTimeout(() => {
            voices = window.speechSynthesis.getVoices();
            console.log('Vozes após 2 segundos:', voices.length);
            if (voices.length <= 2) {
                console.log('Ainda poucas vozes. Tentando método alternativo...');
                // Chamar função de debug para ver o que há
                showVoiceDebugInfo();
            }
        }, 2000);
    }, 1000);
    
    // Adicionar botão de teste de voz no modal de configurações
    const settingsBody = document.querySelector('.modal-body');
    
    if (settingsBody && !document.getElementById('testVoiceBtn')) {
        // Container para configurações de voz
        const voiceSettingsDiv = document.createElement('div');
        voiceSettingsDiv.className = 'voice-settings';
        
        // Seletor de voz
        const voiceSelectDiv = document.createElement('div');
        voiceSelectDiv.className = 'setting-option';
        voiceSelectDiv.innerHTML = `
            <label for="voiceSelect">Voz de Leitura</label>
            <select id="voiceSelect" class="voice-select"></select>
            <button id="testVoiceBtn" class="btn-test-voice">
                <i class="fas fa-volume-up"></i> Testar Voz
            </button>
            <p class="setting-hint">Clique para testar a voz selecionada</p>
        `;
        
        // Botão para forçar detecção de vozes
        const detectDiv = document.createElement('div');
        detectDiv.className = 'setting-option';
        detectDiv.innerHTML = `
            <label>Detecção de Vozes</label>
            <button id="forceDetectVoices" class="btn-test-voice" style="background: linear-gradient(135deg, #9C27B0, #673AB7)">
                <i class="fas fa-search"></i> Forçar Detecção de Vozes
            </button>
            <p class="setting-hint">Recarrega todas as vozes disponíveis</p>
        `;
        
        // Adicionar elementos ao container de configurações
        voiceSettingsDiv.appendChild(voiceSelectDiv);
        voiceSettingsDiv.appendChild(detectDiv);
        settingsBody.appendChild(voiceSettingsDiv);
        
        // Adicionar evento ao botão de teste
        document.getElementById('testVoiceBtn')?.addEventListener('click', () => {
            testVoice();
        });
        
        // Adicionar evento para salvar a voz selecionada
        voiceSelect?.addEventListener('change', (e) => {
            if (e.target.value !== 'debug_voices') {
                localStorage.setItem('selectedVoice', e.target.value);
            }
        });
        
        // Adicionar evento ao botão de forçar detecção
        document.getElementById('forceDetectVoices')?.addEventListener('click', () => {
            showNotification('Detectando todas as vozes do sistema...', false);
            detectAllSystemVoices();
            
            // Atualizar após 1 segundo
            setTimeout(() => {
                voices = window.speechSynthesis.getVoices();
                populateVoiceSelect();
                showNotification(`Agora há ${voices.length} voz(es) detectadas`, false);
            }, 1000);
        });
    }
    
    // Inicializar biblioteca
    initializeLibrary();
    console.log(`WebP support: ${supportsWebP}`);
    
    // Inicializar lazy loading
    initializeLazyLoading();
    
    // Limpar cache antigo periodicamente
    setInterval(() => {
        const now = Date.now();
        let clearedCount = 0;
        
        for (const [key, value] of responseCache.entries()) {
            if (now - value.timestamp > CACHE_DURATION) {
                responseCache.delete(key);
                clearedCount++;
            }
        }
        
        if (clearedCount > 0) {
            console.log(`[Cache] Limpados ${clearedCount} itens expirados`);
        }
    }, 60000); // Verificar a cada minuto
    
    // Configurações de tema e fonte
    const savedTheme = localStorage.getItem('theme') || 'light';
    currentTheme = savedTheme;
    applyTheme(savedTheme);
    
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    fontSizeSelect.value = savedFontSize;
    document.body.classList.add(`font-${savedFontSize}`);
    
    // Gerenciamento de conversas
    const currentConversationId = localStorage.getItem("currentConversationId");
    if (!currentConversationId || messagesContainer.children.length === 0) {
        showWelcomeMessage();
    } else {
        suggestionsContainer.style.display = 'none';
    }
    
    // Inicializações adicionais
    displaySavedConversations();
    getWeather();
    initializeSpeechRecognition();
    
    // Adicionar event listener para o botão de reiniciar
    const restartBtn = document.getElementById('restartConversationBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            restartConversation();
        });
    }
    
    // Log da configuração inicial do dispositivo
    const deviceConfig = getDeviceConfig();
    console.log(`[Device] ${deviceConfig.isMobile ? 'Mobile' : deviceConfig.isTablet ? 'Tablet' : 'Desktop'} ${deviceConfig.width}x${deviceConfig.height} @${deviceConfig.dpr}x`);
});

// Evento de redimensionamento já está configurado na inicialização
// A função handleResize agora inclui toda a lógica necessária

if (speechSynthesis) {
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
}

// Event Listeners para elementos de interface
uploadBtn.addEventListener("click", () => imageUpload.click());
imageUpload.addEventListener("change", handleImageUpload);
removeImageBtn.addEventListener("click", removeImage);
sendBtn.addEventListener("click", () => {
    trackEvent('message_sent', { 
        hasImage: currentImages.length > 0,
        messageLength: userMessageInput.value.length,
        source: 'button'
    });
    sendMessage();
});

userMessageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        trackEvent('message_sent', { 
            hasImage: currentImages.length > 0,
            messageLength: userMessageInput.value.length,
            source: 'enter_key'
        });
        sendMessage();
    }
});

// Auto-salvar rascunho com debounce
userMessageInput.addEventListener('input', debounce((e) => {
    localStorage.setItem('messageDraft', e.target.value);
}, 500));

menuBtn.addEventListener("click", () => {
    trackEvent('sidebar_opened', { method: 'button' });
    sidebar.classList.add("open");
    // Fecha o menu do LED quando o menu principal é aberto
    if (ledMenu && ledMenuContent) {
        ledMenu.classList.remove('active');
        ledMenuContent.classList.remove('active');
    }
});

micBtn.addEventListener("click", () => {
    trackEvent('voice_recognition_toggled', { 
        isListening: isListening,
        isSupported: !micBtn.disabled 
    });
    handleMicrophone();
});

speakBtn.addEventListener("click", () => {
    trackEvent('text_to_speech_used', { 
        isSpeaking: isSpeaking,
        isSupported: speechSynthesis !== undefined 
    });
    speakLastMessage();
});

settingsBtn.addEventListener("click", () => settingsModal.classList.add("show"));
closeSettingsBtn.addEventListener("click", () => settingsModal.classList.remove("show"));
shareBtn.addEventListener("click", shareConversation);
toggleModeBtn.addEventListener("click", toggleTheme);

fontSizeSelect.addEventListener("change", (e) => {
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${e.target.value}`);
    localStorage.setItem('fontSize', e.target.value);
});

suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessageInput.value = suggestion.getAttribute('data-prompt');
        userMessageInput.focus();
    });
});

confirmCancelBtn.addEventListener('click', () => {
    confirmModal.classList.remove('show');
    confirmCallback = null;
});

confirmOkBtn.addEventListener('click', () => {
    if (confirmCallback) {
        confirmCallback();
    }
    confirmModal.classList.remove('show');
    confirmCallback = null;
});

// Event Listeners para o Arduino
// Adicionando controle do menu do LED
if (ledMenu && ledMenuContent) {
    ledMenu.addEventListener('click', function() {
        this.classList.toggle('active');
        ledMenuContent.classList.toggle('active');
    });
}

// Adiciona eventos para os botões do LED
if (connectArduinoBtn) {
    connectArduinoBtn.addEventListener('click', connectToArduino);
}

if (ligarLedBtn) {
    ligarLedBtn.addEventListener('click', function() {
        document.querySelectorAll('.light-on').forEach(el => {
            el.classList.remove('active');
        });
        this.classList.add('light-on', 'active');
        sendLedCommand('on');
    });
}

if (desligarLedBtn) {
    desligarLedBtn.addEventListener('click', function() {
        document.querySelectorAll('.light-on').forEach(el => {
            el.classList.remove('active');
        });
        sendLedCommand('off');
    });
}

if (piscarLedBtn) {
    let isBlinking = false;
    
    piscarLedBtn.addEventListener('click', function() {
        if (isBlinking) {
            this.classList.remove('light-on');
            sendLedCommand('off');
            isBlinking = false;
        } else {
            document.querySelectorAll('.light-on').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('light-on');
            sendLedCommand('blink');
            isBlinking = true;
        }
    });
}