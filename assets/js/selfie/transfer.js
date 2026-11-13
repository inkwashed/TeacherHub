/* Explicit, user-initiated avatar copy. No network requests, storage, or background sync. */
(() => {
    'use strict';
    function create({validate, save, status, busy}) {
        let pending = null;
        function finish(key, {close = false, error = false} = {}) {
            const request = pending;
            if (!request) return;
            pending = null;
            window.removeEventListener('message', request.receive);
            window.removeEventListener('pagehide', request.pagehide);
            clearTimeout(request.timeout); clearInterval(request.poll);
            if (close) { try { request.popup.close(); } catch {} }
            busy(false);
            if (key) status(key, error);
        }
        function cancel() { finish('profile.selfieCancelled', {close:true}); }
        function start() {
            if (pending) return;
            const config = window.TeacherToolsSelfieTransferConfig;
            let url;
            try {
                url = new URL(config.transferURL);
                const exactOrigin = origin => typeof origin === 'string' && new URL(origin).origin === origin && origin !== 'null';
                if (!config.trustedSenderOrigins.every(exactOrigin) || !config.allowedReceiverOrigins.every(exactOrigin) ||
                    !config.trustedSenderOrigins.includes(url.origin) || !config.allowedReceiverOrigins.includes(location.origin) ||
                    url.username || url.password || url.hash ||
                    !(url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname)))) throw new Error('Configuration');
            } catch { status('profile.selfieUnavailable', true); return; }
            let requestId;
            try {
                const random = crypto.getRandomValues(new Uint8Array(16));
                requestId = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
            } catch { status('profile.selfieUnavailable', true); return; }
            url.searchParams.set('requestId', requestId);
            // This is a routing hint only. The sender must independently allowlist it.
            url.searchParams.set('receiverOrigin', location.origin);
            let popup;
            try { popup = window.open(url.href, `letseigo-selfie-${requestId}`, 'popup,width=480,height=640'); } catch {}
            if (!popup) { status('profile.selfieBlocked', true); return; }
            const request = {popup, requestId, origin:url.origin};
            pending = request;
            request.receive = event => {
                if (pending !== request || event.origin !== request.origin || event.source !== request.popup) return;
                const data = event.data;
                if (!data || typeof data !== 'object' || Array.isArray(data) || data.type !== 'letseigo.selfie.import' || data.requestId !== request.requestId) return;
                // Closure is checked here too, rather than waiting for the next polling tick.
                if (request.popup.closed) { finish('profile.selfieCancelled'); return; }
                if (data.version !== 1) { finish('profile.selfieUnsupported', {error:true}); return; }
                if (Object.keys(data).length !== 4 || !['type','version','requestId','avatar'].every(key => Object.prototype.hasOwnProperty.call(data,key))) {
                    finish('profile.selfieInvalid', {error:true}); return;
                }
                let avatar;
                try { avatar = validate(data.avatar); } catch {}
                if (!avatar) { finish('profile.selfieInvalid', {error:true}); return; }
                let transaction;
                try { transaction = save(avatar); } catch {}
                if (!transaction || typeof transaction.rollback !== 'function') { finish('profile.failed', {error:true}); return; }
                // Acknowledgement means validation, local rendering, and persistence succeeded.
                try {
                    request.popup.postMessage({type:'letseigo.selfie.import.ack',version:1,requestId:request.requestId}, request.origin);
                } catch {
                    transaction.rollback();
                    finish('profile.failed', {error:true}); return;
                }
                finish('profile.selfieImported');
            };
            request.pagehide = () => finish(null, {close:true});
            window.addEventListener('message', request.receive);
            window.addEventListener('pagehide', request.pagehide);
            request.poll = setInterval(() => {
                if (pending === request && request.popup.closed) finish('profile.selfieCancelled');
            }, 400);
            const timeoutMs = Number.isFinite(config.timeoutMs) ? Math.max(1000, Math.min(config.timeoutMs, 300000)) : 120000;
            request.timeout = setTimeout(() => finish('profile.selfieTimedOut', {close:true}), timeoutMs);
            busy(true); status('profile.selfieWaiting');
        }
        return Object.freeze({start,cancel,get pending() { return !!pending; }});
    }
    window.TeacherToolsSelfieTransfer = Object.freeze({create});
})();
