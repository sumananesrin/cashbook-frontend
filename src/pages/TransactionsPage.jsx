import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Plus,
    Minus,
    FileBarChart,
    Search,
    Calendar,
    Users,
    Filter,
    FileText,
    Layers,
    ChevronLeft,
    ChevronRight,
    Tag,
    CreditCard
} from 'lucide-react'
import {
    transactionApi,
    summaryApi,
    cashbookApi,
    categoryApi,
    partyApi,
    paymentModeApi,
    memberApi
} from '../api/client'
import TransactionModal from '../components/TransactionModal'

export default function TransactionsPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    // Data State
    const [transactions, setTransactions] = useState([])
    const [summary, setSummary] = useState({ total_in: 0, total_out: 0, net_balance: 0 })
    const [cashbooks, setCashbooks] = useState([])
    const [selectedCashbook, setSelectedCashbook] = useState(null)
    const [userRole, setUserRole] = useState(null)

    // Filter Data State
    const [categories, setCategories] = useState([])
    const [parties, setParties] = useState([])
    const [members, setMembers] = useState([])
    const [paymentModes, setPaymentModes] = useState([])

    // UI State
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalType, setModalType] = useState('in')

    // Pagination State
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 15, // Default explicit page size if needed, mainly for calc
        totalCount: 0
    })

    // Filters State
    const [filters, setFilters] = useState({
        type: '',
        category: '',
        party: '',
        member: '',
        payment_mode: '',
        duration: 'ALL_TIME',
        search: ''
    })

    // Debounced Search State
    const [debouncedSearch, setDebouncedSearch] = useState('')

    useEffect(() => {
        loadCashbooks()
        loadFilterData()
    }, [])

    // specific useEffect for debouncing search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(filters.search)
        }, 300)

        return () => {
            clearTimeout(handler)
        }
    }, [filters.search])

    useEffect(() => {
        if (selectedCashbook) {
            // Reset page to 1 when filters change (except page change itself)
            // But we can't easily distinguish here. 
            // Better to have a separate effect? 
            // For simplicity, we trigger load on dependencies.
            // We'll reset page in handleFilterChange.
            loadTransactions()
            loadSummary()
            loadUserRole()
        }
    }, [selectedCashbook, debouncedSearch, filters.type, filters.category, filters.party, filters.member, filters.payment_mode, filters.duration, pagination.page])

    const loadCashbooks = async () => {
        try {
            // Get cashbook ID from URL parameter
            const cashbookIdFromUrl = searchParams.get('cashbook')

            const response = await cashbookApi.list()
            const books = response.data.results || response.data
            setCashbooks(books)

            if (cashbookIdFromUrl) {
                // Verify the cashbook exists and user has access
                const bookExists = books.find(b => b.id === cashbookIdFromUrl)
                if (bookExists) {
                    setSelectedCashbook(cashbookIdFromUrl)
                } else {
                    // Cashbook not found or no access, redirect to dashboard
                    navigate('/dashboard')
                }
            } else {
                // No cashbook selected, redirect to dashboard
                navigate('/dashboard')
            }
        } catch (error) {
            console.error('Failed to load cashbooks:', error)
            navigate('/dashboard')
        } finally {
            setLoading(false)
        }
    }

    const loadUserRole = async () => {
        if (!selectedCashbook) return
        try {
            const response = await cashbookApi.getUserRole(selectedCashbook)
            setUserRole(response.data)
        } catch (error) {
            console.error('Failed to load user role:', error)
        }
    }

    const loadFilterData = async () => {
        try {
            const [catRes, partyRes, modeRes, memRes] = await Promise.all([
                categoryApi.list(),
                partyApi.list(),
                paymentModeApi.list(),
                memberApi.list()
            ])
            setCategories(catRes.data.results || catRes.data || [])
            setParties(partyRes.data.results || partyRes.data || [])
            setPaymentModes(modeRes.data.results || modeRes.data || [])
            setMembers(memRes.data.results || memRes.data || [])
        } catch (error) {
            console.error('Failed to load filter data:', error)
        }
    }

    const loadTransactions = async () => {
        if (!selectedCashbook) return

        try {
            const params = {
                cashbook: selectedCashbook,
                page: pagination.page,
                ...filters,
                search: debouncedSearch // Use debounced value
            }

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null) delete params[key]
            })

            const response = await transactionApi.list(params)

            // Handle DRF pagination response structure
            if (response.data.results) {
                setTransactions(response.data.results)
                setPagination(prev => ({
                    ...prev,
                    totalCount: response.data.count || 0
                }))
            } else {
                // Fallback for non-paginated response
                setTransactions(response.data)
                setPagination(prev => ({
                    ...prev,
                    totalCount: response.data.length
                }))
            }
        } catch (error) {
            console.error('Failed to load transactions:', error)
        }
    }

    const loadSummary = async () => {
        if (!selectedCashbook) return

        try {
            const params = {
                ...filters,
                search: debouncedSearch
            }
            // Remove empty
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null) delete params[key]
            })

            const response = await summaryApi.get(selectedCashbook, params)
            setSummary(response.data)
        } catch (error) {
            console.error('Failed to load summary:', error)
        }
    }

    const handleFilterChange = (e) => {
        const { name, value } = e.target
        setFilters(prev => ({
            ...prev,
            [name]: value
        }))
        // Reset to page 1 for any filter change
        setPagination(prev => ({ ...prev, page: 1 }))
    }

    const handleCashbookChange = (e) => {
        const bookId = e.target.value
        setSelectedCashbook(bookId)
        setPagination(prev => ({ ...prev, page: 1 })) // Reset page
    }

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= Math.ceil(pagination.totalCount / pagination.pageSize)) {
            setPagination(prev => ({ ...prev, page: newPage }))
        }
    }

    const openCashInModal = () => {
        setModalType('in')
        setModalOpen(true)
    }

    const openCashOutModal = () => {
        setModalType('out')
        setModalOpen(true)
    }

    const handleTransactionSuccess = () => {
        loadTransactions()
        loadSummary()
    }

    if (loading) {
        return (
            <div className="content-area" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ color: '#6b7280' }}>Loading...</div>
            </div>
        )
    }

    const canCreate = userRole?.can_create !== false
    const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize)

    return (
        <div className="content-area">
            {/* Header Section: Cashbook Selector & Actions */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ minWidth: '250px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 500 }}>
                        SELECT CASHBOOK
                    </label>
                    <div className="filter-group" style={{ margin: 0 }}>
                        <select
                            className="filter-select"
                            style={{
                                width: '100%',
                                padding: '10px',
                                fontSize: '16px',
                                fontWeight: 600,
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                backgroundColor: '#f9fafb'
                            }}
                            value={selectedCashbook || ''}
                            onChange={handleCashbookChange}
                        >
                            {cashbooks.map(book => (
                                <option key={book.id} value={book.id}>{book.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn" style={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <FileText size={16} />
                        <span className="hidden-mobile">Reports</span>
                    </button>
                    <button className="btn" style={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <Layers size={16} />
                        <span className="hidden-mobile">Bulk Entries</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-section">
                <div className="summary-card">
                    <div className="summary-card-icon success">
                        <TrendingUp size={24} />
                    </div>
                    <div className="summary-card-content">
                        <div className="summary-card-label">Total Cash In</div>
                        <div className="summary-card-amount">${summary.total_in?.toFixed(2) || '0.00'}</div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-card-icon danger">
                        <TrendingDown size={24} />
                    </div>
                    <div className="summary-card-content">
                        <div className="summary-card-label">Total Cash Out</div>
                        <div className="summary-card-amount">${summary.total_out?.toFixed(2) || '0.00'}</div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-card-icon primary">
                        <Wallet size={24} />
                    </div>
                    <div className="summary-card-content">
                        <div className="summary-card-label">Net Balance</div>
                        <div className="summary-card-amount" style={{
                            color: (summary.net_balance || 0) < 0 ? '#ef4444' : '#10b981'
                        }}>
                            ${summary.net_balance?.toFixed(2) || '0.00'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {canCreate && (
                <div className="action-bar">
                    <button className="btn btn-success" onClick={openCashInModal}>
                        <Plus size={18} />
                        Cash In
                    </button>
                    <button className="btn btn-danger" onClick={openCashOutModal}>
                        <Minus size={18} />
                        Cash Out
                    </button>
                </div>
            )}

            {/* Inline Responsive Filter Bar */}
            <div className="filters-section" style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    {/* Duration Filter */}
                    <div className="filter-group" style={{ flex: '1 1 140px', margin: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                            <select
                                name="duration"
                                className="filter-select"
                                style={{ paddingLeft: '38px', width: '100%' }}
                                value={filters.duration}
                                onChange={handleFilterChange}
                            >
                                <option value="ALL_TIME">All Time</option>
                                <option value="TODAY">Today</option>
                                <option value="LAST_7_DAYS">Last 7 Days</option>
                                <option value="LAST_30_DAYS">Last 30 Days</option>
                                <option value="THIS_MONTH">This Month</option>
                            </select>
                        </div>
                    </div>

                    {/* Transaction Type */}
                    <div className="filter-group" style={{ flex: '1 1 120px', margin: 0 }}>
                        <select
                            name="type"
                            className="filter-select"
                            style={{ width: '100%' }}
                            value={filters.type}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Types</option>
                            <option value="IN">Cash In</option>
                            <option value="OUT">Cash Out</option>
                        </select>
                    </div>

                    {/* Member Filter */}
                    <div className="filter-group" style={{ flex: '1 1 140px', margin: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Users size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                            <select
                                name="member"
                                className="filter-select"
                                style={{ paddingLeft: '38px', width: '100%' }}
                                value={filters.member}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Members</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="filter-group" style={{ flex: '1 1 140px', margin: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Tag size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                            <select
                                name="category"
                                className="filter-select"
                                style={{ paddingLeft: '38px', width: '100%' }}
                                value={filters.category}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Payment Mode */}
                    <div className="filter-group" style={{ flex: '1 1 140px', margin: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <CreditCard size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                            <select
                                name="payment_mode"
                                className="filter-select"
                                style={{ paddingLeft: '38px', width: '100%' }}
                                value={filters.payment_mode}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Modes</option>
                                {paymentModes.map(mode => (
                                    <option key={mode.id} value={mode.id}>{mode.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="filter-group" style={{ flex: '2 1 200px', margin: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                name="search"
                                className="filter-input"
                                placeholder="Search amount, remark..."
                                style={{ paddingLeft: '38px', width: '100%' }}
                                value={filters.search}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Details</th>
                            <th>Category</th>
                            <th>Mode</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                            <th style={{ textAlign: 'right' }}>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="table-empty" style={{ padding: '48px 0' }}>
                                        <div style={{
                                            width: '64px',
                                            height: '64px',
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 16px'
                                        }}>
                                            <FileBarChart size={32} color="#9ca3af" />
                                        </div>
                                        <div className="table-empty-title">No transactions found</div>
                                        <div className="table-empty-text" style={{ maxWidth: '400px', margin: '8px auto' }}>
                                            {pagination.totalCount === 0 && filters.duration === 'ALL_TIME' && !filters.search
                                                ? "Start tracking your cash flow by adding your first transaction."
                                                : "Try adjusting your filters to find what you're looking for."}
                                        </div>
                                        {canCreate && pagination.totalCount === 0 && filters.duration === 'ALL_TIME' && !filters.search && (
                                            <button className="btn btn-primary" onClick={openCashInModal} style={{ marginTop: '16px' }}>
                                                <Plus size={16} />
                                                Add First Entry
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            transactions.map((txn) => (
                                <tr key={txn.id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{new Date(txn.transaction_date).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            {txn.transaction_time}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="transaction-details">
                                            <div className="transaction-party" style={{ fontWeight: 500 }}>
                                                {txn.party_name || txn.member_name || '—'}
                                            </div>
                                            <div className="transaction-remark" style={{ fontSize: '12px', color: '#6b7280' }}>
                                                {txn.remark || '—'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            backgroundColor: '#f3f4f6',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}>
                                            {txn.category_name || '—'}
                                        </span>
                                    </td>
                                    <td>{txn.payment_mode_name || '—'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className={txn.type === 'IN' ? 'amount-in' : 'amount-out'} style={{ fontWeight: 600 }}>
                                            {txn.type === 'IN' ? '+' : '-'}${Number(txn.amount).toFixed(2)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                        <span style={{ color: (txn.running_balance || 0) < 0 ? '#ef4444' : 'inherit' }}>
                                            ${txn.running_balance ? Number(txn.running_balance).toFixed(2) : '—'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Real Pagination */}
                {pagination.totalCount > 0 && (
                    <div className="pagination">
                        <div className="pagination-info">
                            Showing <span style={{ fontWeight: 600 }}>
                                {((pagination.page - 1) * pagination.pageSize) + 1}
                            </span> to <span style={{ fontWeight: 600 }}>
                                {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}
                            </span> of <span style={{ fontWeight: 600 }}>
                                {pagination.totalCount}
                            </span> entries
                        </div>
                        <div className="pagination-controls">
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === 1}
                                onClick={() => handlePageChange(pagination.page - 1)}
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>
                            <div style={{ margin: '0 12px', fontWeight: 500 }}>
                                Page {pagination.page}
                            </div>
                            <button
                                className="pagination-btn"
                                disabled={pagination.page >= totalPages}
                                onClick={() => handlePageChange(pagination.page + 1)}
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction Modal */}
            <TransactionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                type={modalType}
                cashbookId={selectedCashbook}
                businessId={cashbooks.find(cb => cb.id === selectedCashbook)?.business}
                onSuccess={handleTransactionSuccess}
            />
        </div>
    )
}
