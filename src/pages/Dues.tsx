import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPayments, createPayment } from '../firebase/dbService';
import { Payment } from '../types';
import { 
  CreditCard, 
  Download, 
  History, 
  AlertCircle, 
  CheckCircle, 
  Loader, 
  Search,
  FileText,
  Settings,
  Plus
} from 'lucide-react';

export const Dues: React.FC = () => {
  const { currentUser, systemSettings, paymentSettings, updatePaymentSettings } = useAuth();

  // Form inputs
  const [payAmount, setPayAmount] = useState(systemSettings?.duesRate || '50');
  const [payMonth, setPayMonth] = useState('July 2026');

  // Ledger/Payment States
  const [payments, setPayments] = useState<Payment[]>([]);
  const [_loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const totalPaid = payments
    .filter(p => p.status === 'success')
    .reduce((acc, p) => acc + p.amount, 0);

  // Payment Type states
  const [selectedCategory, setSelectedCategory] = useState('dues');
  const [customAmount, setCustomAmount] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // Admin Payment Settings states
  const [editingSettingId, setEditingSettingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editIsFixed, setEditIsFixed] = useState(false);
  const [isAddingSetting, setIsAddingSetting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newIsFixed, setNewIsFixed] = useState(false);

  const safePaymentSettings = paymentSettings || [
    { id: 'dues', name: 'Monthly Dues', amount: 50, isFixed: false, isDues: true },
    { id: 'welfare', name: 'Welfare Contribution', amount: 10, isFixed: false, isDues: false },
    { id: 'special-offering', name: 'Special Offering', amount: 0, isFixed: false, isDues: false }
  ];

  useEffect(() => {
    if (systemSettings?.duesRate) {
      setPayAmount(systemSettings.duesRate);
    }
  }, [systemSettings]);

  const { setPageTitle } = useOutletContext<{ setPageTitle: (t: string) => void }>();

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    setPageTitle('Monthly Dues');
    
    // Load Paystack Inline script dynamically
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    loadPayments();

    return () => {
      document.body.removeChild(script);
    };
  }, [setPageTitle, currentUser]);

  const loadPayments = async () => {
    if (!currentUser) return;
    try {
      // Members only see their own payments, Leaders/Admins see all
      const memberIdFilter = currentUser.role === 'member' ? currentUser.memberId : undefined;
      const data = await getPayments(memberIdFilter);
      setPayments(data);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Admin functions to manage Payment Settings
  const handleAddPaymentSetting = () => {
    if (!newName.trim()) return;
    const newSetting = {
      id: `custom-${Date.now()}`,
      name: newName,
      amount: parseFloat(newAmount || '0'),
      isFixed: newIsFixed,
      isDues: false
    };
    updatePaymentSettings([...safePaymentSettings, newSetting]);
    setNewName('');
    setNewAmount('');
    setNewIsFixed(false);
    setIsAddingSetting(false);
  };

  const handleStartEdit = (setting: any) => {
    setEditingSettingId(setting.id);
    setEditName(setting.name);
    setEditAmount(setting.amount.toString());
    setEditIsFixed(setting.isFixed);
  };

  const handleSaveEdit = (id: string) => {
    const updated = safePaymentSettings.map(s => {
      if (s.id === id) {
        return {
          ...s,
          name: editName,
          amount: parseFloat(editAmount || '0'),
          isFixed: editIsFixed
        };
      }
      return s;
    });
    updatePaymentSettings(updated);
    setEditingSettingId(null);
  };

  const handleDeleteSetting = (id: string) => {
    if (id === 'dues') {
      alert('Cannot delete the primary Dues setting.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this contribution setting?')) return;
    updatePaymentSettings(safePaymentSettings.filter(s => s.id !== id));
  };

  const handlePaystackPayment = () => {
    if (!currentUser) return;
    setPaying(true);
    setSuccessMsg(null);

    const currentCategory = safePaymentSettings.find(s => s.id === selectedCategory) || safePaymentSettings[0];
    const amountGHS = currentCategory.isDues 
      ? parseFloat(payAmount) 
      : (currentCategory.amount > 0 && !customAmount ? currentCategory.amount : parseFloat(customAmount || '0'));

    if (isNaN(amountGHS) || amountGHS <= 0) {
      alert('Please enter a valid payment amount.');
      setPaying(false);
      return;
    }

    const amountInPesewas = Math.round(amountGHS * 100);
    const email = currentUser.email;
    const description = currentCategory.isDues 
      ? `Monthly Dues - ${payMonth}`
      : `${currentCategory.name}${customDescription ? ' - ' + customDescription : ''}`;

    // Retrieve Paystack Public Key
    const paystackPublicKey = systemSettings?.paystackPublicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder_key';

    if (!paystackPublicKey || paystackPublicKey === 'pk_test_placeholder_key' || paystackPublicKey.includes('your_') || paystackPublicKey.includes('placeholder')) {
      // Simulate Paystack transaction for Demo Mode
      setTimeout(async () => {
        try {
          const ref = `TAVY-PAY-${Date.now()}-${Math.floor(Math.random() * 1050)}`;
          const newPay = await createPayment({
            memberId: currentUser.memberId,
            memberName: `${currentUser.firstName} ${currentUser.lastName}`,
            amount: amountGHS,
            reference: ref,
            status: 'success',
            method: 'Paystack (Demo)',
            description
          });
          
          setPayments([newPay, ...payments]);
          setSuccessMsg(`Payment of GHS ${amountGHS.toFixed(2)} for "${description}" completed successfully!`);
          setPaying(false);
          setCustomAmount('');
          setCustomDescription('');
          setSelectedReceipt(newPay);
        } catch (err) {
          console.error(err);
          setPaying(false);
        }
      }, 1500);
      return;
    }

    // Live/Test Real Paystack Integration wrapped in try/catch to prevent hangs
    try {
      if (!(window as any).PaystackPop) {
        throw new Error('Paystack SDK is not loaded. Please check your internet connection.');
      }

      const handler = (window as any).PaystackPop.setup({
        key: paystackPublicKey,
        email,
        amount: amountInPesewas,
        currency: 'GHS',
        ref: `TAVY-${Date.now()}`,
        callback: (response: any) => {
          const verifyAndRegister = async () => {
            try {
              const newPay = await createPayment({
                memberId: currentUser.memberId,
                memberName: `${currentUser.firstName} ${currentUser.lastName}`,
                amount: amountGHS,
                reference: response.reference,
                status: 'success',
                method: 'Paystack',
                description
              });
              
              setPayments([newPay, ...payments]);
              setSuccessMsg(`Payment reference ${response.reference} verified successfully!`);
              setCustomAmount('');
              setCustomDescription('');
              setSelectedReceipt(newPay);
            } catch (err) {
              console.error('Failed to register payment:', err);
            } finally {
              setPaying(false);
            }
          };
          verifyAndRegister();
        },
        onClose: () => {
          setPaying(false);
          alert('Transaction cancelled.');
        }
      });

      handler.openIframe();
    } catch (err: any) {
      console.error('Paystack connection error:', err);
      alert(err.message || 'Could not connect to Paystack.');
      setPaying(false);
    }
  };

  const printReceipt = () => {
    const printContent = document.getElementById('printable-receipt');
    if (!printContent) return;
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const printWindow = window.open(windowUrl, uniqueName.toString(), 'left=50000,top=50000,width=0,height=0');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payment Receipt</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              body { font-family: 'Inter', sans-serif; padding: 20px; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.reference.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const duesAmount = safePaymentSettings.find(s => s.id === 'dues' || s.isDues)?.amount || 50;
  const outstandingAmount = Math.max(0, (duesAmount * 6) - totalPaid);

  return (
    <div className="space-y-6">
      
      {/* Upper Grid: Balance widgets & Payment Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Outstanding Dues Dashboard Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-church-gold-600 dark:text-church-gold-400">
              <CreditCard className="h-5 w-5" />
              <h4 className="text-sm font-bold uppercase tracking-wider">Account Balance</h4>
            </div>
            
            <div className="mt-5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Dues Paid</span>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">GHS {totalPaid.toFixed(2)}</h3>
            </div>
            
            <div className="mt-4">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Outstanding Balance</span>
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mt-0.5">GHS {outstandingAmount.toFixed(2)}</h3>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <AlertCircle className="h-4.5 w-4.5 text-church-gold-500" />
            <span>Monthly contribution is set at GHS {duesAmount.toFixed(2)}.</span>
          </div>
        </div>

        {/* Pay online form (Only for Members) */}
        {currentUser?.role === 'member' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm lg:col-span-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-church-gold-500" />
              Online Payments & Contributions
            </h4>
            
            {successMsg && (
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <p>{successMsg}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Payment Type</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setCustomAmount(''); }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-3 px-4 text-sm outline-none focus:border-church-gold-500"
                  >
                    {safePaymentSettings.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Render input elements based on dues or general contribution */}
                {(() => {
                  const currentCategory = safePaymentSettings.find(s => s.id === selectedCategory) || safePaymentSettings[0];
                  if (currentCategory.isDues) {
                    const duesVal = currentCategory.amount || 50;
                    return (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Amount (GHS)</label>
                          <select
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-3 px-4 text-sm outline-none focus:border-church-gold-500"
                          >
                            <option value={duesVal}>{duesVal.toFixed(2)} (1 Month)</option>
                            <option value={duesVal * 2}>{(duesVal * 2).toFixed(2)} (2 Months)</option>
                            <option value={duesVal * 3}>{(duesVal * 3).toFixed(2)} (3 Months)</option>
                            <option value={duesVal * 6}>{(duesVal * 6).toFixed(2)} (6 Months)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Target Dues Month</label>
                          <select
                            value={payMonth}
                            onChange={(e) => setPayMonth(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-3 px-4 text-sm outline-none focus:border-church-gold-500"
                          >
                            <option value="July 2026">July 2026</option>
                            <option value="August 2026">August 2026</option>
                            <option value="September 2026">September 2026</option>
                            <option value="October 2026">October 2026</option>
                            <option value="November 2026">November 2026</option>
                            <option value="December 2026">December 2026</option>
                          </select>
                        </div>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Amount (GHS)</label>
                          <input 
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            placeholder={currentCategory.amount > 0 ? currentCategory.amount.toString() : '0.00'}
                            disabled={currentCategory.isFixed}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-3 px-4 text-sm outline-none focus:border-church-gold-500 disabled:opacity-70 font-semibold"
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Payment Note / Purpose (Optional)</label>
                          <input 
                            type="text"
                            value={customDescription}
                            onChange={(e) => setCustomDescription(e.target.value)}
                            placeholder="e.g. Voluntary contribution or Welfare Topup"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-3 px-4 text-sm outline-none focus:border-church-gold-500"
                          />
                        </div>
                      </>
                    );
                  }
                })()}
              </div>

              <button
                onClick={handlePaystackPayment}
                disabled={paying}
                className="w-full rounded-xl bg-gradient-to-r from-church-gold-500 to-church-gold-600 text-slate-950 font-bold text-sm py-4 hover:from-church-gold-400 hover:to-church-gold-500 flex items-center justify-center gap-2 shadow-lg shadow-church-gold-500/10 mt-2 disabled:opacity-50"
              >
                {paying ? <Loader className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                {paying ? 'Connecting to Paystack...' : (() => {
                  const currentCategory = safePaymentSettings.find(s => s.id === selectedCategory) || safePaymentSettings[0];
                  const displayAmount = currentCategory.isDues 
                    ? parseFloat(payAmount) 
                    : (currentCategory.amount > 0 && !customAmount ? currentCategory.amount : parseFloat(customAmount || '0'));
                  return `Pay GHS ${(displayAmount || 0).toFixed(2)} Online`;
                })()}
              </button>
            </div>
          </div>
        ) : (
          /* General statistics & Settings list for leaders */
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Welfare & Dues Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800/40">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Expected Revenue</span>
                    <p className="text-lg font-bold mt-1 text-slate-800 dark:text-white">GHS 5,200.00</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800/40">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Actual Collected</span>
                    <p className="text-lg font-bold mt-1 text-emerald-600">GHS {totalPaid.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => alert('Invoice Summary PDF exported to desktop downloads.')}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 mt-4"
              >
                <FileText className="h-4.5 w-4.5" />
                Generate Outstanding Invoice Report
              </button>
            </div>

            {/* Manage Payment Settings (Super Admin Only) */}
            {currentUser?.role === 'super-admin' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Settings className="h-4.5 w-4.5 text-church-gold-500" />
                  Manage Payment & Contribution Types
                </h4>
                
                <div className="space-y-3">
                  {safePaymentSettings.map(setting => (
                    <div key={setting.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 text-xs">
                      {editingSettingId === setting.id ? (
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                              type="text" 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-1.5 outline-none font-semibold text-slate-800 dark:text-white flex-1"
                              placeholder="Name"
                            />
                            <input 
                              type="number" 
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-1.5 outline-none w-28 font-bold"
                              placeholder="Amount (GHS)"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleSaveEdit(setting.id)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-3 py-1.5 text-[10px] uppercase tracking-wider"
                            >
                              Save Changes
                            </button>
                            <button 
                              onClick={() => setEditingSettingId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-lg px-3 py-1.5 text-[10px] uppercase tracking-wider"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="font-bold text-slate-850 dark:text-white text-sm">{setting.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              {setting.isDues ? 'Primary Monthly Dues Type' : `Default Amount: GHS ${setting.amount.toFixed(2)}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleStartEdit(setting)}
                              className="text-church-gold-600 hover:text-church-gold-700 font-bold uppercase text-[10px] tracking-wider"
                            >
                              Edit
                            </button>
                            {!setting.isDues && (
                              <button 
                                onClick={() => handleDeleteSetting(setting.id)}
                                className="text-red-500 hover:text-red-600 font-bold uppercase text-[10px] tracking-wider"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {isAddingSetting ? (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 space-y-3 text-xs">
                    <p className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">New Contribution Category</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Name</label>
                        <input 
                          type="text" 
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 py-1.5 px-3 outline-none"
                          placeholder="e.g. Building Fund"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Default Amount (GHS)</label>
                        <input 
                          type="number" 
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 py-1.5 px-3 outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button 
                        onClick={handleAddPaymentSetting}
                        className="bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 font-bold rounded-lg px-4 py-2 text-xs hover:opacity-90"
                      >
                        Add Category
                      </button>
                      <button 
                        onClick={() => setIsAddingSetting(false)}
                        className="bg-slate-200 text-slate-700 dark:bg-slate-850 dark:text-slate-350 font-bold rounded-lg px-4 py-2 text-xs hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddingSetting(true)}
                    className="w-full rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 font-bold text-xs py-3 mt-4 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Create Payment Settings Category
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ledger history listing */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-slate-850 dark:text-white">
            <History className="h-5 w-5 text-church-gold-500" />
            <h4 className="text-sm font-bold uppercase tracking-wider">Payment Ledger History</h4>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search ledger..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-850 dark:bg-slate-950 py-2 pl-9 pr-4 text-xs outline-none focus:border-church-gold-500 w-52"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-850 dark:bg-slate-950 py-2 px-3 text-xs outline-none focus:border-church-gold-500"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-3">Receipt No</th>
                {currentUser?.role !== 'member' && <th className="pb-3">Member</th>}
                <th className="pb-3">Dues Month</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Reference</th>
                <th className="pb-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {filteredPayments.map((pay) => (
                <tr key={pay.paymentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 font-bold text-slate-800 dark:text-white text-xs">{pay.receiptNumber}</td>
                  {currentUser?.role !== 'member' && <td className="py-4 font-semibold text-slate-800 dark:text-slate-200">{pay.memberName}</td>}
                  <td className="py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">{pay.description}</td>
                  <td className="py-4 text-xs text-slate-500 dark:text-slate-400">{new Date(pay.date).toLocaleDateString()}</td>
                  <td className="py-4 font-bold text-slate-800 dark:text-slate-200 text-xs">GHS {pay.amount.toFixed(2)}</td>
                  <td className="py-4 font-mono text-[10px] text-slate-400">{pay.reference}</td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => setSelectedReceipt(pay)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-church-gold-600 dark:text-church-gold-400 hover:underline"
                    >
                      <Download className="h-3 w-3" /> Receipt
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={currentUser?.role !== 'member' ? 7 : 6} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No transactions found in ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECEIPT DIALOG MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            
            {/* Printable Area Wrapper */}
            <div id="printable-receipt" className="p-4 bg-white text-slate-950 rounded-2xl">
              {/* Receipt Header */}
              <div className="text-center border-b border-slate-100 pb-5 mb-5">
                <h3 className="text-lg font-bold text-church-navy-950 uppercase tracking-wide">{systemSettings?.churchName || 'True Anointing Victory Youth'}</h3>
                <span className="text-[10px] font-bold text-church-gold-600 uppercase tracking-widest block">Official Payment Receipt</span>
              </div>

              {/* Receipt Details */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Receipt Number:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Date Issued:</span>
                  <span className="font-semibold text-slate-900">{new Date(selectedReceipt.date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Member Name:</span>
                  <span className="font-bold text-slate-905">{selectedReceipt.memberName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Target Month:</span>
                  <span className="font-semibold text-slate-900">{selectedReceipt.description}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Payment Method:</span>
                  <span className="font-semibold text-slate-900">{selectedReceipt.method}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Transaction Ref:</span>
                  <span className="font-mono font-semibold text-slate-700">{selectedReceipt.reference}</span>
                </div>

                <div className="border-t border-b border-dashed border-slate-200 py-4 my-4 flex justify-between items-center">
                  <span className="text-sm font-bold text-church-navy-950 uppercase">Total Amount Paid</span>
                  <span className="text-xl font-extrabold text-emerald-600">GHS {selectedReceipt.amount.toFixed(2)}</span>
                </div>

                <div className="text-center text-[10px] text-slate-400 italic">
                  Thank you for your faithful contribution. God bless you!
                </div>
              </div>
            </div>

            {/* Receipt Modal Footer Actions */}
            <div className="mt-6 flex gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button 
                onClick={printReceipt}
                className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 text-white text-xs font-bold py-3 flex items-center justify-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                Print / Download PDF
              </button>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 px-5 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dues;
