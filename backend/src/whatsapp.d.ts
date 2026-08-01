export declare const initWhatsApp: () => void;
export declare const getWhatsAppStatus: () => {
    isReady: boolean;
    qr: string | null;
    isRunning: boolean;
};
export declare const destroyWhatsApp: () => Promise<void>;
export declare const sendWhatsAppMessage: (phone: string, message: string) => Promise<void>;
//# sourceMappingURL=whatsapp.d.ts.map