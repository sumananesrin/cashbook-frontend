import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Download, TrendingUp, TrendingDown, BookOpen, Calendar, FileSpreadsheet, File } from 'lucide-react'
import { reportsApi } from '../api/client'

export default function Reports() {
    const navigate = useNavigate()
    const [cashbooks, setCashbooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [downloadModalOpen, setDownloadModalOpen] = useState(false)
    const [selectedBook, setSelectedBook] = useState(null)
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        loadReports()
    }, [])

    const loadReports = async () => {
        try {
            setLoading(true)
            const response = await reportsApi.list()
            setCashbooks(response.data)
        } catch (err) {
            console.error('Failed to load reports:', err)
            setError('Failed to load reports. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleRowClick = (bookId) => {
        navigate(`/reports/${bookId}`)
    }

    const openDownloadModal = (e, book) => {
        e.stopPropagation()
        setSelectedBook(book)
        setDownloadModalOpen(true)
    }

    const handleDownload = async (format) => {
        if (!selectedBook) return

        try {
            setDownloading(true)
            let response
            let filename

            if (format === 'excel') {
                response = await reportsApi.downloadExcel(selectedBook.id)
                filename = `${selectedBook.name}_report.xlsx`
            } else {
                response = await reportsApi.downloadPdf(selectedBook.id)
                filename = `${selectedBook.name}_report.pdf`
            }

            // Create blob link to download
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
                <div style={{ color: '#6b7280', fontSize: '16px' }}>Loading reports...</div>
            </div>
        )
    }

    return (
        <div className="content-area">
            <div className="dashboard-header">
                <div className="dashboard-header-text">
                    <h1>Reports</h1>
                    <p>View and download detailed financial reports for your cashbooks</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {cashbooks.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <FileText size={40} />
                    </div>
                    <h2>No Reports Available</h2>
                    <p>You don't have any cashbooks to generate reports for.</p>
                </div>
            ) : (
                <div className="cashbooks-container">
                    <div className="cashbooks-table">
                        <div className="table-header">
                            <div className="col-book-name">Book Name</div>
                            <div className="col-balance">Net Balance</div>
                            <div className="col-in-out" style={{ textAlign: 'right' }}>Total In / Out</div>
                            <div className="col-date">Last Updated</div>
                            <div className="col-actions"></div>
                        </div>

                        <div className="table-body">
                            {cashbooks.map((book) => (
                                <div
                                    key={book.id}
                                    className="table-row"
                                    onClick={() => handleRowClick(book.id)}
                                >
                                    <div className="col-book-name">
                                        <div className="book-name-wrapper">
                                            <BookOpen className="book-icon" size={20} />
                                            <div className="book-info">
                                                <div className="book-name">{book.name}</div>
                                                <div className="book-description">{book.business_name}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-balance">
                                        <div className={`balance-amount ${(book.net_balance || 0) >= 0 ? 'positive' : 'negative'}`}>
                                            ${(book.net_balance || 0).toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="col-in-out" style={{ textAlign: 'right' }}>
                                        <div style={{ color: 'var(--color-success)', fontSize: '13px' }}>
                                            +${(book.total_in || 0).toFixed(2)}
                                        </div>
                                        <div style={{ color: 'var(--color-danger)', fontSize: '13px' }}>
                                            -${(book.total_out || 0).toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="col-date">
                                        <Calendar size={14} />
                                        {formatDate(book.last_updated)}
                                    </div>

                                    <div className="col-actions">
                                        <button
                                            className="btn-icon"
                                            onClick={(e) => openDownloadModal(e, book)}
                                            title="Download Report"
                                            style={{
                                                border: '1px solid var(--color-gray-300)',
                                                background: 'var(--color-white)',
                                                cursor: 'pointer',
                                                padding: '8px',
                                                color: 'var(--color-gray-700)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '6px',
                                            }}
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Download Modal */}
            {downloadModalOpen && selectedBook && (
                <div className="modal-overlay" onClick={() => setDownloadModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Download Report</h2>
                            <button className="modal-close" onClick={() => setDownloadModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '20px', color: 'var(--color-gray-600)' }}>
                                Choose a format to download the report for <strong>{selectedBook.name}</strong>.
                            </p>

                            <div style={{ display: 'grid', gap: '12px' }}>
                                <button
                                    className="btn"
                                    style={{ justifyContent: 'center', border: '1px solid var(--color-gray-300)', padding: '12px' }}
                                    onClick={() => handleDownload('excel')}
                                    disabled={downloading}
                                >
                                    <FileSpreadsheet size={20} style={{ color: '#16a34a' }} />
                                    <span>Download as Excel (.xlsx)</span>
                                </button>

                                <button
                                    className="btn"
                                    style={{ justifyContent: 'center', border: '1px solid var(--color-gray-300)', padding: '12px' }}
                                    onClick={() => handleDownload('pdf')}
                                    disabled={downloading}
                                >
                                    <File size={20} style={{ color: '#dc2626' }} />
                                    <span>Download as PDF (.pdf)</span>
                                </button>
                            </div>

                            {downloading && (
                                <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--color-gray-500)' }}>
                                    Generating report...
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
