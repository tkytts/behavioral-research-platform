import { useTranslation } from "react-i18next";

const InputModal = ({ onUnderstood, inputRef, text }) => {
    const inputPosition = inputRef.getBoundingClientRect();
    const { t } = useTranslation();

    const overlayBase = {
        position: 'fixed',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        pointerEvents: 'none',
    };

    const INSET = 6;
    const highlightTop = inputPosition.top - INSET;
    const highlightLeft = inputPosition.left - INSET;
    const highlightWidth = inputPosition.width + INSET * 2;
    const highlightHeight = inputPosition.height + INSET * 2;

    const topOverlay = { ...overlayBase, top: 0, left: 0, width: '100%', height: highlightTop };
    const bottomOverlay = { ...overlayBase, top: highlightTop + highlightHeight, left: 0, width: '100%', height: `calc(100% - ${highlightTop + highlightHeight}px)` };
    const leftOverlay = { ...overlayBase, top: highlightTop, left: 0, width: highlightLeft, height: highlightHeight };
    const rightOverlay = { ...overlayBase, top: highlightTop, left: highlightLeft + highlightWidth, width: `calc(100% - ${highlightLeft + highlightWidth}px)`, height: highlightHeight };

    const customStyle = {
        position: 'absolute',
        top: highlightTop,
        left: highlightLeft,
        width: highlightWidth,
        height: highlightHeight,
        border: '2px solid blue',
        backgroundColor: 'transparent',
        zIndex: 1001,
        pointerEvents: 'auto',
    };

    const textBoxStyle = {
        position: 'absolute',
        top: inputPosition.top + inputPosition.height + 10, // Adjust as needed
        left: inputPosition.left,
        padding: '10px',
        backgroundColor: '#fff', // Keep opaque
        border: '1px solid #ccc',
        borderRadius: '5px',
        zIndex: 1002,
        textAlign: 'center',
    };

    const arrowStyle = {
        position: 'absolute',
        top: inputPosition.top + inputPosition.height, // Adjust as needed
        left: inputPosition.left + 20, // Adjust as needed
        width: 0,
        height: 0,
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop: '10px solid #fff', // Keep opaque
        zIndex: 1002,
        transform: 'rotate(180deg)', // Rotate the arrow 180 degrees
    };

    const buttonWrapperStyle = {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '10px',
    };

    return (
        <div>
            <div data-testid="overlay-top" style={topOverlay}></div>
            <div data-testid="overlay-bottom" style={bottomOverlay}></div>
            <div data-testid="overlay-left" style={leftOverlay}></div>
            <div data-testid="overlay-right" style={rightOverlay}></div>
            <div style={customStyle}></div>
            <div style={textBoxStyle}>
                <p>{text}</p>
                <div style={buttonWrapperStyle}>
                    <button
                        className="btn btn-primary"
                        style={{ minWidth: '120px', width: '120px', textAlign: 'center' }}
                        onClick={onUnderstood}
                    >
                        {t("understood")}
                    </button>
                </div>
            </div>
            <div style={arrowStyle}></div>
        </div>
    );
};

export default InputModal;