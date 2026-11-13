/* Confirmed with the owner. Receiver only: the Let’s EiGo! sender is a separate task. */
window.TeacherToolsSelfieTransferConfig = Object.freeze({
    transferURL: 'https://letseigo.com/apps/avatar/transfer.html',
    trustedSenderOrigins: Object.freeze(['https://letseigo.com']),
    allowedReceiverOrigins: Object.freeze(['https://tools.letseigo.com', 'http://localhost:8765']),
    timeoutMs: 120000
});
