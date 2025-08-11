// src/utils/qrCodeGenerator.js
import QRCode from 'qrcode'; // Import the qrcode library

export const generateQRCodeImage = async (dataString, size = 128) => {
    try {
        // Generate QR code as a data URL (PNG format)
        const dataUrl = await QRCode.toDataURL(dataString, {
            errorCorrectionLevel: 'H', // High error correction
            width: size,              // Width of the QR code in pixels
            margin: 1                 // Minimal margin
        });
        console.log(`Generated QR code data URL for: ${dataString}`);
        return dataUrl;
    } catch (err) {
        console.error('Error generating QR code:', err);
        // Fallback to a placeholder or an empty string on error
        return `https://placehold.co/${size}x${size}/FF0000/FFFFFF?text=QR+Error`;
    }
};

// src/utils/qrCodeGenerator.js
// Example using a hypothetical QR code library
// You would install a library like 'qrcode.react' for React components
// or 'qrcode' for pure JS generation.

// This is a conceptual example. Actual implementation depends on the chosen library.
// export const generateQRCodeImage = (dataString, size = 128) => {
//     // If using qrcode.react, you'd render <QRCode value={dataString} size={size} /> in a component
//     // If using a pure JS library, it might return a data URL or draw on a canvas.
//     console.log(`Generating QR code for: ${dataString} with size ${size}`);
//     // Return a placeholder or actual QR code data URL/component
//     return `https://placehold.co/${size}x${size}/000000/FFFFFF?text=QR+Code`;
// };


