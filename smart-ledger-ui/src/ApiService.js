import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL
    ? `${process.env.REACT_APP_BACKEND_URL}/api/transactions`
    : "http://localhost:8080/api/transactions";
const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    if (token && !token.startsWith('local_token_')) {
        return { Authorization: `Bearer ${token}` };
    }
    return {};
};


const getCurrentUser = () => sessionStorage.getItem('smart_ledger_current_user') || 'guest';



const getLocalTransactions = () => {
    const key = `smart_ledger_transactions_${getCurrentUser()}`;
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        return [];
    }
};

const saveLocalTransactions = (txns) => {
    const key = `smart_ledger_transactions_${getCurrentUser()}`;
    localStorage.setItem(key, JSON.stringify(txns));
};



class ApiService {

    getAllTransactions() {
        const token = sessionStorage.getItem('token');


        if (!token || token.startsWith('local_token_')) {
            const txns = getLocalTransactions();
            return Promise.resolve({ data: txns });
        }


        return axios.get(API_BASE_URL, { headers: getAuthHeaders() })
            .catch(() => {
                const txns = getLocalTransactions();
                return { data: txns };
            });
    }

    addTransaction(amount, category) {
        const token = localStorage.getItem('token');


        if (!token || token.startsWith('local_token_')) {
            const existing = getLocalTransactions();
            const newTx = {
                id: Date.now(),
                amount: parseFloat(amount),
                category: String(category),
                merchant: String(category),
                transactionDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                rawSms: ''
            };
            const updated = [...existing, newTx];
            saveLocalTransactions(updated);
            return Promise.resolve({ data: newTx });
        }


        const queryParams = new URLSearchParams();
        queryParams.append('amount', parseFloat(amount));
        queryParams.append('merchant', String(category));
        queryParams.append('category', String(category));
        queryParams.append('rawSms', '');

        return axios.post(`${API_BASE_URL}/add?${queryParams.toString()}`, null, {
            headers: getAuthHeaders()
        }).catch(() => {

            const existing = getLocalTransactions();
            const newTx = {
                id: Date.now(),
                amount: parseFloat(amount),
                category: String(category),
                merchant: String(category),
                transactionDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                rawSms: ''
            };
            const updated = [...existing, newTx];
            saveLocalTransactions(updated);
            return { data: newTx };
        });
    }
}

export default new ApiService();