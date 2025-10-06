const STORAGE_KEYS = {
    token: 'syra_jwt',
    apiBase: 'syra_api_base_url'
};

const DEFAULT_API_BASE = 'http://191.252.110.182:5000';
let toastTimeout = null;
let pendingUsername = null;

function getApiBase() {
    const stored = localStorage.getItem(STORAGE_KEYS.apiBase);
    return stored && stored.trim() ? stored.trim() : DEFAULT_API_BASE;
}

function setApiBase(url) {
    if (!url) {
        localStorage.removeItem(STORAGE_KEYS.apiBase);
        return;
    }
    localStorage.setItem(STORAGE_KEYS.apiBase, url.trim());
}

function showAuthToast(message, type = 'success') {
    const toast = document.getElementById('authToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove('success', 'error', 'show');
    if (type) {
        toast.classList.add(type === 'error' ? 'error' : 'success');
    }

    // Force reflow to restart animation when toggling rapidly
    void toast.offsetWidth;
    toast.classList.add('show');

    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3800);
}

function setButtonLoading(button, isLoading, loadingLabel) {
    if (!button) return;
    if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.textContent = loadingLabel || 'Processando...';
        button.disabled = true;
    } else {
        const original = button.dataset.originalText;
        if (original) {
            button.textContent = original;
            delete button.dataset.originalText;
        }
        button.disabled = false;
    }
}

function sanitizeTotp(value) {
    return value.replace(/[^0-9]/g, '').slice(0, 6);
}

function setActiveTab(target) {
    const tabs = document.querySelectorAll('.auth-tab');
    const loginPanel = document.getElementById('loginPanel');
    const registerPanel = document.getElementById('registerPanel');

    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === target);
    });

    if (loginPanel) {
        loginPanel.classList.toggle('active', target === 'login');
    }
    if (registerPanel) {
        registerPanel.classList.toggle('active', target === 'register');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginPanel');
    const loginButton = document.getElementById('loginButton');
    const loginUsername = document.getElementById('loginUsername');
    const loginTotp = document.getElementById('loginTotp');
    const openRegister = document.getElementById('openRegister');

    const registerForm = document.getElementById('registerForm');
    const registerUsername = document.getElementById('registerUsername');
    const registerButton = document.getElementById('registerButton');
    const registerResult = document.getElementById('registerResult');
    const registerQr = document.getElementById('registerQr');
    const backupKey = document.getElementById('backupKey');
    const verificationStep = document.getElementById('verificationStep');
    const verifyUsername = document.getElementById('verifyUsername');
    const verifyButton = document.getElementById('verifyButton');
    const verifyTotp = document.getElementById('verifyTotp');

    const apiBaseLabel = document.getElementById('currentApiBase');
    const editApiBase = document.getElementById('editApiBase');

    const currentToken = localStorage.getItem(STORAGE_KEYS.token);
    const apiBase = getApiBase();

    if (apiBaseLabel) {
        apiBaseLabel.textContent = apiBase;
    }

    if (currentToken) {
        showAuthToast('Sessão válida encontrada. Redirecionando...', 'success');
        setTimeout(() => {
            window.location.href = './syradash.html';
        }, 1200);
    }

    const totpInputs = [loginTotp, verifyTotp];
    totpInputs.forEach(input => {
        if (!input) return;
        input.addEventListener('input', (event) => {
            event.target.value = sanitizeTotp(event.target.value || '');
        });
    });

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            setActiveTab(tab.dataset.tab);
        });
    });

    if (openRegister) {
        openRegister.addEventListener('click', () => {
            setActiveTab('register');
            registerUsername?.focus();
        });
    }

    if (editApiBase) {
        editApiBase.addEventListener('click', () => {
            const current = getApiBase();
            const next = prompt('Informe a URL base da API Syra', current);
            if (next !== null) {
                const trimmed = next.trim();
                if (trimmed.length === 0) {
                    setApiBase('');
                } else {
                    setApiBase(trimmed);
                }
                if (apiBaseLabel) {
                    apiBaseLabel.textContent = getApiBase();
                }
                showAuthToast('Endpoint atualizado.', 'success');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = (loginUsername?.value || '').trim();
            const totp = sanitizeTotp(loginTotp?.value || '');

            if (!username || totp.length !== 6) {
                showAuthToast('Informe usuário e código TOTP válido.', 'error');
                return;
            }

            const baseUrl = getApiBase();
            setButtonLoading(loginButton, true, 'Autenticando...');

            try {
                const response = await fetch(`${baseUrl}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, totp_code: totp })
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    showAuthToast(payload.error || 'Falha ao autenticar.', 'error');
                    return;
                }

                if (payload.token) {
                    localStorage.setItem(STORAGE_KEYS.token, payload.token);
                    showAuthToast('Bem-vindo ao SyraDash! Redirecionando...', 'success');
                    setTimeout(() => {
                        window.location.href = './syradash.html';
                    }, 900);
                } else {
                    showAuthToast('Resposta inesperada da API.', 'error');
                }
            } catch (error) {
                console.error(error);
                showAuthToast('Não foi possível contato com a API Syra.', 'error');
            } finally {
                setButtonLoading(loginButton, false);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = (registerUsername?.value || '').trim().toLowerCase();
            if (!username) {
                showAuthToast('Escolha um nome de usuário para continuar.', 'error');
                return;
            }

            const baseUrl = getApiBase();
            setButtonLoading(registerButton, true, 'Gerando QR...');

            try {
                const response = await fetch(`${baseUrl}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    showAuthToast(payload.error || 'Falha ao iniciar registro.', 'error');
                    return;
                }

                if (registerResult && registerQr && backupKey && verifyUsername) {
                    registerResult.hidden = false;
                    if (payload.qr_code_image) {
                        registerQr.src = payload.qr_code_image;
                    } else {
                        registerQr.removeAttribute('src');
                    }
                    registerQr.alt = `QR Code para ${username}`;
                    backupKey.textContent = payload.secret_backup_key || '---';
                    verifyUsername.textContent = `@${username}`;
                }

                if (verificationStep) {
                    verificationStep.hidden = false;
                }

                pendingUsername = username;
                showAuthToast('Escaneie o QR Code e confirme o TOTP para finalizar.', 'success');
            } catch (error) {
                console.error(error);
                showAuthToast('Erro ao conectar-se à API durante o registro.', 'error');
            } finally {
                setButtonLoading(registerButton, false);
            }
        });
    }

    if (verifyButton) {
        verifyButton.addEventListener('click', async () => {
            if (!pendingUsername) {
                showAuthToast('Gere o QR Code antes de verificar.', 'error');
                return;
            }

            const totp = sanitizeTotp(verifyTotp?.value || '');
            if (totp.length !== 6) {
                showAuthToast('Informe o código TOTP de 6 dígitos.', 'error');
                return;
            }

            const baseUrl = getApiBase();
            setButtonLoading(verifyButton, true, 'Validando...');

            try {
                const response = await fetch(`${baseUrl}/auth/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: pendingUsername, totp_code: totp })
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    showAuthToast(payload.error || 'Código inválido.', 'error');
                    return;
                }

                showAuthToast('Conta verificada! Faça login com seu TOTP.', 'success');
                if (loginUsername) {
                    loginUsername.value = pendingUsername;
                }

                pendingUsername = null;
                if (verificationStep) {
                    verificationStep.hidden = true;
                }
                if (verifyTotp) {
                    verifyTotp.value = '';
                }

                setActiveTab('login');
                loginTotp?.focus();
            } catch (error) {
                console.error(error);
                showAuthToast('Erro ao validar o código TOTP.', 'error');
            } finally {
                setButtonLoading(verifyButton, false);
            }
        });
    }
});
