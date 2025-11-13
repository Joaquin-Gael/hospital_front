export const TURN_DOCUMENTS_ENDPOINTS = {
  downloadTurnPdf: (turnId: string) => `turns/${turnId}/pdf`,
  downloadTurnPdfAsAdmin: (userId: string, turnId: string) =>
    `turns/user/pdf/${userId}/${turnId}`,
  listMyTurnDocuments: 'turns/documents/me',
  listMyTurnDocumentDownloads: 'turns/documents/me/downloads',
} as const;
