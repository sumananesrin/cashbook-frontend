import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, DollarSign, Calendar, TrendingUp, TrendingDown, Trash2 } from 'lucide-react'
import { cashbookApi, summaryApi } from '../api/client'

export default function DashboardPage() {
    const navigate = useNavigate()
    const [cashbooks, setCashbooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [formData, setFormData] = useState({ name: '', description: '' })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    // Load cashbooks with their summary data
    useEffect(() => {
        loadCashbooks()
    }, [])

    const loadCashbooks = async () => {
        try {
            setLoading(true)
            const response = await cashbookApi.list()
            const books = response.data.results || response.data || []

            // Fetch summary for each cashbook
            const booksWithSummary = await Promise.all(
                books.map(async (book) => {
                    try {
                        const summaryRes = await summaryApi.get(book.id)
                        return {
                            ...book,
                            summary: summaryRes.data
                        }
                    } catch (err) {
                        console.error(`Failed to load summary for book ${book.id}:`, err)
                        return {
                            ...book,
                            summary: { total_in: 0, total_out: 0, net_balance: 0 }
                        }
                    }
                })
            )

            setCashbooks(booksWithSummary)
        } catch (err) {
            console.error('Failed to load cashbooks:', err)
            setError('Failed to load cashbooks. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCashbook = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            setError('Cashbook name is required')
            return
        }

        setSaving(true)
        setError(null)

        try {
            await cashbookApi.create({
                name: formData.name,
                description: formData.description || '',
                is_default: cashbooks.length === 0 // First book is default
            })

            // Refresh list
            await loadCashbooks()

            // Close modal and reset form
            setModalOpen(false)
            setFormData({ name: '', description: '' })
        } catch (err) {
            console.error('Failed to create cashbook:', err)
            setError('Failed to create cashbook. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handleCashbookClick = (cashbookId) => {
        // Navigate to transactions page with cashbook ID
        navigate(`/transactions?cashbook=${cashbookId}`)
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const handleDeleteCashbook = async (e, bookId) => {
        e.stopPropagation()

        if (!window.confirm('Are you sure you want to delete this cashbook? This action cannot be undone.')) {
            return
        }

        try {
            setLoading(true)
            await cashbookApi.delete(bookId)
            await loadCashbooks()
        } catch (err) {
            console.error('Failed to delete cashbook:', err)
            setError('Failed to delete cashbook. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="content-area" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ color: '#6b7280', fontSize: '16px' }}>Loading your cashbooks...</div>
            </div>
        )
    }

    return (
        <div className="content-area">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-text">
                    <h1>My Cashbooks</h1>
                    <p>Select a cashbook to view transactions and manage your finances</p>
                </div>
                <button
                    className="btn btn-primary create-book-btn"
                    onClick={() => setModalOpen(true)}
                >
                    <Plus size={18} />
                    <span className="btn-text">Create New Book</span>
                </button>
            </div>

            {/* Empty State */}
            {cashbooks.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <BookOpen size={40} />
                    </div>
                    <h2>No Cashbooks Yet</h2>
                    <p>Create your first cashbook to start tracking your cash flow and managing transactions.</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => setModalOpen(true)}
                    >
                        <Plus size={18} />
                        Create Your First Cashbook
                    </button>
                </div>
            ) : (
                /* Cashbooks Table/List */
                <div className="cashbooks-container">
                    <div className="cashbooks-table">
                        {/* Table Header - Desktop Only */}
                        <div className="table-header">
                            <div className="col-book-name">Book Name</div>
                            <div className="col-balance">Net Balance</div>
                            <div className="col-date">Last Updated</div>
                            <div className="col-actions"></div>
                        </div>

                        {/* Table Rows */}
                        <div className="table-body">
                            {cashbooks.map((book) => (
                                <div
                                    key={book.id}
                                    className="table-row"
                                    onClick={() => handleCashbookClick(book.id)}
                                >
                                    {/* Book Name Column */}
                                    <div className="col-book-name">
                                        <div className="book-name-wrapper">
                                            <BookOpen className="book-icon" size={20} />
                                            <div className="book-info">
                                                <div className="book-name">
                                                    {book.name}
                                                    {book.is_default && (
                                                        <span className="default-badge">Default</span>
                                                    )}
                                                </div>
                                                {book.description && (
                                                    <div className="book-description">{book.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Balance Column */}
                                    <div className="col-balance">
                                        <div className={`balance-amount ${(book.summary?.net_balance || 0) >= 0 ? 'positive' : 'negative'}`}>
                                            ${(book.summary?.net_balance || 0).toFixed(2)}
                                        </div>
                                        <div className="balance-details">
                                            <span className="cash-in">
                                                <TrendingUp size={12} />
                                                ${(book.summary?.total_in || 0).toFixed(2)}
                                            </span>
                                            <span className="cash-out">
                                                <TrendingDown size={12} />
                                                ${(book.summary?.total_out || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Date Column */}
                                    <div className="col-date">
                                        <Calendar size={14} />
                                        {formatDate(book.created_at || new Date())}
                                    </div>
                                    <div className="col-actions">
                                        <button
                                            className="btn-icon-danger"
                                            onClick={(e) => handleDeleteCashbook(e, book.id)}
                                            title="Delete Cashbook"
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                padding: '8px',
                                                color: '#ef4444',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '6px',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Cashbook Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create New Cashbook</h2>
                            <button className="modal-close" onClick={() => setModalOpen(false)}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreateCashbook}>
                            <div className="modal-body">
                                {error && (
                                    <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Cashbook Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Main Store, Online Sales"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description (Optional)</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Add a brief description..."
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModalOpen(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? 'Creating...' : 'Create Cashbook'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
