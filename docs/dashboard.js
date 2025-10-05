const DASH_STORAGE_KEYS = {
    token: 'syra_jwt',
    apiBase: 'syra_api_base_url'
};

const DASH_DEFAULT_API_BASE = 'http://191.252.110.182:5000';
let dashToastTimeout = null;

function dashGetApiBase() {
    const stored = localStorage.getItem(DASH_STORAGE_KEYS.apiBase);
    return stored && stored.trim() ? stored.trim() : DASH_DEFAULT_API_BASE;
}

function dashShowToast(message, type = 'success') {
    const toast = document.getElementById('dashToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove('success', 'error', 'show');
    toast.classList.add(type === 'error' ? 'error' : 'success');
    void toast.offsetWidth;
    toast.classList.add('show');

    if (dashToastTimeout) {
        clearTimeout(dashToastTimeout);
    }
    dashToastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3600);
}

function dashFormatDate(value, options = { dateStyle: 'long', timeStyle: 'short' }) {
    if (!value) return '--';
    let date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        // Tente interpretar strings no formato "YYYY-MM-DD HH:MM:SS"
        const normalized = value.replace(' ', 'T');
        date = new Date(normalized);
    }
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat('pt-BR', options).format(date);
}

async function dashFetch(endpoint, options = {}) {
    const token = localStorage.getItem(DASH_STORAGE_KEYS.token);
    if (!token) {
        throw new Error('Sessão expirada');
    }

    const baseUrl = dashGetApiBase();
    const headers = Object.assign(
        {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        options.headers || {}
    );

    const response = await fetch(`${baseUrl}${endpoint}`, Object.assign({}, options, { headers }));

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(DASH_STORAGE_KEYS.token);
        throw new Error('Sessão expirada. Autentique-se novamente.');
    }

    if (response.status === 204) {
        return null;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = data.error || 'Erro ao comunicar com a API Syra.';
        throw new Error(message);
    }

    return data;
}

function updateNetworkCard(summary) {
    if (!summary) {
        return;
    }

    const handle = document.getElementById('userHandle');
    const followersMetric = document.getElementById('followersMetric');
    const followingMetric = document.getElementById('followingMetric');
    const networkUpdated = document.getElementById('networkUpdated');

    if (handle) {
        handle.textContent = `@${summary.username}`;
    }

    if (followersMetric) {
        followersMetric.textContent = summary.followers_count ?? '0';
    }

    if (followingMetric) {
        followingMetric.textContent = summary.following_count ?? '0';
    }

    if (networkUpdated) {
        const now = new Date();
        networkUpdated.textContent = `Atualizado às ${dashFormatDate(now, { timeStyle: 'short' })}`;
    }
}

function updateWallet(wallet) {
    const balanceLabel = document.getElementById('walletBalance');
    const codeLabel = document.getElementById('walletCode');

    if (!wallet) {
        if (balanceLabel) {
            balanceLabel.textContent = '--';
        }
        if (codeLabel) {
            codeLabel.textContent = 'Carteira: não localizada';
        }
        return;
    }

    if (balanceLabel) {
        const balance = wallet.balance ?? wallet.wallet_balance ?? 0;
        balanceLabel.textContent = balance;
    }

    if (codeLabel) {
        codeLabel.textContent = wallet.wallet_code ? `Carteira: ${wallet.wallet_code}` : 'Carteira: não localizada';
    }
}

function updateProfileCard(summary, qrCodeData) {
    const bioElement = document.getElementById('profileBio');
    const qrElement = document.getElementById('profileQr');

    if (bioElement) {
        bioElement.textContent = summary?.bio?.trim() ? summary.bio : 'Bio não informada.';
    }

    if (qrElement) {
        if (qrCodeData?.qr_code) {
            qrElement.src = qrCodeData.qr_code;
            qrElement.style.display = 'block';
        } else {
            qrElement.removeAttribute('src');
            qrElement.style.display = 'none';
        }
    }
}

async function loadDashboard() {
    try {
        const [summary, wallet, profileResponse, qrCode] = await Promise.all([
            dashFetch('/me/summary'),
            dashFetch('/wallet/info'),
            dashFetch('/me/profile').catch(() => null),
            dashFetch('/me/qr-code').catch(() => null)
        ]);

        updateNetworkCard(summary);
        updateWallet(wallet);
        updateProfileCard(profileResponse || summary, qrCode);

        dashShowToast('Dashboard atualizado.', 'success');
    } catch (error) {
        console.error(error);
        dashShowToast(error.message || 'Erro ao atualizar o SyraDash.', 'error');
        if (error.message && error.message.includes('Sessão expirada')) {
            setTimeout(() => {
                window.location.href = './SyraID.html';
            }, 800);
        }
    }
}

function setupDashboard() {
    const token = localStorage.getItem(DASH_STORAGE_KEYS.token);
    if (!token) {
        dashShowToast('Sessão não encontrada. Faça login novamente.', 'error');
        setTimeout(() => {
            window.location.href = './SyraID.html';
        }, 800);
        return;
    }

    const refreshButton = document.getElementById('refreshDashboard');
    const logoutButton = document.getElementById('logoutDashboard');
    const openWalletButton = document.getElementById('openWallet');

    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            refreshButton.disabled = true;
            loadDashboard().finally(() => {
                refreshButton.disabled = false;
            });
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem(DASH_STORAGE_KEYS.token);
            dashShowToast('Sessão encerrada.', 'success');
            setTimeout(() => {
                window.location.href = './SyraID.html';
            }, 600);
        });
    }

    if (openWalletButton) {
        openWalletButton.addEventListener('click', () => {
            window.location.href = './SyraID/SyraWallet.html';
        });
    }

    loadDashboard();
}

document.addEventListener('DOMContentLoaded', setupDashboard);
