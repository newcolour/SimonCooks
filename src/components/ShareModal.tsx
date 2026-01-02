import { useState, useEffect, useRef } from 'react';
import { X, Copy, FileText, Check } from 'lucide-react';
import './ShareModal.css';
import type { Language } from '../i18n';


interface ShareModalProps {
    title: string;
    text: string;
    onClose: () => void;
    language: Language;
}

export function ShareModal({ title, text, onClose, language }: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.select();
        }
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Fallback: Select all text for manual copy
            if (textareaRef.current) {
                textareaRef.current.select();
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    };

    const handleSaveFile = () => {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content share-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{language === 'it' ? 'Condividi Ricetta' : 'Share Recipe'}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="share-body">
                    <p className="share-instruction">
                        {language === 'it'
                            ? 'Copia il testo qui sotto o salvalo come file.'
                            : 'Copy the text below or save it as a file.'}
                    </p>

                    <textarea
                        ref={textareaRef}
                        className="share-textarea"
                        value={text}
                        readOnly
                    />

                    <div className="share-actions">
                        <button className="action-btn secondary" onClick={handleSaveFile}>
                            <FileText size={18} />
                            <span>{language === 'it' ? 'Salva come .txt' : 'Save as .txt'}</span>
                        </button>

                        <button className={`action-btn primary ${copied ? 'success' : ''}`} onClick={handleCopy}>
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            <span>
                                {copied
                                    ? (language === 'it' ? 'Copiato!' : 'Copied!')
                                    : (language === 'it' ? 'Copia' : 'Copy')}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
