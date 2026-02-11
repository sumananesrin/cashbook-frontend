import { useState, useEffect } from 'react'
import { Plus, Check, X } from 'lucide-react'
import { categoryApi, partyApi, paymentModeApi, transactionApi } from '../api/client'
import './TransactionModal.css'

export default function TransactionModal({ isOpen, onClose, type, cashbookId, businessId, onSuccess }) {
    const [formData, setFormData] = useState({
        amount: '',
        category: '',
        party: '',
        payment_mode: '',
        remark: ''
    })
    const [categories, setCategories] = useState([])
    const [parties, setParties] = useState([])
    const [paymentModes, setPaymentModes] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Inline Add State
    const [addingCategory, setAddingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [addingParty, setAddingParty] = useState(false)
    const [newPartyName, setNewPartyName] = useState('')
    const [inlineLoading, setInlineLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadDropdownData()
            resetForm()
        }
    }, [isOpen])

    const loadDropdownData = async () => {
        try {
            const [categoriesRes, partiesRes, modesRes] = await Promise.all([
                categoryApi.list(),
                partyApi.list(),
                paymentModeApi.list()
            ])
            setCategories(categoriesRes.data.results || categoriesRes.data || [])
            setParties(partiesRes.data.results || partiesRes.data || [])

            const modes = modesRes.data.results || modesRes.data || []
            setPaymentModes(modes)

            // Ensure Cash and Online exist
            if (businessId) {
                ensurePaymentModes(modes)
            }
        } catch (err) {
            console.error('Failed to load dropdown data:', err)
        }
    }

    const ensurePaymentModes = async (existingModes) => {
        const requiredModes = ['Cash', 'Online']
        const newModes = [...existingModes]
        let changed = false

        for (const modeName of requiredModes) {
            const exists = newModes.find(m => m.name.toLowerCase() === modeName.toLowerCase())
            if (!exists) {
                try {
                    const res = await paymentModeApi.create({ name: modeName, business: businessId })
                    newModes.push(res.data)
                    changed = true
                } catch (err) {
                    console.error(`Failed to create payment mode ${modeName}:`, err)
                }
            }
        }

        if (changed) {
            setPaymentModes(newModes)
        }
    }

    const handleAddCategory = async () => {
        if (!newCategoryName.trim() || !businessId) return
        setInlineLoading(true)
        try {
            const res = await categoryApi.create({
                name: newCategoryName,
                business: businessId,
                type: 'BOTH' // Default to BOTH for simplicity
            })
            const newCat = res.data
            setCategories(prev => [...prev, newCat])
            setFormData(prev => ({ ...prev, category: newCat.id }))
            setAddingCategory(false)
            setNewCategoryName('')
        } catch (err) {
            console.error('Failed to add category:', err)
            setError('Failed to add category')
        } finally {
            setInlineLoading(false)
        }
    }

    const handleAddParty = async () => {
        if (!newPartyName.trim() || !businessId) return
        setInlineLoading(true)
        try {
            const res = await partyApi.create({
                name: newPartyName,
                business: businessId
            })
            const newParty = res.data
            setParties(prev => [...prev, newParty])
            setFormData(prev => ({ ...prev, party: newParty.id }))
            setAddingParty(false)
            setNewPartyName('')
        } catch (err) {
            console.error('Failed to add party:', err)
            setError('Failed to add party')
        } finally {
            setInlineLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            amount: '',
            category: '',
            party: '',
            payment_mode: '',
            remark: ''
        })
        setError(null)
        setAddingCategory(false)
        setAddingParty(false)
        setNewCategoryName('')
        setNewPartyName('')
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Validate
            if (!formData.amount || parseFloat(formData.amount) <= 0) {
                setError('Amount must be greater than 0')
                setLoading(false)
                return
            }
            if (!formData.category) {
                setError('Category is required')
                setLoading(false)
                return
            }
            if (!formData.payment_mode) {
                setError('Payment mode is required')
                setLoading(false)
                return
            }

            // Create transaction
            const payload = {
                cashbook: cashbookId,
                type: type === 'in' ? 'IN' : 'OUT',
                amount: parseFloat(formData.amount),
                category: formData.category,
                payment_mode: formData.payment_mode,
                party: formData.party || null,
                remark: formData.remark || ''
            }

            await transactionApi.create(payload)

            // Success!
            if (onSuccess) {
                onSuccess()
            }
            onClose()
            resetForm()
        } catch (err) {
            console.error('Transaction creation failed:', err)
            if (err.response?.data) {
                // Display backend validation errors
                const errors = err.response.data
                if (typeof errors === 'object') {
                    const errorMsg = Object.entries(errors)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join('\n')
                    setError(errorMsg)
                } else {
                    setError(errors.toString())
                }
            } else {
                setError('Failed to create transaction. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const title = type === 'in' ? 'Cash In' : 'Cash Out'
    const buttonClass = type === 'in' ? 'btn-success' : 'btn-danger'

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-error">
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Amount *</label>
                            <input
                                type="number"
                                name="amount"
                                className="form-input"
                                placeholder="0.00"
                                step="0.01"
                                min="0.01"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Category *</label>
                            {addingCategory ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="New Category Name"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={handleAddCategory}
                                        disabled={inlineLoading || !newCategoryName.trim()}
                                        style={{ padding: '8px' }}
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={() => setAddingCategory(false)}
                                        disabled={inlineLoading}
                                        style={{ padding: '8px' }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select
                                        name="category"
                                        className="form-select"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                        style={{ flex: 1 }}
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setAddingCategory(true)}
                                        title="Add Category"
                                        style={{ padding: '8px 12px' }}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Party</label>
                            {addingParty ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="New Party Name"
                                        value={newPartyName}
                                        onChange={(e) => setNewPartyName(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={handleAddParty}
                                        disabled={inlineLoading || !newPartyName.trim()}
                                        style={{ padding: '8px' }}
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={() => setAddingParty(false)}
                                        disabled={inlineLoading}
                                        style={{ padding: '8px' }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select
                                        name="party"
                                        className="form-select"
                                        value={formData.party}
                                        onChange={handleChange}
                                        style={{ flex: 1 }}
                                    >
                                        <option value="">Select party (optional)</option>
                                        {parties.map(party => (
                                            <option key={party.id} value={party.id}>{party.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setAddingParty(true)}
                                        title="Add Party"
                                        style={{ padding: '8px 12px' }}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Payment Mode *</label>
                            <select
                                name="payment_mode"
                                className="form-select"
                                value={formData.payment_mode}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select payment mode</option>
                                {paymentModes.map(mode => (
                                    <option key={mode.id} value={mode.id}>{mode.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Remark</label>
                            <textarea
                                name="remark"
                                className="form-textarea"
                                placeholder="Add a note..."
                                rows="3"
                                value={formData.remark}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={`btn ${buttonClass}`} disabled={loading}>
                            {loading ? 'Saving...' : `Add ${title}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
