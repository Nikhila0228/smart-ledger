import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import ApiService from './ApiService';
import {
  LayoutDashboard, Receipt, PieChart, Settings,
  LogOut, User, Wallet, ArrowUpRight, Menu, X, Check, AlertTriangle, CreditCard, Download
} from 'lucide-react';

import {
  ResponsiveContainer, PieChart as ReChartsPie, Pie, Cell, Tooltip,
  Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import './App.css';



const getCategoryBadgeStyle = (category) => {
  const cat = (category || 'Food').toLowerCase();
  const staticThemes = {
    food:     { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' },
    travel:   { background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' },
    shopping: { background: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff' },
    bills:    { background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' },
    others:   { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }
  };
  if (staticThemes[cat]) return staticThemes[cat];
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return {
    background: `hsl(${hue}, 85%, 95%)`,
    color: `hsl(${hue}, 90%, 30%)`,
    border: `1px solid hsl(${hue}, 80%, 88%)`,
    fontWeight: '600',
    textTransform: 'capitalize'
  };
};

const normalizeCategory = (name) => {
  if (!name) return 'Others';
  let str = name.trim().toLowerCase();
  if (str.endsWith('s') && str.length > 2) str = str.slice(0, -1);
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const normKey = (name) => {
  if (!name) return 'others';
  let str = name.trim().toLowerCase();
  if (str.endsWith('s') && str.length > 2) str = str.slice(0, -1);
  return str;
};


const getCurrentUser = () => sessionStorage.getItem('smart_ledger_current_user') || 'guest';

const getUserDataKey = (suffix) => `smart_ledger_data_${getCurrentUser()}_${suffix}`;

const getUserData = (suffix, fallback) => {
  try {
    const raw = localStorage.getItem(getUserDataKey(suffix));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setUserData = (suffix, value) => {
  localStorage.setItem(getUserDataKey(suffix), JSON.stringify(value));
};

// Default budget limits
const DEFAULT_BUDGET_LIMITS = {
  Food: 5000,
  Travel: 3000,
  Shopping: 7000,
  Bill: 10000,
  Other: 500
};


const SmartAlert = ({ show, message, onConfirm, onCancel }) => {
  if (!show) return null;
  return (
      <div className="smart-alert-overlay">
        <div className="smart-alert-box">
          <h4>Attention Required!</h4>
          <p style={{ marginTop: '10px' }}>{message}</p>
          <div className="alert-actions">
            <button onClick={onCancel} className="btn-cancel">Cancel</button>
            <button onClick={onConfirm} className="btn-confirm">Keep Spending</button>
          </div>
        </div>
      </div>
  );
};


function App() {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState('login');

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!sessionStorage.getItem('token'));

  const [showSmartAlert, setShowSmartAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');


  const [incomes, setIncomes] = useState(() => getUserData('incomes', []));
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeSource, setIncomeSource] = useState('Salary');
  const [customSource, setCustomSource] = useState('');

  const [filterType, setFilterType] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [merchant, setMerchant] = useState('');
  const [customDropdownCategories, setCustomDropdownCategories] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isEditingBudgets, setIsEditingBudgets] = useState(false);

  const [budgetLimits, setBudgetLimits] = useState(() => {
    const saved = getUserData('budgetLimits', null);
    if (saved) {
      const normalized = {};
      Object.entries(saved).forEach(([key, val]) => {
        normalized[normalizeCategory(key)] = val;
      });
      return normalized;
    }
    return { ...DEFAULT_BUDGET_LIMITS };
  });

  const [tempLimits, setTempLimits] = useState({ ...budgetLimits });


  useEffect(() => {
    if (isLoggedIn) {
      const userIncomes = getUserData('incomes', []);
      setIncomes(userIncomes);

      const userBudgets = getUserData('budgetLimits', null);
      if (userBudgets) {
        const normalized = {};
        Object.entries(userBudgets).forEach(([key, val]) => {
          normalized[normalizeCategory(key)] = val;
        });
        setBudgetLimits(normalized);
        setTempLimits(normalized);
      } else {
        setBudgetLimits({ ...DEFAULT_BUDGET_LIMITS });
        setTempLimits({ ...DEFAULT_BUDGET_LIMITS });
      }

      loadTransactions();
    }
  }, [isLoggedIn]);


  useEffect(() => {
    if (isLoggedIn) {
      setUserData('incomes', incomes);
    }
  }, [incomes]);

  const loadTransactions = () => {
    ApiService.getAllTransactions()
        .then(res => {
          const data = res.data || [];
          const currentActiveLimits = getUserData('budgetLimits', DEFAULT_BUDGET_LIMITS);
          const activeNormKeys = Object.keys(currentActiveLimits).map(k => normKey(k));
          const defaultNormKeys = ['food', 'travel', 'shopping', 'bill'];

          const strictlyFilteredData = data.filter(t => {
            const tKey = normKey(t.category || '');
            return defaultNormKeys.includes(tKey) || activeNormKeys.includes(tKey);
          });

          setTransactions(strictlyFilteredData);

          const formattedDropdowns = Object.keys(currentActiveLimits)
              .filter(cat => !defaultNormKeys.includes(normKey(cat)))
              .map(cat => normalizeCategory(cat));

          const seen = new Set();
          const uniqueDropdowns = formattedDropdowns.filter(cat => {
            const k = normKey(cat);
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });

          setCustomDropdownCategories(uniqueDropdowns);
        })
        .catch(err => {
          console.error('Transaction load error:', err);
          setTransactions([]);
        });
  };


  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };


  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('smart_ledger_current_user');
    sessionStorage.removeItem('smart_ledger_current_name');
    setIsLoggedIn(false);
    setCurrentPage('login');
    setTransactions([]);
    setIncomes([]);
    setBudgetLimits({ ...DEFAULT_BUDGET_LIMITS });
    setTempLimits({ ...DEFAULT_BUDGET_LIMITS });
  };

  const getActiveBudgets = () => {
    const defaultCategories = ['Food', 'Travel', 'Shopping', 'Bill'];
    const customActiveCategories = Object.keys(budgetLimits);
    const allCategories = [...defaultCategories, ...customActiveCategories];

    const seen = new Set();
    const unique = allCategories.filter(cat => {
      if (!cat) return false;
      const key = normKey(cat);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const user = getCurrentUser();
    return unique.filter(category => {
      const key = normKey(category);
      const deleteTimestamp = localStorage.getItem(`smart_ledger_deleted_time_${user}_${key}`);
      if (deleteTimestamp) {
        return processedTransactions.some(t => {
          if (normKey(t.category || '') !== key) return false;
          return new Date(t.transactionDate || t.date).getTime() > parseInt(deleteTimestamp, 10);
        });
      }
      return true;
    });
  };

  const processedTransactions = React.useMemo(() => {
    const user = getCurrentUser();
    return transactions.filter(t => {
      const tKey = normKey(t.category || 'food');
      const deleteTimestamp = localStorage.getItem(`smart_ledger_deleted_time_${user}_${tKey}`);
      if (deleteTimestamp && t.transactionDate) {
        if (new Date(t.transactionDate).getTime() <= parseInt(deleteTimestamp, 10)) return false;
      }
      if (!t.transactionDate) return true;
      const txDateObj = new Date(t.transactionDate);
      if (filterType === 'current_month') {
        const now = new Date();
        return txDateObj.getMonth() === now.getMonth() && txDateObj.getFullYear() === now.getFullYear();
      }
      if (filterType === 'custom' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        // End date ని day end (23:59:59) కి set చేయి — same day transactions కనిపించాలి
        end.setHours(23, 59, 59, 999);
        return txDateObj >= start && txDateObj <= end;
      }
      return true;
    });
  }, [transactions, filterType, customStartDate, customEndDate]);

  const getCategorySpent = (cat) => {
    const key = normKey(cat);
    return processedTransactions
        .filter(t => normKey(t.category || '') === key)
        .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleQuickExpenseSubmit = (e) => {
    e.preventDefault();
    const rawCat = selectedCategory === 'Others' ? customCategoryName : selectedCategory;
    const targetCategory = normalizeCategory(rawCat);

    const currentLimits = getUserData('budgetLimits', DEFAULT_BUDGET_LIMITS);
    if (!currentLimits[targetCategory]) {
      currentLimits[targetCategory] = 2000;
      setUserData('budgetLimits', currentLimits);
      setBudgetLimits(currentLimits);
    }

    ApiService.addTransaction(amount, targetCategory).then(() => {
      const updatedSpent = getCategorySpent(targetCategory) + parseFloat(amount);
      const limit = currentLimits[targetCategory] || 2000;
      const percentage = (updatedSpent / limit) * 100;

      if (percentage >= 80) {
        setAlertMessage(`Attention! You've reached ${Math.floor(percentage)}% of your ${targetCategory} budget.`);
        setShowSmartAlert(true);
      }

      setAmount('');
      loadTransactions();
    });
  };


  const handleAdd = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const rawCat = selectedCategory === 'Others' ? customCategoryName : selectedCategory;
    const targetCategory = normalizeCategory(rawCat);

    const currentLimits = getUserData('budgetLimits', DEFAULT_BUDGET_LIMITS);
    const alreadyExists = Object.keys(currentLimits).some(k => normKey(k) === normKey(targetCategory));
    if (!alreadyExists) {
      currentLimits[targetCategory] = 2000;
      setUserData('budgetLimits', currentLimits);
      setBudgetLimits(currentLimits);
    }

    ApiService.addTransaction(parseFloat(amount), targetCategory)
        .then(() => {
          setAmount('');
          setCustomCategoryName('');
          setSelectedCategory('Food');
          loadTransactions();
        })
        .catch(err => console.error('Add transaction failed:', err));
  };


  const handleAddIncome = (e) => {
    e.preventDefault();
    if (!incomeAmount || Number(incomeAmount) <= 0) return;

    const finalSource = incomeSource === 'Others' ? customSource : incomeSource;
    const newIncomeNode = {
      id: Date.now(),
      amount: Number(incomeAmount),
      source: finalSource,
      date: new Date().toISOString()
    };

    const updated = [newIncomeNode, ...incomes];
    setIncomes(updated);
    setUserData('incomes', updated);
    setIncomeAmount('');
    setCustomSource('');
    setIncomeSource('Salary');
  };

  const getChartDataMatrix = () => {
    const categoryTotalsMap = {};
    const currentActiveLimits = getUserData('budgetLimits', DEFAULT_BUDGET_LIMITS);
    const activeNormKeys = Object.keys(currentActiveLimits).map(k => normKey(k));
    const defaultNormKeys = ['food', 'travel', 'shopping', 'bill'];
    const user = getCurrentUser();

    processedTransactions.forEach(t => {
      const cat = (t.category || '').trim();
      if (!cat) return;
      const key = normKey(cat);
      if (!defaultNormKeys.includes(key) && !activeNormKeys.includes(key)) return;

      const deleteTimestamp = localStorage.getItem(`smart_ledger_deleted_time_${user}_${key}`);
      if (deleteTimestamp && t.transactionDate) {
        if (new Date(t.transactionDate).getTime() <= parseInt(deleteTimestamp, 10)) return;
      }

      if (!categoryTotalsMap[key]) {
        categoryTotalsMap[key] = { displayName: normalizeCategory(cat), total: 0 };
      }
      const logSafeAmount = t.amount === 0 ? 0.1 : t.amount;
      categoryTotalsMap[key].total += logSafeAmount;
    });

    return Object.keys(categoryTotalsMap).map(key => {
      const { displayName, total } = categoryTotalsMap[key];
      const styleConfig = getCategoryBadgeStyle(displayName);
      return {
        name: displayName,
        value: total === 0.1 ? 0 : total,
        color: styleConfig.color || '#64748b',
        fillColor: styleConfig.background || '#f1f5f9'
      };
    });
  };

  const overBudgetCategories = Object.keys(budgetLimits).filter(cat => {
    return getCategorySpent(cat) > budgetLimits[cat];
  });

  const getTopCategory = () => {
    if (processedTransactions.length === 0) return 'None';
    const counts = {};
    processedTransactions.forEach(t => {
      if (t.category) {
        const key = normKey(t.category);
        counts[key] = (counts[key] || 0) + t.amount;
      }
    });
    if (Object.keys(counts).length === 0) return 'None';
    const topKey = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    return normalizeCategory(topKey);
  };

  const saveBudgetLimits = () => {
    setBudgetLimits({ ...tempLimits });
    setUserData('budgetLimits', tempLimits);
    setIsEditingBudgets(false);
  };

  const handleDeleteCategoryBlock = (categoryToDelete) => {
    if (window.confirm(`Are you sure you want to delete ${categoryToDelete} block?`)) {
      const cleanKey = normKey(categoryToDelete);
      const timestamp = Date.now().toString();
      const user = getCurrentUser();

      localStorage.setItem(`smart_ledger_deleted_time_${user}_${cleanKey}`, timestamp);
      localStorage.setItem(`smart_ledger_deleted_time_${user}_${cleanKey}s`, timestamp);

      const updatedLimits = { ...budgetLimits };
      const updatedTemp = { ...tempLimits };

      Object.keys(updatedLimits).forEach(key => {
        if (normKey(key) === cleanKey) {
          delete updatedLimits[key];
          delete updatedTemp[key];
        }
      });

      setBudgetLimits(updatedLimits);
      setTempLimits(updatedTemp);
      setUserData('budgetLimits', updatedLimits);
      setCustomDropdownCategories(prev => prev.filter(cat => normKey(cat) !== cleanKey));
      setTransactions(prev => prev.filter(t => normKey(t.category || '') !== cleanKey));

      alert(`${categoryToDelete} block has been deleted successfully.`);
    }
  };

  const filteredIncomes = React.useMemo(() => {
    return incomes.filter(inc => {
      if (!inc.date) return true;
      const incDate = new Date(inc.date);
      if (filterType === 'current_month') {
        const now = new Date();
        return incDate.getMonth() === now.getMonth() && incDate.getFullYear() === now.getFullYear();
      }
      if (filterType === 'custom' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return incDate >= start && incDate <= end;
      }
      return true;
    });
  }, [incomes, filterType, customStartDate, customEndDate]);

  const totalIncomeValue = filteredIncomes.reduce((sum, inc) => sum + Number(inc.amount || 0), 0);
  const totalOutflowValue = processedTransactions.reduce((sum, t) => sum + Number(t.amount || t.transactionAmount || 0), 0);
  const netMonthlySavings = totalIncomeValue - totalOutflowValue;
  const totalSpent = processedTransactions.reduce((sum, t) => sum + t.amount, 0);



  return (
      <div className="app-pristine-container premium-modern-theme">
        {!isLoggedIn ? (
            <div className="auth-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
              {currentPage === 'signup' ? (
                  <Signup
                      onNavigateToLogin={() => setCurrentPage('login')}
                      onSignupSuccess={() => {
                        setIsLoggedIn(true);
                        setCurrentPage('login');
                      }}
                  />
              ) : (
                  <Login
                      onLoginSuccess={() => {
                        setIsLoggedIn(true);
                      }}
                      onNavigateToSignup={() => setCurrentPage('signup')}
                  />
              )}
            </div>
        ) : (
            <>
              {/* SIDEBAR NAVIGATION */}
              <aside className={`pristine-sidebar-drawer ${isSidebarOpen ? 'drawer-expanded' : 'drawer-collapsed'}`}>
                <div className="sidebar-top-section">
                  <button className="sidebar-toggle-trigger" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>

                  <div className="sidebar-brand-wrapper">
                    <div className="brand-logo-shield">
                      <Wallet size={18} color="white" />
                    </div>
                    {isSidebarOpen && <span className="brand-title-text">Smart Ledger</span>}
                  </div>

                  <nav className="sidebar-nav-links-stack">
                    <div className={`nav-link-item ${currentView === 'dashboard' ? 'link-state-active' : ''}`} onClick={() => setCurrentView('dashboard')}>
                      <LayoutDashboard size={18} />
                      {isSidebarOpen && <span>Financial Overview</span>}
                    </div>
                    <div className={`nav-link-item ${currentView === 'log-income' ? 'link-state-active' : ''}`} onClick={() => setCurrentView('log-income')}>
                      <Wallet size={18} />
                      {isSidebarOpen && <span>Log Income</span>}
                    </div>
                    <div className={`nav-link-item ${currentView === 'log-expense' ? 'link-state-active' : ''}`} onClick={() => setCurrentView('log-expense')}>
                      <Receipt size={18} />
                      {isSidebarOpen && <span>Log Expense</span>}
                    </div>
                    <div className={`nav-link-item ${currentView === 'transactions' ? 'link-state-active' : ''}`} onClick={() => setCurrentView('transactions')}>
                      <Receipt size={18} />
                      {isSidebarOpen && <span>Transactions</span>}
                    </div>
                    <div className={`nav-link-item ${currentView === 'budgets' ? 'link-state-active' : ''}`} onClick={() => { setCurrentView('budgets'); setTempLimits({ ...budgetLimits }); }}>
                      <PieChart size={18} />
                      {isSidebarOpen && <span>Budget Limits</span>}
                    </div>

                  </nav>
                </div>

                <div className="sidebar-footer-profile-node">
                  <div className="nav-link-item" onClick={() => { setCurrentView('profile'); setIsSidebarOpen(false); }}>
                    <User size={18} /> {isSidebarOpen && <span>My Profile</span>}
                  </div>
                  <div className="nav-link-item termination-trigger" onClick={handleLogout}>
                    <LogOut size={18} /> {isSidebarOpen && <span>Logout</span>}
                  </div>
                </div>
              </aside>

              {/* MAIN VIEWPORT FLOW */}
              <main className={`viewport-main-content-flow ${isSidebarOpen ? 'shift-right' : 'shift-left'}`}>

                {/* DASHBOARD */}
                {currentView === 'dashboard' && (
                    <div className="animate-fade-in-up">
                      <header className="viewport-title-header" style={{ marginBottom: '24px' }}>
                        <div className="header-identity-block">
                          <h1>Financial Overview</h1>
                          <p className="header-meta-subtitle">Track your expenditures and categories with precision</p>
                        </div>
                      </header>

                      <div className="dashboard-metrics-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        <div className="premium-card-surface block-nominal-inflow" style={{ borderLeft: '4px solid #10b981', padding: '16px' }}>
                          <span className="node-micro-label">TOTAL INFLOW</span>
                          <h2 style={{ color: '#10b981', margin: '8px 0 0 0' }}>₹{totalIncomeValue}</h2>
                        </div>
                        <div className="premium-card-surface block-nominal-outflow" style={{ borderLeft: '4px solid #ef4444', padding: '16px' }}>
                          <span className="node-micro-label">TOTAL OUTFLOW</span>
                          <h2 style={{ color: '#ef4444', margin: '8px 0 0 0' }}>₹{totalOutflowValue}</h2>
                        </div>
                        <div className="premium-card-surface block-savings-net" style={{ borderLeft: netMonthlySavings >= 0 ? '4px solid #3b82f6' : '4px solid #f59e0b', padding: '16px' }}>
                          <span className="node-micro-label">NET MONTHLY SAVINGS</span>
                          <h2 style={{ color: netMonthlySavings >= 0 ? '#3b82f6' : '#f59e0b', margin: '8px 0 0 0' }}>₹{netMonthlySavings}</h2>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {netMonthlySavings >= 0 ? 'Financial operational profile: Safe' : 'Warning: High burn-rate trajectory'}
                    </span>
                        </div>
                      </div>

                      {/* Filter Controls */}
                      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)', border: '1px solid #f1f5f9', marginBottom: '28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', color: '#1e293b' }}>📅</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Filter Transactions</span>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Select time period for metrics</span>
                          </div>
                          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', marginLeft: '12px' }}>
                            {['all', 'current_month', 'custom'].map(type => (
                                <button key={type} onClick={() => setFilterType(type)} style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', background: filterType === type ? '#1e293b' : 'transparent', color: filterType === type ? '#ffffff' : '#64748b', transition: 'all 0.2s ease' }}>
                                  {type === 'all' ? 'All History' : type === 'current_month' ? 'This Month' : 'Custom Range'}
                                </button>
                            ))}
                          </div>
                        </div>
                        {filterType === 'custom' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date</span>
                                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: '600', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#1e293b', background: '#ffffff' }} />
                              </div>
                              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginTop: '14px', padding: '0 4px' }}>—</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date</span>
                                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: '600', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#1e293b', background: '#ffffff' }} />
                              </div>
                            </div>
                        )}
                      </div>

                      {overBudgetCategories.length > 0 && (
                          <div className="risk-alert-toast dynamic-alert-glow">
                            <AlertTriangle size={18} className="risk-alert-icon" />
                            <div className="alert-content-message">
                              <strong>Attention Required!</strong> You have exceeded your allowance limit in:{' '}
                              {overBudgetCategories.map((cat) => (
                                  <span key={cat} className="risk-danger-pill">
                          {cat} ({Math.round((getCategorySpent(cat) / budgetLimits[cat]) * 100)}%)
                        </span>
                              ))}
                            </div>
                          </div>
                      )}

                      <section className="metrics-infographics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        <div className="infographic-plate-card-premium" style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)', border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Monthly Outflow</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a' }}>₹{totalSpent}</span>
                          </div>
                        </div>
                        <div className="infographic-plate-card-premium" style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)', border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Highest Spending Category</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#7c3aed' }}>{getTopCategory()}</span>
                          </div>
                        </div>
                      </section>

                      {processedTransactions && processedTransactions.length > 0 && (
                          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', marginBottom: '32px', boxSizing: 'border-box', border: '1px solid #f1f5f9' }}>
                            <div style={{ marginBottom: '20px' }}>
                              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '600' }}>Category-Wise Volume Scaling</h3>
                              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Dynamic relative financial distribution breakdown</p>
                            </div>
                            <div style={{ width: '100%', overflowX: 'auto', paddingTop: '10px' }}>
                              <div style={{ minWidth: '600px', height: '350px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={getChartDataMatrix()} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <defs>
                                      {getChartDataMatrix().map((entry, idx) => (
                                          <linearGradient key={`gradient-${idx}`} id={`barGradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.4} />
                                          </linearGradient>
                                      ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: '500' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} dy={8} />
                                    <YAxis scale="log" domain={[1, 'auto']} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} dx={-8}
                                           tickFormatter={(val) => {
                                             if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                                             if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                                             if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                                             return `₹${val}`;
                                           }} />
                                    <Tooltip cursor={{ fill: '#f8fafc', opacity: 0.6 }} content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const dataNode = payload[0].payload;
                                        const grandTotal = processedTransactions.reduce((acc, item) => acc + item.amount, 0);
                                        const computedPercentage = grandTotal > 0 ? Math.round((dataNode.value / grandTotal) * 100) : 0;
                                        let renderVal = dataNode.value >= 10000000 ? `${(dataNode.value / 10000000).toFixed(2)} Cr` : dataNode.value >= 100000 ? `${(dataNode.value / 100000).toFixed(2)} Lakh` : `${dataNode.value.toLocaleString('en-IN')}`;
                                        return (
                                            <div style={{ background: '#1e293b', color: '#ffffff', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', fontSize: '13px' }}>
                                              <p style={{ margin: '0 0 6px 0', fontWeight: '600', borderBottom: '1px solid #334155', paddingBottom: '4px', color: '#94a3b8' }}>{dataNode.name} Block</p>
                                              <p style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}>Spent: <span style={{ color: '#38bdf8' }}>₹{renderVal}</span></p>
                                              <p style={{ margin: '4px 0 0 0', color: '#34d399', fontWeight: '600' }}>{computedPercentage}% of Monthly Spend</p>
                                            </div>
                                        );
                                      }
                                      return null;
                                    }} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={45} animationDuration={1000}>
                                      {getChartDataMatrix().map((entry, idx) => (
                                          <Cell key={`cell-${idx}`} fill={`url(#barGradient-${idx})`} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                      )}

                      <div className="dashboard-functional-split-layout">
                        <div className="premium-card-surface functional-panel-large">
                          <div className="panel-header-subsystem"><h3>Recent Activity Log</h3></div>
                          <div className="table-scroll-container">
                            <table className="pristine-matrix-table">
                              <thead>
                              <tr>
                                <th>MERCHANT</th>
                                <th>CATEGORY</th>
                                <th>DATE</th>
                                <th align="right">AMOUNT</th>
                              </tr>
                              </thead>
                              <tbody>
                              {transactions && transactions.length > 0 ? (
                                  [...transactions].reverse().slice(0, 6).map((t, idx) => {
                                    const currentMerchant = t.merchant || t.merchantName || 'Store';
                                    const currentCategory = t.category || 'Food';
                                    const currentAmount = t.amount || 0;
                                    const rawDate = t.transactionDate || t.date || t.createdAt;
                                    const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString();
                                    return (
                                        <tr key={t.id || idx} className="interactive-table-row">
                                          <td className="merchant-identity-cell">
                                            <div className="table-icon-container"><CreditCard size={14} /></div>
                                            <span className="merchant-string-name">{currentMerchant}</span>
                                          </td>
                                          <td><span className={`premium-category-tag tag-type-${currentCategory.toLowerCase()}`}>{currentCategory}</span></td>
                                          <td className="timestamp-data-cell">{formattedDate}</td>
                                          <td align="right" className="value-numerical-cell">₹{currentAmount}</td>
                                        </tr>
                                    );
                                  })
                              ) : (
                                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No Transactions Found</td></tr>
                              )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                )}

                {/* LOG INCOME */}
                {currentView === 'log-income' && (
                    <div className="animate-fade-in-up" style={{ padding: '4px' }}>
                      <header className="viewport-title-header" style={{ marginBottom: '32px' }}>
                        <div className="header-identity-block">
                          <h1>Log Monthly Income</h1>
                          <p className="header-meta-subtitle">Record your income sources every month</p>
                        </div>
                      </header>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
                        <div className="premium-card-surface functional-panel-small" style={{ borderTop: '4px solid #10b981', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04)', padding: '32px', background: '#ffffff', border: '1px solid #f1f5f9' }}>
                          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b', fontWeight: '600' }}>New Inflow Entry</h3>
                          <form onSubmit={handleAddIncome} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Income Amount</label>
                              <input type="number" placeholder="Enter Amount (₹)" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} required style={{ padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', width: '100%', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Source</label>
                              <select value={incomeSource} onChange={(e) => setIncomeSource(e.target.value)} style={{ padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', width: '100%', boxSizing: 'border-box', background: '#ffffff' }}>
                                <option value="Salary">Salary</option>
                                <option value="Freelance">Freelance</option>
                                <option value="Investments">Investments</option>
                                <option value="Others">Others</option>
                              </select>
                            </div>
                            {incomeSource === 'Others' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <label style={{ fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Source Name</label>
                                  <input type="text" placeholder="e.g. Crypto, Gift" value={customSource} onChange={(e) => setCustomSource(e.target.value)} required style={{ padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', width: '100%', boxSizing: 'border-box' }} />
                                </div>
                            )}
                            <button type="submit" style={{ background: '#10b981', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', marginTop: '8px', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>
                              Save Income Flow
                            </button>
                          </form>
                        </div>

                        <div className="premium-card-surface" style={{ borderRadius: '16px', padding: '32px', background: '#ffffff', border: '1px solid #f1f5f9', minHeight: '342px' }}>
                          <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '600' }}>Recent Inflows</h3>
                            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>History of recorded revenues for this period</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                            {incomes.length > 0 ? incomes.map((income, index) => {
                              const displayDate = income.date ? new Date(income.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today';
                              return (
                                  <div key={income.id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#e6f4ea', color: '#137333', fontSize: '14px', fontWeight: 'bold' }}>₹</div>
                                      <div>
                                        <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px', display: 'block' }}>{income.source}</span>
                                        <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500' }}>{displayDate} • Revenue Inflow</span>
                                      </div>
                                    </div>
                                    <span style={{ fontWeight: '700', color: '#10b981', fontSize: '16px' }}>+ ₹{Number(income.amount).toLocaleString('en-IN')}</span>
                                  </div>
                              );
                            }) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: '#94a3b8', gap: '8px' }}>
                                  <span style={{ fontSize: '24px' }}>📥</span>
                                  <span style={{ fontSize: '13px', fontWeight: '500' }}>No income flows recorded yet</span>
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                )}

                {/* LOG EXPENSE */}
                {currentView === 'log-expense' && (
                    <div className="animate-fade-in-up" style={{ padding: '0 20px' }}>
                      <div style={{ marginBottom: '32px' }}>
                        <h1 style={{ fontSize: '32px', color: '#1e293b', margin: '0' }}>Log Quick Expense</h1>
                        <p style={{ color: '#64748b', margin: '8px 0 0 0' }}>Add your daily expenses — food, travel, bills & more to stay on budget</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', borderTop: '6px solid #ef4444' }}>
                          <div style={{ padding: '32px' }}>
                            <h3 style={{ marginBottom: '24px', marginTop: '0' }}>New Outflow Entry</h3>
                            <form onSubmit={handleQuickExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                              <div>
                                <label style={{ fontWeight: '600', fontSize: '12px', color: '#64748b', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>EXPENSE AMOUNT</label>
                                <input type="number" placeholder="Enter Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px' }} />
                              </div>
                              <div>
                                <label style={{ fontWeight: '600', fontSize: '12px', color: '#64748b', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>SELECT CATEGORY</label>
                                <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setShowCustomInput(e.target.value === 'Others'); }} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '16px', color: '#1e293b' }}>
                                  <option value="">Choose a category</option>
                                  {getActiveBudgets().map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                  <option value="Others">Others</option>
                                </select>
                              </div>
                              {showCustomInput && (
                                  <input type="text" placeholder="Custom Category Name" value={customCategoryName} onChange={(e) => setCustomCategoryName(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ef4444', fontSize: '16px' }} />
                              )}
                              <button type="submit" style={{ background: '#ef4444', color: 'white', border: 'none', padding: '16px', borderRadius: '10px', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}>
                                Save Expense Flow
                              </button>
                            </form>
                          </div>
                        </div>

                        <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                          <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ margin: '0' }}>Recent Outflows</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>History of recorded expenditures</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {transactions.slice().reverse().slice(0, 5).map((tx, idx) => {
                              const rawDate = tx.transactionDate || tx.date || tx.createdAt;
                              const displayDate = rawDate && !isNaN(new Date(rawDate)) ? new Date(rawDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today';
                              return (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontWeight: 'bold' }}>₹</div>
                                      <div>
                                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b' }}>{tx.category}</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{displayDate} • Expense Flow</div>
                                      </div>
                                    </div>
                                    <span style={{ fontWeight: '700', color: '#ef4444', fontSize: '15px' }}>- ₹{Number(tx.amount).toLocaleString('en-IN')}</span>
                                  </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                )}

                {/* TRANSACTIONS */}
                {currentView === 'transactions' && (
                    <div className="premium-card-surface full-width-viewport-panel animate-fade-in-up" style={{ borderRadius: '16px', padding: '24px', background: '#ffffff' }}>
                      <header style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>Complete Transaction History ({processedTransactions.length})</h2>
                        <p style={{ color: '#64748b', fontSize: '0.875rem' }}> A complete record of every expense you've logged </p>
                      </header>
                      <div style={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                          <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            {['ID', 'MERCHANT', 'CATEGORY', 'TIMESTAMP', 'VALUE'].map((h, i) => (
                                <th key={h} style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textAlign: i === 4 ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                          </tr>
                          </thead>
                          <tbody>
                          {processedTransactions.map((t, index) => {
                            const rawDate = t.transactionDate || t.date || t.createdAt;
                            const formattedTimeStr = rawDate ? new Date(rawDate).toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'Live Logging Node';
                            return (
                                <tr key={t.id || index} style={{ transition: 'background 0.2s', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>#{index + 1}</td>
                                  <td style={{ padding: '16px', fontWeight: '600', color: '#0f172a', fontSize: '0.925rem', textTransform: 'capitalize' }}>{t.merchant || 'Store'}</td>
                                  <td style={{ padding: '16px' }}>
                              <span style={{ ...getCategoryBadgeStyle(t.category), padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '75px', textAlign: 'center' }}>
                                {t.category || 'Food'}
                              </span>
                                  </td>
                                  <td style={{ padding: '16px', fontSize: '0.875rem', color: '#334155', fontFamily: 'monospace' }}>{formattedTimeStr}</td>
                                  <td align="right" style={{ padding: '16px', fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>₹{t.amount}</td>
                                </tr>
                            );
                          })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                )}

                {/* BUDGETS */}
                {currentView === 'budgets' && (
                    <div className="animate-fade-in-up">
                      <header className="budget-view-header">
                        <div>
                          <h2>Budget Spending Limits</h2>
                          <p className="card-subheading">Set monthly limits per category — get alerted before you overspend</p>
                        </div>
                        <button className={`premium-budget-trigger-btn ${isEditingBudgets ? 'state-save' : 'state-edit'}`} onClick={isEditingBudgets ? saveBudgetLimits : () => { setTempLimits({ ...budgetLimits }); setIsEditingBudgets(true); }}>
                          {isEditingBudgets ? (<><Check size={16} /> <span>Save Allocations</span></>) : (<span>Adjust Limits</span>)}
                        </button>
                      </header>
                      <div className="budget-grid-matrix-layout">
                        {getActiveBudgets().map(cat => {
                          const spent = getCategorySpent(cat);
                          const limit = budgetLimits[cat] || 2000;
                          const percentage = (spent / limit) * 100;
                          const isOverBudget = spent > limit;
                          const isDanger = percentage >= 90;
                          const isWarning = percentage >= 80 && percentage < 90;
                          const isSafe = percentage < 80;

                          return (
                              <div key={cat} className={`premium-budget-card-node ${isOverBudget || isDanger ? 'border-red-alert' : (isWarning ? 'border-yellow-alert' : 'boundary-nominal')}`}>
                                <div className="threshold-card-top-row">
                                  <div className="card-meta-label-block">
                                    <span className={`indicator-glow-dot-premium variant-${cat.toLowerCase()}`}></span>
                                    <h4>{cat} Expenses</h4>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`status-matrix-pill-premium ${isOverBudget || isDanger || isWarning ? 'pill-danger' : 'pill-safe'}`} style={{ color: (isOverBudget || isDanger || isWarning) ? '#ef4444' : '#10b981', fontWeight: '500' }}>
                              {isOverBudget ? 'Alert! High Usage' : (isDanger || isWarning ? 'Danger Zone' : 'Safe Zone')}
                            </span>
                                    <button onClick={() => handleDeleteCategoryBlock(cat)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }} title="Delete Block" onMouseEnter={(e) => e.target.style.background = '#fee2e2'} onMouseLeave={(e) => e.target.style.background = 'none'}>✕</button>
                                  </div>
                                </div>
                                <div className="threshold-numerical-split-block">
                                  <div className="numerical-value-sub-node">
                                    <span className="node-micro-label">TOTAL SPENT</span>
                                    <span className="node-numerical-display">₹{spent}</span>
                                  </div>
                                  <div className="numerical-value-sub-node">
                                    <span className="node-micro-label">YOUR ALLOWANCE</span>
                                    {isEditingBudgets ? (
                                        <input type="number" className="inline-matrix-number-input" value={tempLimits[cat] || ''} onChange={(e) => setTempLimits({ ...tempLimits, [cat]: parseInt(e.target.value) || 0 })} />
                                    ) : (
                                        <span className="node-numerical-display allowance-display">₹{limit}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="premium-progressbar-track">
                                  <div className={`progressbar-fill-node ${isOverBudget || isDanger ? 'fill-danger' : (isWarning ? 'fill-warning' : 'fill-safe')}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                                </div>
                                <div className="threshold-card-bottom-row-calculations">
                                  <span className="ratio-percentage-string">{Math.round(percentage)}% Used</span>
                                  <span className="delta-divergence-value-string" style={{ color: (isOverBudget || isDanger || isWarning) ? '#ef4444' : '#10b981', fontWeight: '500' }}>
                            {isOverBudget ? `Exceeded by ₹${(spent - limit).toFixed(0)}` : `Available: ₹${(limit - spent).toFixed(0)}`}
                          </span>
                                </div>
                              </div>
                          );
                        })}
                      </div>
                    </div>
                )}



                {/* PROFILE */}
                {currentView === 'profile' && (
                    <div className="full-width-viewport-panel animate-fade-in-up">
                      <Profile />
                    </div>
                )}

              </main>
            </>
        )}

        <SmartAlert show={showSmartAlert} message={alertMessage} onConfirm={() => setShowSmartAlert(false)} onCancel={() => setShowSmartAlert(false)} />
      </div>
  );
}

export default App;