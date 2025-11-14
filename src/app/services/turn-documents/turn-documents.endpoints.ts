export const TURN_DOCUMENTS_ENDPOINTS = {
  downloadTurnPdf: (turnId: string) => `medic/turns/${turnId}/pdf`,
  downloadTurnPdfAsAdmin: (userId: string, turnId: string) =>
    `medic/turns/user/pdf/${userId}/${turnId}`,
  listMyTurnDocuments: 'medic/turns/documents/me',
  listMyTurnDocumentDownloads: 'medic/turns/documents/me/downloads',
} as const;
