// src/lib/notifications.js
// Gestione Notifiche Web e Promemoria Fine Turno (Desktop & Mobile PWA)
// Conforme a docs/HANDOFF_CICLO_VITA_LAVORAZIONI.md §1 Decisione 4

const STORAGE_KEY_LAST_REMINDER = 'berc_last_shift_reminder_sent';
const STORAGE_KEY_DAILY_SUBMISSIONS = 'berc_daily_pieces_submissions';

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Errore richiesta permesso notifiche:', err);
    return 'denied';
  }
}

/**
 * Verifica se l'orario attuale è in finestra di promemoria fine turno.
 * Turno 1: 15:30 - 17:30 (Notifica push/web programmata alle 16:45)
 * Turno 2: 20:30 - 22:30 (Notifica push/web programmata alle 21:45)
 */
export function getCurrentShiftReminderInfo() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Turno 1: 15:30 (930 min) - 17:30 (1050 min)
  const isShift1Window = timeInMinutes >= 930 && timeInMinutes <= 1050;
  const isShift1Exact = timeInMinutes >= 1005 && timeInMinutes <= 1025; // ~16:45

  // Turno 2: 20:30 (1230 min) - 22:30 (1350 min)
  const isShift2Window = timeInMinutes >= 1230 && timeInMinutes <= 1350;
  const isShift2Exact = timeInMinutes >= 1305 && timeInMinutes <= 1325; // ~21:45

  const shiftLabel = isShift1Window ? '1º Turno (Pomeriggio)' : isShift2Window ? '2º Turno (Sera)' : null;

  return {
    isInReminderWindow: isShift1Window || isShift2Window,
    isExactPushTime: isShift1Exact || isShift2Exact,
    shiftLabel,
    dateKey: now.toISOString().slice(0, 10)
  };
}

/**
 * Segna che per una lavorazione i pezzi sono stati registrati oggi.
 */
export function markPiecesSubmittedToday(commessaId) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_DAILY_SUBMISSIONS) || '{}');
    if (!stored[today]) stored[today] = [];
    if (!stored[today].includes(commessaId)) {
      stored[today].push(commessaId);
    }
    localStorage.setItem(STORAGE_KEY_DAILY_SUBMISSIONS, JSON.stringify(stored));
  } catch (err) {
    console.warn('Errore salvataggio pezzi registrati in localStorage:', err);
  }
}

/**
 * Controlla se i pezzi per una lavorazione sono già stati registrati oggi.
 */
export function wasPiecesSubmittedToday(commessaId) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_DAILY_SUBMISSIONS) || '{}');
    return Array.isArray(stored[today]) && stored[today].includes(commessaId);
  } catch {
    return false;
  }
}

/**
 * Invia una notifica di sistema Web/Desktop se consentita.
 */
export function sendShiftEndNotification({ title, body, onClick }) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notif = new Notification(title || '🏭 Fine Turno CNC · Bercella', {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'berc-shift-end',
      renotify: true
    });

    if (onClick) {
      notif.onclick = () => {
        window.focus();
        onClick();
        notif.close();
      };
    }

    return notif;
  } catch (err) {
    console.warn('Invio notifica Web fallito:', err);
    return null;
  }
}

/**
 * Triggera il controllo e notifica push se necessario (evita notifiche duplicate nello stesso turno).
 */
export function checkAndTriggerShiftNotification(activeLavorazioni = [], onNavigate) {
  const info = getCurrentShiftReminderInfo();
  if (!info.isInReminderWindow) return;

  const lavorazioniDaRegistrare = activeLavorazioni.filter(
    c => c.traccia_ciclo_vita && !wasPiecesSubmittedToday(c.id)
  );

  if (lavorazioniDaRegistrare.length === 0) return;

  if (info.isExactPushTime && getNotificationPermission() === 'granted') {
    const today = info.dateKey;
    const lastSent = localStorage.getItem(STORAGE_KEY_LAST_REMINDER);
    const reminderId = `${today}_${info.shiftLabel}`;

    if (lastSent !== reminderId) {
      localStorage.setItem(STORAGE_KEY_LAST_REMINDER, reminderId);
      const machineNames = [...new Set(lavorazioniDaRegistrare.map(c => c.nome_macchina || c.codice))].join(', ');
      sendShiftEndNotification({
        title: '🏭 Fine Turno: Registra Pezzi Prodotti',
        body: `Ricordati di registrare i pezzi finiti oggi su ${machineNames}!`,
        onClick: () => onNavigate?.('produzione')
      });
    }
  }
}
