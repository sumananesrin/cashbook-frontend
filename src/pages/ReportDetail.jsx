import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Download, TrendingUp, TrendingDown, DollarSign,
    ArrowLeft, Calendar, FileText
} from 'lucide-react'
import { reportsApi } from '../api/client'

export default function ReportDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [downloading, setDownloading] = useState(false)
    const [downloadModalOpen, setDownloadModalOpen] = useState(false)

    useEffect(() => {
        loadReport()
    }, [id])

    const loadReport = async () => {
        try {
            setLoading(true)
            const response = await reportsApi.get(id)
            setReport(response.data)
        } catch (err) {
            console.error('Failed to load report:', err)
            setError('Failed to load report. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (format) => {
        if (!report) return

        try {
            setDownloading(true)
            let response
            let filename

            if (format === 'excel') {
                response = await reportsApi.downloadExcel(id)
                filename = `${report.cashbook_name}_report.xlsx`
            } else {
                response = await reportsApi.downloadPdf(id)
                filename = `${report.cashbook_name}_report.pdf`
            }

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            setDownloadModalOpen(false)
        } catch (err) {
            console.error('Download failed:', err)
            alert('Download failed. Please try again.')
        } finally {
            setDownloading(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="content-area" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ color: '#6b7280', fontSize: '16px' }}>Loading report details...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="content-area">
                <div className="alert alert-error">{error}</div>
                <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
                    <ArrowLeft size={16} /> Back to Reports
                </button>
            </div>
        )
    }

    if (!report) return null

    return (
        <div className="content-area">
            {/* Header */}
            <div className="dashboard-header" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        className="btn-text"
                        onClick={() => navigate('/reports')}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none', padding: 0, color: 'var(--color-gray-500)', cursor: 'pointer', fontSize: '13px' }}
                    >
                        <ArrowLeft size={14} /> Back to Reports
                    </button>
                    <div className="dashboard-header-text">
                        <h1>{report.cashbook_name}</h1>
                        <p>Detailed Transaction Report</p>
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => setDownloadModalOpen(!downloadModalOpen)}
                    >
                        <Download size={18} />
                        <span className="btn-text">Download Report</span>
                    </button>

                    {/* Dropdown for Download */}
                    {downloadModalOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            background: 'white',
                            border: '1px solid var(--color-gray-200)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            zIndex: 100,
                            minWidth: '200px',
                            overflow: 'hidden'
                        }}>
                            <button
                                onClick={() => handleDownload('excel')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: 'none',
                                    background: 'white',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: 'var(--color-gray-700)',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-gray-50)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                            >
                                <span style={{ color: '#16a34a' }}>Excel (.xlsx)</span>
                            </button>
                            <button
                                onClick={() => handleDownload('pdf')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: 'none',
                                    background: 'white',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: 'var(--color-gray-700)',
                                    borderTop: '1px solid var(--color-gray-100)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-gray-50)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                            >
                                <span style={{ color: '#dc2626' }}>PDF Document (.pdf)</span>
                            </button>
                        </div>
                    )}

                    {/* Overlay to close dropdown */}
                    {downloadModalOpen && (
                        <div
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                            onClick={() => setDownloadModalOpen(false)}
                        />
                    )}
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
                        <div className="summary-card-amount success" style={{ color: 'var(--color-success)' }}>
                            +${report.total_in.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-card-icon danger">
                        <TrendingDown size={24} />
                    </div>
                    <div className="summary-card-content">
                        <div className="summary-card-label">Total Cash Out</div>
                        <div className="summary-card-amount danger" style={{ color: 'var(--color-danger)' }}>
                            -${report.total_out.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-card-icon primary">
                        <DollarSign size={24} />
                    </div>
                    <div className="summary-card-content">
                        <div className="summary-card-label">Net Balance</div>
                        <div className={`summary-card-amount ${report.net_balance >= 0 ? 'success' : 'danger'}`} style={{ color: report.net_balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            ${report.net_balance.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="table-container">
                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Remark / Category</th>
                                <th>Party</th>
                                <th>Mode</th>
                                <th style={{ textAlign: 'right' }}>Cash In</th>
                                <th style={{ textAlign: 'right' }}>Cash Out</th>
                                <th style={{ textAlign: 'right' }}>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="table-empty">
                                        <div className="table-empty-icon">
                                            <FileText size={32} />
                                        </div>
                                        <div className="table-empty-title">No transactions found</div>
                                        <div className="table-empty-text">This cashbook doesn't have any transactions yet.</div>
                                    </td>
                                </tr>
                            ) : (
                                report.transactions.map((txn, index) => (
                                    <tr key={index}>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            <div style={{ fontWeight: 500 }}>{formatDate(txn.date)}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>{txn.time}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{txn.remark || '-'}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>
                                                {txn.category}
                                            </div>
                                        </td>
                                        <td>{txn.party}</td>
                                        <td>
                                            <span style={{
                                                fontSize: '12px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: 'var(--color-gray-100)',
                                                color: 'var(--color-gray-600)'
                                            }}>
                                                {txn.payment_mode}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 500 }}>
                                            {txn.amount_in > 0 ? `+${txn.amount_in.toFixed(2)}` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--color-danger)', fontWeight: 500 }}>
                                            {txn.amount_out > 0 ? `-${txn.amount_out.toFixed(2)}` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            ${txn.running_balance.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
