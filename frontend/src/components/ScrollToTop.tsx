import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const ScrollToTop = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const toggleVisible = () => {
            const scrolled = document.documentElement.scrollTop;
            if (scrolled > 100) {
                setVisible(true);
            } else {
                setVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisible);
        return () => window.removeEventListener('scroll', toggleVisible);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <>
            <style>{`
                .fab-scroll-top {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    width: 56px;
                    height: 56px;
                    z-index: 9999;
                    border: none;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    opacity: 0;
                    visibility: hidden;
                    transform: scale(0.5);
                    padding: 0;
                }
                .fab-scroll-top.visible {
                    opacity: 1;
                    visibility: visible;
                    transform: scale(1);
                }
                .fab-scroll-top:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
                }
                .fab-scroll-top svg {
                    width: 28px !important;
                    height: 28px !important;
                    display: block;
                }
            `}</style>
            <button
                className={`fab-scroll-top ${visible ? 'visible' : ''}`}
                onClick={scrollToTop}
                title="Вгору"
            >
                <ArrowUp strokeWidth={3} />
            </button>
        </>
    );
};

export default ScrollToTop;