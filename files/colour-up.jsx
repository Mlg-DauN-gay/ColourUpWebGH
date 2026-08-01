import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import {
  Check, X, Plus, Lock, ChevronRight, AlertTriangle, Clock,
  Receipt, ArrowRight, RotateCcw, Wallet, ShieldCheck, Calculator, LogOut,
  Eye, Coins, ScrollText, Languages, QrCode, User, Users, Palette,
  Trophy, TrendingUp, History, Copy, Spade, Camera, Sparkles
} from "lucide-react";

/* ═══════════════════════ themes ═══════════════════════
   Palette is built on the trust/gambling colour research:
   · Blue  → primary. Security & competence — chrome, CTAs, active states.
   · White/Gray → clarity & professional neutrality — surfaces, borders, text.
   · Green → money. Gains, positive nets, the pot.
   · Red   → risk/excitement. Losses and warnings.
   · Gold  → luxury & winning. Reserved for win moments (receipt, best night).
   Tokens are CSS custom properties, so every `C.x` re-themes for free.     */
const THEMES = {
  trust: {
    name: { en: "Trust", ru: "Доверие" }, swatch: ["#EEF1F6", "#2F6FED", "#C99A2E"],
    ink: "#EDF0F5", sheet: "#FFFFFF", room: "#FFFFFF", raise: "#F3F5F9", line: "#DCE1EA",
    ivory: "#1B2430", sub: "#5A6675", mute: "#8A94A3",
    brass: "#2F6FED", brassSoft: "rgba(47,111,237,.10)", onAccent: "#FFFFFF",
    win: "#1F9D57", lose: "#D64550", gold: "#C99A2E",
  },
  night: {
    name: { en: "Night", ru: "Ночь" }, swatch: ["#0B1120", "#4C8DFF", "#E3B23C"],
    ink: "#0B1120", sheet: "#070B14", room: "#131C2E", raise: "#1C273B", line: "#29344A",
    ivory: "#E7ECF4", sub: "#A9B4C6", mute: "#7A8699",
    brass: "#4C8DFF", brassSoft: "rgba(76,141,255,.18)", onAccent: "#FFFFFF",
    win: "#34C77B", lose: "#F2555F", gold: "#E3B23C",
  },
  steel: {
    name: { en: "Steel", ru: "Сталь" }, swatch: ["#10151D", "#3B82C4", "#3FB984"],
    ink: "#10151D", sheet: "#0A0E14", room: "#182029", raise: "#212B36", line: "#2E3945",
    ivory: "#E6EBF0", sub: "#A6B0BC", mute: "#7C8794",
    brass: "#3B82C4", brassSoft: "rgba(59,130,196,.18)", onAccent: "#FFFFFF",
    win: "#3FB984", lose: "#E15561", gold: "#D9A83B",
  },
};
const C = {
  ink: "var(--ink)", sheet: "var(--sheet)", room: "var(--room)", raise: "var(--raise)",
  line: "var(--line)", ivory: "var(--ivory)", sub: "var(--sub)", mute: "var(--mute)",
  brass: "var(--brass)", brassSoft: "var(--brassSoft)", onAccent: "var(--onAccent)",
  win: "var(--win)", lose: "var(--lose)", gold: "var(--gold)",
};
const themeVars = (t) => ({
  "--ink": t.ink, "--sheet": t.sheet, "--room": t.room, "--raise": t.raise, "--line": t.line,
  "--ivory": t.ivory, "--sub": t.sub, "--mute": t.mute, "--brass": t.brass,
  "--brassSoft": t.brassSoft, "--onAccent": t.onAccent, "--win": t.win, "--lose": t.lose, "--gold": t.gold,
});

const DENOMS = [
  { v: 1000, c: "#2F2A38", n: "1k" }, { v: 500, c: "#7A4E9E", n: "500" },
  { v: 100, c: "#1F1B27", n: "100" }, { v: 25, c: "#3E8A5F", n: "25" },
  { v: 5, c: "#B33A3A", n: "5" }, { v: 1, c: "#DDD5C6", n: "1" },
];
const PALETTE = ["#C4514A", "#5FA97C", "#7A6DB0", "#CBA45E", "#4E93A8", "#C47C4A", "#A85F86", "#6E9E4E"];
const CURRENCIES = ["£", "$", "€", "₸", "₽"];

/* ═══════════════════════ i18n ═══════════════════════ */
const DICT = {
  en: {
    _loc: "en-GB", brand: "Colour Up",
    tabPlay: "Play", tabFriends: "Friends", tabYou: "You",
    // pot rail
    inPot: "in the pot", countedIssued: "counted / issued", waitingCounts: "waiting on stack counts",
    balanced: "balanced", drift: (d) => `${d > 0 ? "+" : "−"}${Math.abs(d).toLocaleString()} chips against the book`,
    ledger: "ledger · append only", nothingYet: "Nothing recorded yet.",
    // play home
    homeHi: (n) => `Evening, ${n}`, homeSub: "Host a table or drop into someone else's.",
    hostGame: "Host a table", hostGameSub: "Set the stake and invite the room",
    joinGame: "Join a table", joinGameSub: "Scan a QR or enter a code",
    recent: "recent tables", noHistoryHome: "No tables yet — host your first.",
    resume: "Resume table", resumeSub: (p) => `In progress · ${p}`,
    // join sheet
    joinTitle: "Join a table", joinBlurb: "Point your camera at the host's QR, or type the code they read out.",
    scanFrame: "Camera would open here", enterCodeLabel: "table code", joinBtn: "Join",
    lookingFor: "Looking for the table…", noTable: "No open table with that code. Check it with the host.",
    // setup
    openTable: "Open the table", setupBlurb: "Set the stake once, up front. Nobody buys in until every seat has agreed to the same number.",
    game: "game", buyIn: "buy-in", chipsPer: "chips per buy-in", chips: "chips", currency: "currency",
    startingStack: "starting stack", countAsCash: (c) => `Counting chips straight in ${c}`,
    countAsCashNote: "Simplest option — a stack is worth exactly what it sums to.",
    scanSet: "Scan my chip set", rescan: "Re-scan", clearScan: "Use cash counting",
    scanTitle: "Read your chip set", scanBlurb: "Snap your chips grouped by colour. The app values each colour and splits an even starting stack for the whole table.",
    takePhoto: "Take or choose a photo", analyzing: "Reading the chips…",
    scanFailed: "Couldn't read that photo automatically — add your colours by hand below.",
    detected: "colours found", worth: "worth", countLabel: "in set", perPlayerCol: "per player",
    forPlayers: (n) => `even stacks for ${n} players`, stackWorth: "starting stack per player",
    equalsBuyin: "= one buy-in", addColour: "Add a colour", notEnough: (n) => `short for ${n}`,
    useSetup: "Use this setup", scannedSummary: (n, v) => `${n} colours · ${v} per stack`, tapValue: "tap to change value",
    howMoney: "how money moves",
    potT: "Take it from cards", potD: "Each buy-in is charged to the player's card. At the end, everyone is paid back whatever their final stack is worth.",
    receiptT: "Just a receipt", receiptD: "No money moves through the app. At the end you get a receipt listing the fewest transfers that settle everyone up.",
    seats: "seats", addSeat: "Add blank seat", fromFriends: "add from friends", banker: "BANKER",
    openLobby: "Open lobby", tableOpened: (b, c) => `Table opened · ${b} buy-in · ${c} chips`,
    seatsAfter: "Players take their seats once you open the lobby — they scan the QR or enter the code.",
    // lobby + invite
    stepOne: "step one", agreeStake: "Agree the stake",
    lobbyBlurb: (b, c) => `${b} for ${c} chips. Every seat has to say yes before anything is charged — the banker can't change it once agreed.`,
    agreed: "AGREED", waiting: "WAITING",
    onPhone: (n) => `On ${n}'s phone —`, agreeQ: (b) => `agree to a ${b} buy-in?`,
    agree: "Agree", decline: "Decline",
    agreedLog: (n, b) => `${n} agreed to ${b}`, declinedLog: (n) => `${n} declined the stake`,
    takeBuyins: "Take buy-ins", waitingSeats: (n) => `Waiting on ${n} seat(s)`,
    invite: "invite to the table", scanToJoin: "Scan to take a seat", orCode: "or enter code",
    copyLink: "Copy link", copied: "Copied", simJoin: "Simulate someone scanning",
    joinedLog: (n) => `${n} scanned in and took a seat`, tableFull: "Room's full for now",
    // fund
    stepTwo: "step two", buyInTitle: "Buy in",
    fundPot: "Your buy-in is charged to your card now. At the end you're paid back whatever your stack is worth.",
    fundReceipt: "Nothing is charged — this only records what you put in, so the final receipt is right.",
    held: "HELD", unpaid: "UNPAID", paidTag: "PAID", inTag: "IN", authorise: (b) => `Pay ${b}`, deal: "Deal",
    waitingBuyins: (n) => `Waiting on ${n} buy-in(s)`, cardsUp: "Cards in the air",
    // live
    live: "● live", leftTag: "· LEFT", buyinsChips: (k, c) => `${k} × buy-in · ${c} chips issued`,
    rebuy: "Re-buy", cashEarly: "Cash out early",
    exposure: (n) => `${n}'s exposure`, exposureNotePot: "charged to your card · paid back at settlement", exposureNoteReceipt: "recorded · squared up by the receipt at the end",
    cashingEarly: (n) => `${n} is cashing out early`,
    lastHand: "Call last hand", bankerOnly: "Only the banker can close the table",
    // cashout
    stepThree: "step three", countStack: "Count your stack",
    cashoutBlurb: "Each seat counts their own chips. Nobody sees anyone else's number until every stack is in.",
    someonesStack: (n) => `${n}'s stack`, typeTotal: "Type a total", countColour: "Count by colour",
    photoStack: "Photo of my stack", countingPhoto: "Counting your stack…",
    fromPhoto: "Counted from your photo — check it and adjust if needed.",
    photoFailed: "Couldn't count that photo. Enter your chips by hand.",
    chipsWord: "chips", lockStack: "Lock in stack", countedLog: (n, c) => `${n} counted ${c} chips`,
    countedTag: "COUNTED", countingTag: "COUNTING…",
    checkBooks: "Check the books", waitingStacks: (n) => `Waiting on ${n} stack(s)`,
    // reconcile
    stepFour: "step four", booksBalance: "The books balance", countOff: "The count is off",
    reconOk: (c, i) => `${c} chips counted against ${i} issued. Nothing is missing.`,
    reconBad: (c, i, d, dir) => `${c} counted, ${i} issued — ${d} chips ${dir}. Recount before anyone gets paid.`,
    tooMany: "too many", unaccounted: "unaccounted for",
    closeMsg: "It's within half a percent — usually a chip on the floor or a miscount of the smallest colour.",
    bigGap: "That's a big gap. Check for an unrecorded re-buy, or a stack counted twice.",
    drawSettle: "Draw up settlement", fixToContinue: (d) => `${d} chips out — fix to continue`,
    fullRecount: "Call a full recount", recountLog: "Recount called", booksBalancedLog: "Books balanced — settlement drawn up",
    recountAll: "Recount — everyone counts again",
    reconLocked: "Counts can't be edited here. If the books don't balance, the whole table re-counts — so nobody can nudge a number to force it.",
    // settle
    stepFive: "step five", settleUp: "Settle up",
    settlePot: "Everyone is paid back what their final stack is worth, straight from the pot. All players sign off first.",
    settleReceipt: (a, b) => `Your receipt clears everyone in ${a} instead of ${b}.`,
    transferN: (n) => `${n} transfer${n === 1 ? "" : "s"}`, paymentN: (n) => `${n} payment${n === 1 ? "" : "s"}`,
    colSeat: "SEAT", colIn: "IN", colOut: "OUT", colNet: "NET",
    transfers: "transfers", allLevel: "Everyone finished level.",
    signoff: "sign-off · unanimous", signed: "SIGNED", pending: "PENDING",
    thisRight: (n) => `${n}: this is right`, payEveryone: "Pay everyone out", finaliseReceipt: "Finalise receipt", waitingSigs: (n) => `Waiting on ${n} signature(s)`,
    settledPotLog: "Cards settled — each player paid their stack from the pot", settledReceiptLog: (n) => `Receipt finalised · ${n}`,
    savedLog: "Table saved to history",
    // done
    settled: "Settled", throughTable: (p) => `${p} through the table`,
    length: "length", biggestWin: "biggest win", seatsWord: "seats", receipt: "receipt",
    newTable: "Back to home",
    // friends
    friendsTitle: "Friends", friendsSub: "The people you play with. Add them once, invite them fast.",
    addFriend: "Add a friend", addByHandle: "by @handle", handlePh: "@handle", add: "Add",
    friendAdded: (n) => `${n} added to friends`, noFriends: "No friends yet.",
    togetherN: (n) => `${n} table${n === 1 ? "" : "s"} together`, inviteToNext: "Invite next time",
    yourInvite: "your invite code", shareHandle: "Share your @handle so friends can add you back.",
    // profile
    createProfile: "Create your profile", regBlurb: "This is who you are at the table — your name, your handle, and the currency you play in.",
    yourName: "your name", username: "handle", homeCur: "home currency", pickColour: "your colour",
    saveProfile: "Save profile", profileSaved: "Profile ready",
    lifetime: "lifetime", gamesPlayed: "tables", netLifetime: "net", biggestNight: "best night", hoursPlayed: "hours",
    historyTitle: "history", noHistory: "No tables played yet.", editProfile: "Edit profile",
    appearance: "appearance", theme: "palette", langLabel: "language",
    won: "won", lost: "lost", vs: "vs", playersN: (n) => `${n} players`,
    // pay sheet
    simWallet: "simulated wallet", chargedToCard: (r) => `${r} · charged to card`,
    payWithWallet: "Pay with wallet", authorising: "Charging…", paidWord: "Paid", cancel: "Cancel",
    buyinReason: "buy-in", rebuyReason: "re-buy",
    chargedLog: (n, r, m, c) => `${n} — ${r} ${m} charged · ${c} chips issued`,
    recordedLog: (n, r, m) => `${n} — ${r} ${m} recorded`,
    thu: "Thursday game", you: "You",
  },
  ru: {
    _loc: "ru-RU", brand: "Colour Up",
    tabPlay: "Игра", tabFriends: "Друзья", tabYou: "Профиль",
    inPot: "в банке", countedIssued: "подсчитано / выдано", waitingCounts: "ждём подсчёта стеков",
    balanced: "сходится", drift: (d) => `${d > 0 ? "+" : "−"}${Math.abs(d).toLocaleString()} фишек к балансу`,
    ledger: "журнал · только добавление", nothingYet: "Пока ничего не записано.",
    homeHi: (n) => `Добрый вечер, ${n}`, homeSub: "Соберите стол или зайдите к другим.",
    hostGame: "Собрать стол", hostGameSub: "Задайте ставку и позовите игроков",
    joinGame: "Зайти за стол", joinGameSub: "Сканируйте QR или введите код",
    recent: "недавние столы", noHistoryHome: "Столов ещё нет — соберите первый.",
    resume: "Вернуться к столу", resumeSub: (p) => `Идёт игра · ${p}`,
    joinTitle: "Зайти за стол", joinBlurb: "Наведите камеру на QR банкира или введите код, который он назовёт.",
    scanFrame: "Здесь откроется камера", enterCodeLabel: "код стола", joinBtn: "Зайти",
    lookingFor: "Ищем стол…", noTable: "Стола с таким кодом нет. Уточните у банкира.",
    openTable: "Открыть стол", setupBlurb: "Ставка задаётся один раз, в начале. Никто не входит, пока все не согласятся с одной суммой.",
    game: "игра", buyIn: "вход", chipsPer: "фишек за вход", chips: "фишек", currency: "валюта",
    startingStack: "стартовый стек", countAsCash: (c) => `Считаем фишки прямо в ${c}`,
    countAsCashNote: "Самый простой вариант — стек стоит ровно столько, сколько в сумме.",
    scanSet: "Сканировать набор фишек", rescan: "Пересканировать", clearScan: "Считать как деньги",
    scanTitle: "Распознать ваш набор", scanBlurb: "Сфотографируйте фишки по цветам. Приложение оценит каждый цвет и раздаст ровные стартовые стеки на весь стол.",
    takePhoto: "Сделать или выбрать фото", analyzing: "Считываем фишки…",
    scanFailed: "Не удалось распознать фото автоматически — добавьте цвета вручную ниже.",
    detected: "найденные цвета", worth: "номинал", countLabel: "в наборе", perPlayerCol: "на игрока",
    forPlayers: (n) => `ровные стеки на ${n} игроков`, stackWorth: "стартовый стек на игрока",
    equalsBuyin: "= один вход", addColour: "Добавить цвет", notEnough: (n) => `не хватает на ${n}`,
    useSetup: "Применить", scannedSummary: (n, v) => `${n} цветов · ${v} в стеке`, tapValue: "нажмите, чтобы изменить номинал",
    howMoney: "как двигаются деньги",
    potT: "Списывать с карт", potD: "Каждый вход списывается с карты игрока. В конце каждому возвращается ровно столько, сколько стоит его финальный стек.",
    receiptT: "Только чек", receiptD: "Через приложение деньги не двигаются. В конце вы получаете чек с минимальным числом переводов, чтобы всех рассчитать.",
    seats: "места", addSeat: "Добавить пустое место", fromFriends: "добавить из друзей", banker: "БАНКИР",
    openLobby: "Открыть лобби", tableOpened: (b, c) => `Стол открыт · вход ${b} · ${c} фишек`,
    seatsAfter: "Игроки садятся за стол после открытия лобби — сканируют QR или вводят код.",
    stepOne: "шаг первый", agreeStake: "Согласовать ставку",
    lobbyBlurb: (b, c) => `${b} за ${c} фишек. Каждый должен подтвердить, прежде чем что-либо спишется — банкир не сможет изменить сумму после согласования.`,
    agreed: "СОГЛАСЕН", waiting: "ОЖИДАНИЕ",
    onPhone: (n) => `На телефоне ${n} —`, agreeQ: (b) => `согласиться на вход ${b}?`,
    agree: "Согласиться", decline: "Отклонить",
    agreedLog: (n, b) => `${n} согласился на ${b}`, declinedLog: (n) => `${n} отклонил ставку`,
    takeBuyins: "Принять входы", waitingSeats: (n) => `Ждём ${n} мест(а)`,
    invite: "пригласить за стол", scanToJoin: "Сканируйте, чтобы сесть", orCode: "или введите код",
    copyLink: "Копировать ссылку", copied: "Скопировано", simJoin: "Симулировать сканирование",
    joinedLog: (n) => `${n} отсканировал и сел за стол`, tableFull: "Пока мест нет",
    stepTwo: "шаг второй", buyInTitle: "Вход",
    fundPot: "Ваш вход сейчас списывается с карты. В конце вам вернётся столько, сколько будет стоить ваш стек.",
    fundReceipt: "Ничего не списывается — просто фиксируем ваш вход, чтобы итоговый чек был верным.",
    held: "ХОЛД", unpaid: "НЕ ВНЕСЕНО", paidTag: "ОПЛАЧЕНО", inTag: "В ИГРЕ", authorise: (b) => `Оплатить ${b}`, deal: "Раздать",
    waitingBuyins: (n) => `Ждём ${n} вход(ов)`, cardsUp: "Карты в игре",
    live: "● идёт игра", leftTag: "· ВЫШЕЛ", buyinsChips: (k, c) => `${k} × вход · ${c} фишек выдано`,
    rebuy: "Докупка", cashEarly: "Выйти раньше",
    exposure: (n) => `на кону у ${n}`, exposureNotePot: "списано с карты · возврат при расчёте", exposureNoteReceipt: "записано · закрывается чеком в конце",
    cashingEarly: (n) => `${n} выходит из игры`,
    lastHand: "Объявить последнюю раздачу", bankerOnly: "Закрыть стол может только банкир",
    stepThree: "шаг третий", countStack: "Посчитайте свой стек",
    cashoutBlurb: "Каждый считает свои фишки сам. Ничей результат не виден, пока не введены все стеки.",
    someonesStack: (n) => `стек ${n}`, typeTotal: "Ввести сумму", countColour: "Считать по цвету",
    photoStack: "Фото моего стека", countingPhoto: "Считаем ваш стек…",
    fromPhoto: "Посчитано по фото — проверьте и при необходимости поправьте.",
    photoFailed: "Не удалось посчитать по фото. Введите фишки вручную.",
    chipsWord: "фишек", lockStack: "Зафиксировать стек", countedLog: (n, c) => `${n} насчитал ${c} фишек`,
    countedTag: "ПОДСЧИТАНО", countingTag: "СЧИТАЕТ…",
    checkBooks: "Сверить баланс", waitingStacks: (n) => `Ждём ${n} стек(ов)`,
    stepFour: "шаг четвёртый", booksBalance: "Баланс сходится", countOff: "Баланс не сходится",
    reconOk: (c, i) => `${c} фишек подсчитано против ${i} выданных. Ничего не потерялось.`,
    reconBad: (c, i, d, dir) => `${c} подсчитано, ${i} выдано — ${d} фишек ${dir}. Пересчитайте, прежде чем платить.`,
    tooMany: "лишних", unaccounted: "не хватает",
    closeMsg: "Расхождение в пределах половины процента — обычно упавшая фишка или просчёт мелкого номинала.",
    bigGap: "Большое расхождение. Проверьте незаписанную докупку или дважды посчитанный стек.",
    drawSettle: "Составить расчёт", fixToContinue: (d) => `${d} фишек в расхождении — исправьте`,
    fullRecount: "Объявить полный пересчёт", recountLog: "Объявлен пересчёт", booksBalancedLog: "Баланс сошёлся — расчёт составлен",
    recountAll: "Пересчёт — считают все заново",
    reconLocked: "Здесь нельзя править цифры. Если баланс не сходится, пересчитывает весь стол — чтобы никто не мог подогнать число.",
    stepFive: "шаг пятый", settleUp: "Расчёт",
    settlePot: "Каждому возвращается стоимость его финального стека прямо из банка. Сначала все подтверждают.",
    settleReceipt: (a, b) => `Ваш чек закрывает всех в ${a} вместо ${b}.`,
    transferN: (n) => `${n} перевод${n === 1 ? "" : n < 5 ? "а" : "ов"}`, paymentN: (n) => `${n} перевод${n === 1 ? "" : n < 5 ? "а" : "ов"}`,
    colSeat: "МЕСТО", colIn: "ВНЁС", colOut: "ЗАБРАЛ", colNet: "ИТОГ",
    transfers: "переводы", allLevel: "Все вышли в ноль.",
    signoff: "подтверждение · единогласно", signed: "ПОДПИСАЛ", pending: "ОЖИДАЕТ",
    thisRight: (n) => `${n}: всё верно`, payEveryone: "Выплатить всем", finaliseReceipt: "Сформировать чек", waitingSigs: (n) => `Ждём ${n} подпис(ей)`,
    settledPotLog: "Карты рассчитаны — каждому выплачен его стек из банка", settledReceiptLog: (n) => `Чек сформирован · ${n}`,
    savedLog: "Стол сохранён в историю",
    settled: "Рассчитано", throughTable: (p) => `${p} прошло через стол`,
    length: "длительность", biggestWin: "макс. выигрыш", seatsWord: "мест", receipt: "чек",
    newTable: "На главную",
    friendsTitle: "Друзья", friendsSub: "Те, с кем вы играете. Добавьте один раз — приглашайте быстро.",
    addFriend: "Добавить друга", addByHandle: "по @нику", handlePh: "@ник", add: "Добавить",
    friendAdded: (n) => `${n} добавлен в друзья`, noFriends: "Друзей пока нет.",
    togetherN: (n) => `${n} стол${n === 1 ? "" : n < 5 ? "а" : "ов"} вместе`, inviteToNext: "Позвать в игру",
    yourInvite: "ваш код для приглашения", shareHandle: "Поделитесь своим @ником, чтобы друзья добавили вас.",
    createProfile: "Создать профиль", regBlurb: "Это ваше имя за столом — ник и валюта, в которой вы играете.",
    yourName: "ваше имя", username: "ник", homeCur: "основная валюта", pickColour: "ваш цвет",
    saveProfile: "Сохранить профиль", profileSaved: "Профиль готов",
    lifetime: "за всё время", gamesPlayed: "столов", netLifetime: "итог", biggestNight: "лучший вечер", hoursPlayed: "часов",
    historyTitle: "история", noHistory: "Сыгранных столов пока нет.", editProfile: "Изменить профиль",
    appearance: "оформление", theme: "палитра", langLabel: "язык",
    won: "выиграл", lost: "проиграл", vs: "против", playersN: (n) => `${n} игроков`,
    simWallet: "тестовый кошелёк", chargedToCard: (r) => `${r} · списание с карты`,
    payWithWallet: "Оплатить кошельком", authorising: "Списание…", paidWord: "Оплачено", cancel: "Отмена",
    buyinReason: "вход", rebuyReason: "докупка",
    chargedLog: (n, r, m, c) => `${n} — ${r} ${m} списано · ${c} фишек выдано`,
    recordedLog: (n, r, m) => `${n} — ${r} ${m} записано`,
    thu: "Четверговая игра", you: "Вы",
  },
};

const Lang = createContext({ L: DICT.en, lang: "en", M: (n, c) => c + n });
const useL = () => useContext(Lang);
function money(n, cur = "£", lang = "en") {
  return cur + Math.abs(n).toLocaleString(DICT[lang]._loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ═══════════════════════ chip + QR ═══════════════════════ */
const Chip = ({ size = 26, color = C.brass, spot = "rgba(255,255,255,.55)" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: "block" }}>
    <circle cx="20" cy="20" r="19" fill={color} />
    <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(0,0,0,.4)" strokeWidth="4" strokeDasharray="7 6" />
    <circle cx="20" cy="20" r="12.5" fill="none" stroke={spot} strokeWidth="1.4" opacity=".7" />
    <circle cx="20" cy="20" r="9" fill="rgba(0,0,0,.18)" />
  </svg>
);

// A QR-styled code: real finder patterns + a deterministic data field
// seeded by the value. Reads unmistakably as a QR for the invite flow.
// (In production, swap this for a scannable encoder like `qrcode`.)
function QRCode({ value, size = 168, fg = "#141018", bg = "#F4F1EA" }) {
  const N = 25;
  const matrix = useMemo(() => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < value.length; i++) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
    const m = Array.from({ length: N }, () => Array(N).fill(false));
    const reserved = Array.from({ length: N }, () => Array(N).fill(false));
    const finder = (R, Cc) => {
      for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
        const rr = R + r, cc = Cc + c;
        if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
        reserved[rr][cc] = true;
        const on = r >= 0 && r <= 6 && c >= 0 && c <= 6 &&
          (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        m[rr][cc] = on;
      }
    };
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
    for (let i = 8; i < N - 8; i++) { m[6][i] = i % 2 === 0; m[i][6] = i % 2 === 0; reserved[6][i] = reserved[i][6] = true; }
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!reserved[r][c]) m[r][c] = rnd() > 0.52;
    return m;
  }, [value]);
  const cell = size / (N + 4);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", borderRadius: 12 }}>
      <rect width={size} height={size} fill={bg} />
      {matrix.map((row, r) => row.map((on, c) => on && (
        <rect key={`${r}-${c}`} x={(c + 2) * cell} y={(r + 2) * cell} width={cell} height={cell} fill={fg} rx={cell * 0.18} />
      )))}
    </svg>
  );
}

/* ═══════════════════════ settlement maths ═══════════════════════ */
function simplify(nets) {
  const debt = nets.filter(n => n.net < -0.004).map(n => ({ ...n, amt: -n.net })).sort((a, b) => b.amt - a.amt);
  const cred = nets.filter(n => n.net > 0.004).map(n => ({ ...n, amt: n.net })).sort((a, b) => b.amt - a.amt);
  const tx = []; let i = 0, j = 0;
  while (i < debt.length && j < cred.length) {
    const amt = Math.min(debt[i].amt, cred[j].amt);
    tx.push({ from: debt[i], to: cred[j], amount: amt });
    debt[i].amt -= amt; cred[j].amt -= amt;
    if (debt[i].amt < 0.005) i++;
    if (cred[j].amt < 0.005) j++;
  }
  return tx;
}

/* ═══════════════════════ atoms ═══════════════════════ */
const Eyebrow = ({ children, tone = C.mute }) => (
  <div style={{ font: "600 10px/1 'IBM Plex Mono', monospace", letterSpacing: ".16em", textTransform: "uppercase", color: tone }}>{children}</div>
);
const Btn = ({ children, onClick, disabled, tone = "brass", full, small }) => {
  const map = { brass: { bg: C.brass, fg: C.onAccent, bd: C.brass }, ghost: { bg: "transparent", fg: C.ivory, bd: C.line }, danger: { bg: "transparent", fg: C.lose, bd: C.lose } }[tone];
  return (
    <button onClick={onClick} disabled={disabled} className={`${full ? "w-full" : ""} rounded-lg transition-opacity`}
      style={{ background: map.bg, color: map.fg, border: `1px solid ${map.bd}`, padding: small ? "8px 12px" : "13px 18px",
        font: `600 ${small ? 12 : 14}px 'Inter Tight', system-ui, sans-serif`, letterSpacing: ".01em", opacity: disabled ? 0.35 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>{children}</button>
  );
};
const Field = ({ label, suffix, ...p }) => (
  <label className="block">
    <Eyebrow>{label}</Eyebrow>
    <div className="flex items-baseline gap-2 mt-2 pb-2" style={{ borderBottom: `1px solid ${C.line}` }}>
      <input {...p} className="bg-transparent outline-none w-full" style={{ font: "500 22px 'IBM Plex Mono', monospace", color: C.ivory }} />
      {suffix && <span style={{ font: "400 12px 'IBM Plex Mono',monospace", color: C.mute }}>{suffix}</span>}
    </div>
  </label>
);
const Row = ({ children, onClick, active }) => (
  <div onClick={onClick} className="flex items-center gap-3 px-4 py-3 rounded-xl"
    style={{ background: active ? C.raise : C.room, border: `1px solid ${active ? C.line : "transparent"}`, cursor: onClick ? "pointer" : "default" }}>{children}</div>
);
const Dot = ({ p, size = 30 }) => (
  <div className="shrink-0 grid place-items-center rounded-full"
    style={{ width: size, height: size, background: p.color + "22", border: `1.5px solid ${p.color}`, color: p.color, font: `700 ${size / 2.6}px 'Inter Tight',sans-serif` }}>
    {(p.name || "?").slice(0, 1).toUpperCase()}</div>
);

/* ═══════════════════════ root ═══════════════════════ */
export default function ColourUp() {
  const [themeKey, setThemeKey] = useState("trust");
  const [lang, setLang] = useState("en");
  const L = DICT[lang];
  const M = (n, cur) => money(n, cur, lang);
  const t = THEMES[themeKey];

  const [tab, setTab] = useState("play");

  // profile + social (client-side mock; a real build persists these server-side)
  const [profile, setProfile] = useState({ registered: false, name: "You", handle: "@you", currency: "₸", color: PALETTE[3] });
  const [friends, setFriends] = useState([
    { id: "f1", name: "Nadia", handle: "@nads", color: PALETTE[1], together: 6 },
    { id: "f2", name: "Tom", handle: "@tomcat", color: PALETTE[2], together: 4 },
    { id: "f3", name: "Priya", handle: "@priya", color: PALETTE[4], together: 9 },
    { id: "f4", name: "Sanzhar", handle: "@sanya", color: PALETTE[0], together: 2 },
  ]);
  const [history, setHistory] = useState([
    { id: "h1", title: "Kitchen table", date: Date.now() - 3 * 864e5, cur: "₸", meNet: 14500, players: 5, duration: 12600, mode: "pot" },
    { id: "h2", title: "Late night", date: Date.now() - 9 * 864e5, cur: "₸", meNet: -6000, players: 4, duration: 9000, mode: "receipt" },
  ]);

  // game engine
  const [gp, setGp] = useState("home"); // home | setup | lobby | fund | live | cashout | reconcile | settle | done
  const [cfg, setCfg] = useState({ title: DICT.en.thu, cur: profile.currency, buyIn: 5000, chips: 5000, scan: null, mode: "receipt", maxRebuys: 3 });
  const [players, setPlayers] = useState([]);
  const [me, setMe] = useState("p0");
  const [log, setLog] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [started, setStarted] = useState(null);
  const [lobbyCode, setLobbyCode] = useState("");
  const [joinSheet, setJoinSheet] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => { const i = setInterval(() => setTick(x => x + 1), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { document.body.style.background = t.ink; }, [t.ink]);

  function mkLog(text) { setLog(l => [{ t: new Date(), text }, ...l]); }
  function mk(name, i, host = false, color) {
    return { id: "p" + i + "_" + Math.random().toString(36).slice(2, 6), name, color: color || PALETTE[i % PALETTE.length], host, agreed: false, entries: [], chips: null, submitted: false, approved: false, out: false };
  }
  const upd = (id, patch) => setPlayers(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));

  const rate = cfg.chips / cfg.buyIn;
  const inAll = players.reduce((s, p) => s + p.entries.reduce((a, e) => a + e.amount, 0), 0);
  const chipsOut = players.reduce((s, p) => s + p.entries.reduce((a, e) => a + e.chips, 0), 0);
  const counted = players.reduce((s, p) => s + (p.chips ?? 0), 0);
  const drift = counted - chipsOut;
  const allAgreed = players.length > 0 && players.every(p => p.agreed);
  const allFunded = players.length > 0 && players.every(p => p.entries.length > 0);
  const allSubmitted = players.length > 0 && players.every(p => p.submitted);
  const allApproved = players.length > 0 && players.every(p => p.approved);
  const viewer = players.find(p => p.id === me) || players[0];
  const isHost = viewer?.host;

  const nets = useMemo(() => players.map(p => {
    const put = p.entries.reduce((a, e) => a + e.amount, 0);
    const got = (p.chips ?? 0) / rate;
    return { id: p.id, name: p.name, color: p.color, put, got, net: got - put };
  }), [players, rate]);
  const transfers = useMemo(() => simplify(nets), [nets]);

  const elapsed = started ? Math.floor((Date.now() - started) / 1000) : 0;
  const hhmm = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(Math.floor(elapsed / 60) % 60).padStart(2, "0")}`;
  const gameLive = ["lobby", "fund", "live", "cashout", "reconcile", "settle"].includes(gp);

  function startHost() {
    const host = mk(profile.name, 0, true, profile.color); host.id = "p0";
    setPlayers([host]);
    setMe("p0"); setCfg(c => ({ ...c, cur: profile.currency, scan: null, chips: c.buyIn })); setLog([]); setStarted(null);
    setLobbyCode(genCode()); setGp("setup"); setTab("play");
  }
  const genCode = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

  function addSeatNamed(name, color) { setPlayers(ps => [...ps, mk(name, ps.length, false, color)]); }
  function simulateJoin() {
    const seatedNames = new Set(players.map(p => p.name));
    const pool = friends.filter(f => !seatedNames.has(f.name));
    const g = pool[0];
    const p = mk(g ? g.name : "Guest", players.length, false, g ? g.color : undefined);
    setPlayers(ps => [...ps, p]);
    mkLog(L.joinedLog(p.name));
  }

  function confirmPay() {
    const { pid, amount, reason } = sheet;
    const p = players.find(x => x.id === pid);
    upd(pid, { entries: [...p.entries, { amount, chips: amount * rate, at: Date.now(), kind: reason }] });
    mkLog(L.chargedLog(p.name, reason === "buy-in" ? L.buyinReason : L.rebuyReason, M(amount, cfg.cur), (amount * rate).toLocaleString()));
    setSheet(null);
  }
  const requestPay = (pid, amount, reason) => setSheet({ pid, amount, reason });
  function recordEntry(pid, amount, reason) {
    const p = players.find(x => x.id === pid);
    upd(pid, { entries: [...p.entries, { amount, chips: amount * rate, at: Date.now(), kind: reason }] });
    mkLog(L.recordedLog(p.name, reason === "buy-in" ? L.buyinReason : L.rebuyReason, M(amount, cfg.cur)));
  }

  function release() {
    const host = players.find(p => p.host);
    const hostNet = nets.find(n => n.id === host?.id)?.net ?? 0;
    setHistory(h => [{ id: "h" + Date.now(), title: cfg.title, date: Date.now(), cur: cfg.cur, meNet: hostNet, players: players.length, duration: elapsed, mode: cfg.mode }, ...h]);
    setGp("done");
    mkLog(cfg.mode === "pot" ? L.settledPotLog : L.settledReceiptLog(L.transferN(transfers.length)));
    mkLog(L.savedLog);
  }
  function backHome() { setGp("home"); setPlayers([]); setStarted(null); setLog([]); }

  const ctx = { L, lang, M };

  return (
    <Lang.Provider value={ctx}>
      <div style={{ ...themeVars(t), background: C.ink, minHeight: "100vh", color: C.ivory }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Inter+Tight:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
          * { -webkit-tap-highlight-color: transparent; }
          .disp { font-family:'Bricolage Grotesque', system-ui, sans-serif; }
          .body { font-family:'Inter Tight', system-ui, sans-serif; }
          .mono { font-family:'IBM Plex Mono', ui-monospace, monospace; }
          input[type=number]::-webkit-inner-spin-button{ -webkit-appearance:none; }
          @media (prefers-reduced-motion: reduce){ *{ transition:none!important; animation:none!important; } }
          button:focus-visible{ outline:2px solid ${t.brass}; outline-offset:2px; }
          .spin{ animation: sp 1s linear infinite; } @keyframes sp{ to{ transform: rotate(360deg);} }
        `}</style>

        <div className="mx-auto body" style={{ maxWidth: 460, paddingBottom: 108 }}>
          {/* header */}
          <div className="flex items-center justify-between px-5 pt-6 pb-4">
            <div className="flex items-center gap-2">
              <Chip size={20} color={C.gold} />
              <span className="disp" style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-.02em" }}>{L.brand}</span>
            </div>
            <div className="flex items-center gap-2.5">
              {started && gameLive && <span className="mono flex items-center gap-1" style={{ fontSize: 11, color: C.mute }}><Clock size={11} /> {hhmm}</span>}
              <div className="relative">
                <button onClick={() => setShowThemes(s => !s)} className="grid place-items-center rounded-full" style={{ width: 28, height: 28, border: `1px solid ${C.line}`, background: showThemes ? C.raise : C.room }} aria-label="Palette">
                  <Palette size={14} style={{ color: C.brass }} />
                </button>
                {showThemes && (
                  <div className="absolute right-0 mt-2 p-2 rounded-2xl z-40 flex gap-2" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                    {Object.entries(THEMES).map(([k, th]) => (
                      <button key={k} onClick={() => { setThemeKey(k); setShowThemes(false); }} className="rounded-xl p-1.5 flex gap-1" style={{ border: `1px solid ${k === themeKey ? th.swatch[1] : "transparent"}`, background: th.swatch[0] }} aria-label={th.name[lang]}>
                        {th.swatch.map((c, i) => <span key={i} style={{ width: 14, height: 22, borderRadius: 4, background: c }} />)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setLang(l => l === "en" ? "ru" : "en")} className="flex items-center gap-1 rounded-full px-2 py-1" style={{ border: `1px solid ${C.line}`, background: C.room, height: 28 }} aria-label="Language">
                <Languages size={13} style={{ color: C.brass }} />
                <span className="mono" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em" }}>
                  <span style={{ color: lang === "en" ? C.ivory : C.mute }}>EN</span>
                  <span style={{ color: C.line, margin: "0 3px" }}>/</span>
                  <span style={{ color: lang === "ru" ? C.ivory : C.mute }}>RU</span>
                </span>
              </button>
              <button onClick={() => setShowLog(s => !s)} style={{ color: showLog ? C.brass : C.mute }} aria-label="Ledger"><ScrollText size={16} /></button>
            </div>
          </div>

          {tab === "play" && (["cashout", "reconcile", "settle", "done"].includes(gp) || inAll > 0) && <PotRail {...{ inAll, chipsOut, counted, gp, cfg, drift }} />}
          {showLog && <LedgerPanel log={log} />}

          <div className="px-5">
            {tab === "play" && (<>
              {gp === "home" && <PlayHome {...{ profile, history, gameLive, startHost, setJoinSheet, setGp, setTab }} />}
              {gp === "setup" && <Setup {...{ cfg, setCfg, players, setPlayers, addSeatNamed, friends, setGp, mkLog, mk }} />}
              {gp === "lobby" && <Lobby {...{ cfg, players, viewer, upd, allAgreed, setGp, mkLog, lobbyCode, simulateJoin }} />}
              {gp === "fund" && <Fund {...{ cfg, players, viewer, requestPay, recordEntry, allFunded, setGp, setStarted, mkLog }} />}
              {gp === "live" && <Live {...{ cfg, players, viewer, requestPay, recordEntry, rate, isHost, upd, mkLog, setGp }} />}
              {gp === "cashout" && <Cashout {...{ cfg, players, viewer, upd, rate, allSubmitted, setGp, mkLog }} />}
              {gp === "reconcile" && <Reconcile {...{ cfg, players, upd, drift, chipsOut, counted, setGp, mkLog }} />}
              {gp === "settle" && <Settle {...{ cfg, nets, transfers, players, viewer, upd, allApproved, release }} />}
              {gp === "done" && <Done {...{ cfg, nets, transfers, elapsed, backHome, players }} />}
            </>)}
            {tab === "friends" && <FriendsTab {...{ friends, setFriends, mkLog, gameLive, addSeatNamed }} />}
            {tab === "profile" && <ProfileTab {...{ profile, setProfile, history, themeKey, setThemeKey, lang, setLang }} />}
          </div>

          {/* device switcher during a live game */}
          {tab === "play" && gameLive && players.length > 0 && (
            <div className="fixed left-0 right-0 mx-auto" style={{ maxWidth: 460, bottom: 68 }}>
              <div className="mx-4 mb-2 px-3 py-2 rounded-2xl flex items-center gap-2 overflow-x-auto" style={{ background: C.raise + "ee", border: `1px solid ${C.line}`, backdropFilter: "blur(12px)" }}>
                <Eye size={13} style={{ color: C.mute, flexShrink: 0 }} />
                {players.map(p => (
                  <button key={p.id} onClick={() => setMe(p.id)} className="shrink-0 px-2 py-1 rounded-full flex items-center gap-1.5" style={{ background: me === p.id ? p.color + "22" : "transparent", border: `1px solid ${me === p.id ? p.color : "transparent"}` }}>
                    <Dot p={p} size={18} /><span style={{ fontSize: 11, fontWeight: 600, color: me === p.id ? C.ivory : C.mute }}>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* bottom tab bar */}
          <div className="fixed left-0 right-0 bottom-0 mx-auto" style={{ maxWidth: 460 }}>
            <div className="flex" style={{ background: C.sheet + "f2", borderTop: `1px solid ${C.line}`, backdropFilter: "blur(12px)" }}>
              {[["play", L.tabPlay, Spade], ["friends", L.tabFriends, Users], ["profile", L.tabYou, User]].map(([k, label, Icon]) => (
                <button key={k} onClick={() => setTab(k)} className="flex-1 flex flex-col items-center gap-1 py-2.5" style={{ color: tab === k ? C.brass : C.mute }}>
                  <Icon size={19} fill={tab === k && k === "play" ? C.brass : "none"} />
                  <span style={{ fontSize: 10.5, fontWeight: 600 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {sheet && <PaySheet sheet={sheet} cfg={cfg} players={players} onCancel={() => setSheet(null)} onConfirm={confirmPay} />}
        {joinSheet && <JoinSheet onClose={() => setJoinSheet(false)} />}
      </div>
    </Lang.Provider>
  );
}

/* ═══════════════════════ pot rail ═══════════════════════ */
function PotRail({ inAll, chipsOut, counted, gp, cfg, drift }) {
  const { L, M } = useL();
  const counting = ["cashout", "reconcile", "settle", "done"].includes(gp);
  const pct = chipsOut ? Math.min(counted / chipsOut, 1.4) : 0;
  const off = counting && counted > 0 && Math.abs(drift) > 0;
  return (
    <div className="mx-5 mb-5 p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
      <div className="flex items-end justify-between">
        <div>
          <Eyebrow>{counting ? L.countedIssued : L.inPot}</Eyebrow>
          <div className="disp mt-1" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1 }}>
            {counting ? <>{counted.toLocaleString()}<span style={{ color: C.mute, fontSize: 18, fontWeight: 500 }}> / {chipsOut.toLocaleString()}</span></> : M(inAll, cfg.cur)}
          </div>
        </div>
        <div className="flex -space-x-2 items-center">{DENOMS.slice(2).map((d, i) => <Chip key={i} size={22} color={d.c} />)}</div>
      </div>
      {counting && (<>
        <div className="mt-3 h-1.5 rounded-full overflow-hidden relative" style={{ background: C.raise }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 1) * 100}%`, background: off ? C.lose : C.win, transition: "width .4s ease" }} />
          <div className="absolute top-0 bottom-0" style={{ left: "100%", width: 2, background: C.brass }} />
        </div>
        <div className="mono mt-2" style={{ fontSize: 10.5, color: off ? C.lose : C.mute }}>{counted === 0 ? L.waitingCounts : off ? L.drift(drift) : L.balanced}</div>
      </>)}
    </div>
  );
}

/* ═══════════════════════ ledger ═══════════════════════ */
function LedgerPanel({ log }) {
  const { L, lang } = useL();
  return (
    <div className="mx-5 mb-5 p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
      <Eyebrow>{L.ledger}</Eyebrow>
      <div className="mt-3 space-y-2" style={{ maxHeight: 180, overflowY: "auto" }}>
        {log.length === 0 && <div className="mono" style={{ fontSize: 11, color: C.mute }}>{L.nothingYet}</div>}
        {log.map((l, i) => (
          <div key={i} className="mono flex gap-3" style={{ fontSize: 11, color: C.mute }}>
            <span style={{ color: C.line, flexShrink: 0 }}>{l.t.toLocaleTimeString(DICT[lang]._loc, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            <span style={{ color: C.sub }}>{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════ play home ═══════════════════════ */
function PlayHome({ profile, history, gameLive, startHost, setJoinSheet, setGp, setTab }) {
  const { L, M } = useL();
  const recent = history.slice(0, 3);
  return (
    <div className="space-y-6">
      <div>
        <div className="disp" style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.05 }}>{L.homeHi(profile.name)}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.homeSub}</p>
      </div>

      {gameLive && (
        <button onClick={() => setGp("lobby")} className="w-full text-left p-4 rounded-2xl flex items-center gap-3" style={{ background: C.brassSoft, border: `1px solid ${C.brass}` }}>
          <span className="grid place-items-center rounded-full" style={{ width: 38, height: 38, background: C.brass, color: C.onAccent }}><Spade size={18} /></span>
          <div className="flex-1"><div style={{ fontSize: 14.5, fontWeight: 700 }}>{L.resume}</div><div className="mono" style={{ fontSize: 11, color: C.mute }}>{L.resumeSub(profile.name)}</div></div>
          <ChevronRight size={18} style={{ color: C.brass }} />
        </button>
      )}

      <div className="grid gap-3">
        <button onClick={startHost} className="text-left p-5 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-3">
            <span className="grid place-items-center rounded-xl" style={{ width: 40, height: 40, background: C.brass, color: C.onAccent }}><Plus size={20} /></span>
            <ChevronRight size={18} style={{ color: C.mute }} />
          </div>
          <div className="disp" style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em" }}>{L.hostGame}</div>
          <div style={{ fontSize: 12.5, color: C.mute, marginTop: 2 }}>{L.hostGameSub}</div>
        </button>
        <button onClick={() => setJoinSheet(true)} className="text-left p-5 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-3">
            <span className="grid place-items-center rounded-xl" style={{ width: 40, height: 40, background: C.raise, color: C.brass, border: `1px solid ${C.line}` }}><QrCode size={20} /></span>
            <ChevronRight size={18} style={{ color: C.mute }} />
          </div>
          <div className="disp" style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em" }}>{L.joinGame}</div>
          <div style={{ fontSize: 12.5, color: C.mute, marginTop: 2 }}>{L.joinGameSub}</div>
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Eyebrow>{L.recent}</Eyebrow>
          {history.length > 0 && <button onClick={() => setTab("profile")} className="mono" style={{ fontSize: 11, color: C.brass }}>{L.historyTitle} →</button>}
        </div>
        {recent.length === 0
          ? <div className="mono px-4 py-6 rounded-xl text-center" style={{ fontSize: 12, color: C.mute, background: C.room }}>{L.noHistoryHome}</div>
          : <div className="space-y-2">{recent.map(h => <HistoryRow key={h.id} h={h} />)}</div>}
      </div>
    </div>
  );
}
function HistoryRow({ h }) {
  const { M, lang } = useL();
  const w = h.meNet >= 0;
  const d = new Date(h.date);
  const mon = d.toLocaleDateString(DICT[lang]._loc, { month: "short" }).replace(".", "");
  const full = d.toLocaleDateString(DICT[lang]._loc, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString(DICT[lang]._loc, { hour: "2-digit", minute: "2-digit" });
  return (
    <Row>
      <div className="grid shrink-0 rounded-lg text-center" style={{ width: 40, height: 40, background: C.raise, border: `1px solid ${C.line}`, placeItems: "center", lineHeight: 1 }}>
        <span className="mono" style={{ fontSize: 8, color: C.brass, letterSpacing: ".06em", textTransform: "uppercase" }}>{mon}</span>
        <span className="disp" style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{d.getDate()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{h.title}</div>
        <div className="mono" style={{ fontSize: 10.5, color: C.mute }}>{full} · {time} · {Math.floor(h.duration / 3600)}h {Math.floor(h.duration / 60) % 60}m</div>
      </div>
      <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: w ? C.win : C.lose }}>{w ? "+" : "−"}{M(h.meNet, h.cur)}</span>
    </Row>
  );
}

/* ═══════════════════════ setup ═══════════════════════ */
function Setup({ cfg, setCfg, players, setPlayers, addSeatNamed, friends, setGp, mkLog, mk }) {
  const { L, M } = useL();
  const seated = new Set(players.map(p => p.name));
  const [pickFriends, setPickFriends] = useState(false);
  const [scanning, setScanning] = useState(false);
  return (
    <div className="space-y-7">
      <div>
        <div className="disp" style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.05 }}>{L.openTable}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.setupBlurb}</p>
      </div>
      <Field label={L.game} value={cfg.title} onChange={e => setCfg({ ...cfg, title: e.target.value })} />
      <div className="grid grid-cols-2 gap-5 items-end">
        <Field label={L.buyIn} type="number" value={cfg.buyIn} suffix={cfg.cur}
          onChange={e => { const b = Math.max(1, +e.target.value || 0); setCfg(c => ({ ...c, buyIn: b, chips: c.scan ? c.chips : b })); }} />
        <div>
          <Eyebrow>{L.currency}</Eyebrow>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {CURRENCIES.map(cu => (
              <button key={cu} onClick={() => setCfg({ ...cfg, cur: cu })} className="rounded-lg mono" style={{ width: 38, height: 36, fontSize: 15, fontWeight: 600, background: cfg.cur === cu ? C.brass : C.room, color: cfg.cur === cu ? C.onAccent : C.ivory, border: `1px solid ${cfg.cur === cu ? C.brass : C.line}` }}>{cu}</button>
            ))}
          </div>
        </div>
      </div>

      {/* starting stack — cash by default, or scan a physical set */}
      <div>
        <Eyebrow>{L.startingStack}</Eyebrow>
        {cfg.scan ? (
          <div className="mt-2 p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.brass}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">{cfg.scan.colors.slice(0, 5).map((c, i) => <span key={i} style={{ width: 18, height: 18, borderRadius: 99, background: c.hex, border: `1.5px solid ${C.room}` }} />)}</div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{L.scannedSummary(cfg.scan.colors.length, cfg.scan.stackValue.toLocaleString())}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {cfg.scan.colors.map((c, i) => (
                <span key={i} className="mono flex items-center gap-1.5" style={{ fontSize: 11, color: C.mute }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: c.hex }} /> {c.denom.toLocaleString()} × {c.perPlayer}
                </span>
              ))}
            </div>
            <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
              <button onClick={() => setScanning(true)} className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600, color: C.brass }}><Camera size={13} /> {L.rescan}</button>
              <button onClick={() => setCfg(c => ({ ...c, scan: null, chips: c.buyIn }))} className="flex items-center gap-1.5" style={{ fontSize: 12, color: C.mute }}><X size={13} /> {L.clearScan}</button>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-3 p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
            <Coins size={18} style={{ color: C.mute, flexShrink: 0 }} />
            <div className="flex-1">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{L.countAsCash(cfg.cur)}</div>
              <div style={{ fontSize: 11.5, color: C.mute, lineHeight: 1.4 }}>{L.countAsCashNote}</div>
            </div>
            <button onClick={() => setScanning(true)} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ background: C.brassSoft, border: `1px solid ${C.brass}`, fontSize: 12, fontWeight: 600, color: C.brass }}><Camera size={14} /> {L.scanSet}</button>
          </div>
        )}
      </div>
      <div>
        <Eyebrow>{L.howMoney}</Eyebrow>
        <div className="mt-2 flex gap-3 p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
          <Receipt size={18} style={{ color: C.brass, flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{L.receiptT}</div>
            <div style={{ fontSize: 11.5, color: C.mute, lineHeight: 1.45 }}>{L.receiptD}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2.5 p-3.5 rounded-xl" style={{ background: C.brassSoft, border: `1px solid ${C.line}` }}>
        <QrCode size={16} style={{ color: C.brass, flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.4 }}>{L.seatsAfter}</span>
      </div>
      <Btn full onClick={() => { setGp("lobby"); mkLog(L.tableOpened(M(cfg.buyIn, cfg.cur), cfg.chips.toLocaleString())); }}>{L.openLobby} <ChevronRight size={15} className="inline -mt-0.5" /></Btn>

      {scanning && (
        <ChipScanner P={Math.max(players.length, 1)} onClose={() => setScanning(false)}
          onApply={(scan) => { setCfg(c => ({ ...c, scan, chips: scan.stackValue })); setScanning(false); }} />
      )}
    </div>
  );
}

/* ═══════════════════════ lobby + invite ═══════════════════════ */
function Lobby({ cfg, players, viewer, upd, allAgreed, setGp, mkLog, lobbyCode, simulateJoin }) {
  const { L, M } = useL();
  const [copied, setCopied] = useState(false);
  const link = `poker.table/j/${lobbyCode}`;
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>{L.stepOne}</Eyebrow>
        <div className="disp mt-1" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{L.agreeStake}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.lobbyBlurb(M(cfg.buyIn, cfg.cur), cfg.chips.toLocaleString())}</p>
      </div>

      {/* QR invite */}
      <div className="p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
        <Eyebrow>{L.invite}</Eyebrow>
        <div className="flex gap-4 mt-3">
          <div className="shrink-0 p-2 rounded-2xl" style={{ background: "#F4F1EA" }}><QRCode value={link} size={116} /></div>
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{L.scanToJoin}</div>
              <div className="mono mt-2" style={{ fontSize: 10, color: C.mute, letterSpacing: ".12em" }}>{L.orCode}</div>
              <div className="mono mt-1" style={{ fontSize: 22, fontWeight: 600, letterSpacing: ".14em", color: C.brass }}>{lobbyCode}</div>
            </div>
            <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }} className="flex items-center gap-1.5 mt-2" style={{ fontSize: 12, fontWeight: 600, color: copied ? C.win : C.ivory }}>
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? L.copied : L.copyLink}
            </button>
          </div>
        </div>
        <button onClick={simulateJoin} className="w-full mt-3 py-2 rounded-lg flex items-center justify-center gap-1.5" style={{ background: C.raise, border: `1px dashed ${C.line}`, fontSize: 11.5, color: C.mute }}>
          <Sparkles size={12} style={{ color: C.brass }} /> {L.simJoin}
        </button>
      </div>

      <div className="space-y-2">
        {players.map(p => (
          <Row key={p.id}>
            <Dot p={p} />
            <span className="flex-1" style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
            {p.agreed ? <span className="flex items-center gap-1 mono" style={{ fontSize: 10.5, color: C.win }}><Check size={13} /> {L.agreed}</span> : <span className="mono" style={{ fontSize: 10.5, color: C.mute }}>{L.waiting}</span>}
          </Row>
        ))}
      </div>

      {!viewer.agreed ? (
        <div className="p-4 rounded-2xl space-y-3" style={{ background: C.raise, border: `1px solid ${C.brassSoft}` }}>
          <div style={{ fontSize: 13.5 }}><span style={{ color: C.mute }}>{L.onPhone(viewer.name)}</span> {L.agreeQ(M(cfg.buyIn, cfg.cur))}</div>
          <div className="flex gap-2">
            <Btn full onClick={() => { upd(viewer.id, { agreed: true }); mkLog(L.agreedLog(viewer.name, M(cfg.buyIn, cfg.cur))); }}>{L.agree}</Btn>
            <Btn tone="danger" onClick={() => mkLog(L.declinedLog(viewer.name))}>{L.decline}</Btn>
          </div>
        </div>
      ) : (
        <Btn full disabled={!allAgreed || players.length < 2} onClick={() => setGp("fund")}>{players.length < 2 ? L.waitingSeats(1) : allAgreed ? L.takeBuyins : L.waitingSeats(players.filter(p => !p.agreed).length)}</Btn>
      )}
    </div>
  );
}

/* ═══════════════════════ fund ═══════════════════════ */
function Fund({ cfg, players, viewer, requestPay, recordEntry, allFunded, setGp, setStarted, mkLog }) {
  const { L, M } = useL();
  const paid = viewer.entries.length > 0;
  const isPot = cfg.mode === "pot";
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>{L.stepTwo}</Eyebrow>
        <div className="disp mt-1" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{L.buyInTitle}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{isPot ? L.fundPot : L.fundReceipt}</p>
      </div>
      <div className="space-y-2">
        {players.map(p => (
          <Row key={p.id}>
            <Dot p={p} />
            <span className="flex-1" style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
            {p.entries.length
              ? <span className="mono flex items-center gap-1" style={{ fontSize: 10.5, color: C.win }}><Check size={11} /> {M(cfg.buyIn, cfg.cur)} {isPot ? L.paidTag : L.inTag}</span>
              : <span className="mono" style={{ fontSize: 10.5, color: C.mute }}>{L.unpaid}</span>}
          </Row>
        ))}
      </div>
      {!paid
        ? <Btn full onClick={() => isPot ? requestPay(viewer.id, cfg.buyIn, "buy-in") : recordEntry(viewer.id, cfg.buyIn, "buy-in")}><Wallet size={15} className="inline -mt-0.5 mr-1.5" /> {isPot ? L.authorise(M(cfg.buyIn, cfg.cur)) : `${L.buyInTitle} · ${M(cfg.buyIn, cfg.cur)}`}</Btn>
        : <Btn full disabled={!allFunded} onClick={() => { setGp("live"); setStarted(Date.now()); mkLog(L.cardsUp); }}>{allFunded ? L.deal : L.waitingBuyins(players.filter(p => !p.entries.length).length)}</Btn>}
    </div>
  );
}

/* ═══════════════════════ live ═══════════════════════ */
function Live({ cfg, players, viewer, requestPay, recordEntry, rate, isHost, upd, mkLog, setGp }) {
  const { L, M } = useL();
  const myIn = viewer.entries.reduce((a, e) => a + e.amount, 0);
  const isPot = cfg.mode === "pot";
  return (
    <div className="space-y-6">
      <div><Eyebrow tone={C.win}>{L.live}</Eyebrow><div className="disp mt-1" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{cfg.title}</div></div>
      <div className="space-y-2">
        {players.map(p => {
          const put = p.entries.reduce((a, e) => a + e.amount, 0);
          return (
            <Row key={p.id}>
              <Dot p={p} />
              <div className="flex-1">
                <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name} {p.out && <span className="mono" style={{ fontSize: 10, color: C.mute }}>{L.leftTag}</span>}</div>
                <div className="mono" style={{ fontSize: 10.5, color: C.mute }}>{L.buyinsChips(p.entries.length, (put * rate).toLocaleString())}</div>
              </div>
              <span className="mono" style={{ fontSize: 13, color: C.ivory }}>{M(put, cfg.cur)}</span>
            </Row>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Btn tone="ghost" full disabled={viewer.entries.length >= cfg.maxRebuys + 1} onClick={() => isPot ? requestPay(viewer.id, cfg.buyIn, "re-buy") : recordEntry(viewer.id, cfg.buyIn, "re-buy")}><Plus size={14} className="inline -mt-0.5 mr-1" /> {L.rebuy}</Btn>
        <Btn tone="ghost" full onClick={() => { upd(viewer.id, { out: true }); mkLog(L.cashingEarly(viewer.name)); }}><LogOut size={14} className="inline -mt-0.5 mr-1" /> {L.cashEarly}</Btn>
      </div>
      <div className="p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
        <Eyebrow>{L.exposure(viewer.name)}</Eyebrow>
        <div className="disp mt-1" style={{ fontSize: 24, fontWeight: 800 }}>{M(myIn, cfg.cur)}</div>
        <div className="mono mt-1" style={{ fontSize: 10.5, color: C.mute }}>{isPot ? L.exposureNotePot : L.exposureNoteReceipt}</div>
      </div>
      {isHost ? <Btn full onClick={() => setGp("cashout")}>{L.lastHand}</Btn> : <div className="mono text-center" style={{ fontSize: 11, color: C.mute }}>{L.bankerOnly}</div>}
    </div>
  );
}

/* ═══════════════════════ cashout ═══════════════════════ */
function Cashout({ cfg, players, viewer, upd, rate, allSubmitted, setGp, mkLog }) {
  const { L, M } = useL();
  const [byDenom, setByDenom] = useState(false);
  const [counts, setCounts] = useState({});
  const [quick, setQuick] = useState("");
  const [photoState, setPhotoState] = useState("idle"); // idle | analyzing | done | error
  const denoms = cfg.scan ? cfg.scan.colors.map(c => ({ v: c.denom, c: c.hex, n: c.denom.toLocaleString() })) : DENOMS;
  const denomTotal = denoms.reduce((s, d, i) => s + d.v * (counts[i] || 0), 0);
  const value = byDenom ? denomTotal : (+quick || 0);
  useEffect(() => { setCounts({}); setQuick(viewer.submitted ? (viewer.chips ?? "") : ""); setPhotoState("idle"); }, [viewer.id, viewer.submitted]);

  async function onStackPhoto(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = String(reader.result).split(",")[1];
      setPhotoState("analyzing");
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-6", max_tokens: 1000,
            messages: [{ role: "user", content: [
              { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
              { type: "text", text: 'This is a photo of one poker player\'s chip stack at the end of a game. Count the chips of each distinct colour. Respond with ONLY compact JSON, no prose: {"chips":[{"color":"<name>","hex":"#rrggbb","count":<integer>}]}.' },
            ] }],
          }),
        });
        const data = await res.json();
        const text = (data.content || []).map(b => (b.type === "text" ? b.text : "")).join("\n");
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        const next = {};
        (parsed.chips || []).forEach(c => { const idx = nearestDenomIndex(normHex(c.hex), denoms); next[idx] = (next[idx] || 0) + Math.max(0, Math.round(+c.count || 0)); });
        if (!Object.keys(next).length) throw new Error("empty");
        setCounts(next); setByDenom(true); setPhotoState("done");
      } catch (err) { setPhotoState("error"); }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      <div><Eyebrow>{L.stepThree}</Eyebrow><div className="disp mt-1" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{L.countStack}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.cashoutBlurb}</p></div>
      {!viewer.submitted && (
        <div className="p-4 rounded-2xl space-y-4" style={{ background: C.raise, border: `1px solid ${C.brassSoft}` }}>
          <span style={{ fontSize: 13, color: C.mute }}>{L.someonesStack(viewer.name)}</span>

          {/* input-mode picker — big buttons */}
          <div className="grid grid-cols-2 gap-2">
            {[["total", L.typeTotal, Calculator, false], ["colour", L.countColour, Coins, true]].map(([k, label, Icon, denomMode]) => (
              <button key={k} onClick={() => setByDenom(denomMode)}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl py-3.5"
                style={{ background: byDenom === denomMode ? C.brass : C.room, color: byDenom === denomMode ? C.onAccent : C.ivory, border: `1px solid ${byDenom === denomMode ? C.brass : C.line}` }}>
                <Icon size={19} /><span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
              </button>
            ))}
          </div>

          {/* photo count */}
          <label className="block rounded-xl cursor-pointer" style={{ border: `1px dashed ${photoState === "error" ? C.lose : C.brass}`, background: C.brassSoft }}>
            <input type="file" accept="image/*" capture="environment" onChange={onStackPhoto} style={{ display: "none" }} />
            <div className="flex items-center justify-center gap-2 py-2.5" style={{ color: photoState === "error" ? C.lose : C.brass, fontSize: 12.5, fontWeight: 600 }}>
              {photoState === "analyzing" ? <><span className="spin"><RotateCcw size={14} /></span> {L.countingPhoto}</> : <><Camera size={15} /> {L.photoStack}</>}
            </div>
          </label>
          {photoState === "done" && <div className="mono flex items-start gap-1.5" style={{ fontSize: 11, color: C.win, lineHeight: 1.4 }}><Check size={12} style={{ marginTop: 1, flexShrink: 0 }} /> {L.fromPhoto}</div>}
          {photoState === "error" && <div className="mono flex items-start gap-1.5" style={{ fontSize: 11, color: C.lose, lineHeight: 1.4 }}><AlertTriangle size={12} style={{ marginTop: 1, flexShrink: 0 }} /> {L.photoFailed}</div>}

          {byDenom ? (
            <div className="space-y-2 pt-1">{denoms.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <Chip size={22} color={d.c} /><span className="mono flex-1" style={{ fontSize: 12, color: C.mute }}>{d.n}</span>
                <input type="number" value={counts[i] ?? ""} placeholder="0" onChange={e => setCounts({ ...counts, [i]: Math.max(0, +e.target.value || 0) })} className="bg-transparent outline-none text-right mono" style={{ width: 64, fontSize: 16, color: C.ivory, borderBottom: `1px solid ${C.line}` }} />
              </div>))}</div>
          ) : (
            <input type="number" autoFocus value={quick} placeholder="0" onChange={e => setQuick(e.target.value)} className="bg-transparent outline-none w-full mono" style={{ fontSize: 38, fontWeight: 600, color: C.ivory, borderBottom: `1px solid ${C.line}`, paddingBottom: 6 }} />
          )}
          <div className="flex items-baseline justify-between"><span className="mono" style={{ fontSize: 11, color: C.mute }}>{value.toLocaleString()} {L.chipsWord}</span><span className="disp" style={{ fontSize: 20, fontWeight: 800 }}>{M(value / rate, cfg.cur)}</span></div>
          <Btn full disabled={!byDenom && String(quick).trim() === ""} onClick={() => { upd(viewer.id, { chips: value, submitted: true }); mkLog(L.countedLog(viewer.name, value.toLocaleString())); }}>{L.lockStack}</Btn>
        </div>
      )}
      <div className="space-y-2">
        {players.map(p => (
          <Row key={p.id}>
            <Dot p={p} /><span className="flex-1" style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
            {p.submitted ? <span className="mono flex items-center gap-1.5" style={{ fontSize: 11, color: C.win }}><Check size={12} />{p.id === viewer.id ? p.chips.toLocaleString() : L.countedTag}</span> : <span className="mono" style={{ fontSize: 10.5, color: C.mute }}>{L.countingTag}</span>}
          </Row>
        ))}
      </div>
      <Btn full disabled={!allSubmitted} onClick={() => setGp("reconcile")}>{allSubmitted ? L.checkBooks : L.waitingStacks(players.filter(p => !p.submitted).length)}</Btn>
    </div>
  );
}

/* ═══════════════════════ reconcile ═══════════════════════ */
function Reconcile({ cfg, players, upd, drift, chipsOut, counted, setGp, mkLog }) {
  const { L } = useL();
  const ok = drift === 0;
  const close = !ok && Math.abs(drift) <= Math.round(chipsOut * 0.005);
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow tone={ok ? C.win : C.lose}>{L.stepFour}</Eyebrow>
        <div className="disp mt-1" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{ok ? L.booksBalance : L.countOff}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{ok ? L.reconOk(counted.toLocaleString(), chipsOut.toLocaleString()) : L.reconBad(counted.toLocaleString(), chipsOut.toLocaleString(), Math.abs(drift).toLocaleString(), drift > 0 ? L.tooMany : L.unaccounted)}</p>
      </div>
      {!ok && (
        <div className="p-3.5 rounded-xl flex gap-3" style={{ background: C.lose + "1e", border: `1px solid ${C.lose}55` }}>
          <AlertTriangle size={16} style={{ color: C.lose, flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: C.lose, lineHeight: 1.45, opacity: .95 }}>{close ? L.closeMsg : L.bigGap}</div>
        </div>
      )}
      <div className="space-y-2">
        {players.map(p => (
          <Row key={p.id}>
            <Dot p={p} /><span className="flex-1" style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: ok ? C.ivory : C.sub }}>{(p.chips ?? 0).toLocaleString()}</span>
          </Row>
        ))}
      </div>
      {ok ? (
        <Btn full onClick={() => { setGp("settle"); mkLog(L.booksBalancedLog); }}>{L.drawSettle}</Btn>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 px-1" style={{ color: C.mute }}>
            <Lock size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11.5, lineHeight: 1.45 }}>{L.reconLocked}</span>
          </div>
          <Btn full onClick={() => { players.forEach(p => upd(p.id, { submitted: false, chips: null })); setGp("cashout"); mkLog(L.recountLog); }}>
            <RotateCcw size={15} className="inline -mt-0.5 mr-1.5" /> {L.recountAll}
          </Btn>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ settle ═══════════════════════ */
function Settle({ cfg, nets, transfers, players, viewer, upd, allApproved, release }) {
  const { L, M } = useL();
  const sorted = [...nets].sort((a, b) => b.net - a.net);
  const naive = players.length * (players.length - 1) / 2;
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>{L.stepFive}</Eyebrow>
        <div className="disp mt-1" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{L.settleUp}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{cfg.mode === "pot" ? L.settlePot : L.settleReceipt(L.transferN(transfers.length), L.paymentN(naive))}</p>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
        <div className="flex px-4 py-2" style={{ background: C.raise }}>
          <span className="mono flex-1" style={{ fontSize: 9.5, color: C.mute, letterSpacing: ".12em" }}>{L.colSeat}</span>
          <span className="mono" style={{ fontSize: 9.5, color: C.mute, letterSpacing: ".12em", width: 62, textAlign: "right" }}>{L.colIn}</span>
          <span className="mono" style={{ fontSize: 9.5, color: C.mute, letterSpacing: ".12em", width: 62, textAlign: "right" }}>{L.colOut}</span>
          <span className="mono" style={{ fontSize: 9.5, color: C.mute, letterSpacing: ".12em", width: 72, textAlign: "right" }}>{L.colNet}</span>
        </div>
        {sorted.map(n => (
          <div key={n.id} className="flex items-center px-4 py-3" style={{ background: C.room, borderTop: `1px solid ${C.line}` }}>
            <span className="flex-1 flex items-center gap-2" style={{ fontSize: 13.5, fontWeight: 500 }}><span style={{ width: 6, height: 6, borderRadius: 99, background: n.color }} />{n.name}</span>
            <span className="mono" style={{ fontSize: 12, color: C.mute, width: 62, textAlign: "right" }}>{M(n.put, cfg.cur)}</span>
            <span className="mono" style={{ fontSize: 12, color: C.mute, width: 62, textAlign: "right" }}>{M(n.got, cfg.cur)}</span>
            <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, width: 72, textAlign: "right", color: n.net >= 0 ? C.win : C.lose }}>{n.net >= 0 ? "+" : "−"}{M(n.net, cfg.cur)}</span>
          </div>
        ))}
      </div>
      {cfg.mode === "receipt" && (
        <div className="space-y-2">
          <Eyebrow>{L.transfers}</Eyebrow>
          {transfers.map((t, i) => (
            <Row key={i}><span style={{ fontSize: 13.5, fontWeight: 500 }}>{t.from.name}</span><ArrowRight size={13} style={{ color: C.mute }} /><span style={{ fontSize: 13.5, fontWeight: 500 }}>{t.to.name}</span><span className="mono flex-1 text-right" style={{ fontSize: 13.5, color: C.brass }}>{M(t.amount, cfg.cur)}</span></Row>
          ))}
          {!transfers.length && <div className="mono" style={{ fontSize: 11, color: C.mute }}>{L.allLevel}</div>}
        </div>
      )}
      <div className="space-y-2">
        <Eyebrow>{L.signoff}</Eyebrow>
        {players.map(p => (
          <Row key={p.id}><Dot p={p} /><span className="flex-1" style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>{p.approved ? <span className="mono flex items-center gap-1" style={{ fontSize: 10.5, color: C.win }}><Check size={12} /> {L.signed}</span> : <span className="mono" style={{ fontSize: 10.5, color: C.mute }}>{L.pending}</span>}</Row>
        ))}
      </div>
      {!viewer.approved
        ? <Btn full onClick={() => upd(viewer.id, { approved: true })}><ShieldCheck size={15} className="inline -mt-0.5 mr-1.5" /> {L.thisRight(viewer.name)}</Btn>
        : <Btn full disabled={!allApproved} onClick={release}>{allApproved ? (cfg.mode === "pot" ? L.payEveryone : L.finaliseReceipt) : L.waitingSigs(players.filter(p => !p.approved).length)}</Btn>}
    </div>
  );
}

/* ═══════════════════════ done ═══════════════════════ */
function Done({ cfg, nets, transfers, elapsed, backHome, players }) {
  const { L, M } = useL();
  const sorted = [...nets].sort((a, b) => b.net - a.net);
  const top = sorted[0]; const hrs = Math.max(elapsed / 3600, 0.01);
  const pot = nets.reduce((s, n) => s + n.put, 0);
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="flex justify-center mb-4"><Chip size={44} color={C.gold} /></div>
        <div className="disp" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.03em" }}>{L.settled}</div>
        <p className="mt-1.5" style={{ fontSize: 13, color: C.mute }}>{cfg.title} · {L.throughTable(M(pot, cfg.cur))}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[[L.length, `${Math.floor(elapsed / 3600)}h ${Math.floor(elapsed / 60) % 60}m`], [L.biggestWin, `+${M(top.net, cfg.cur)}`], [L.seatsWord, players.length]].map(([k, v]) => (
          <div key={k} className="p-3 rounded-xl text-center" style={{ background: C.room, border: `1px solid ${C.line}` }}><Eyebrow>{k}</Eyebrow><div className="mono mt-1.5" style={{ fontSize: 14, fontWeight: 600 }}>{v}</div></div>
        ))}
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: C.raise }}><Receipt size={13} style={{ color: C.gold }} /><Eyebrow tone={C.gold}>{L.receipt}</Eyebrow></div>
        {sorted.map(n => (
          <div key={n.id} className="px-4 py-3 flex items-center" style={{ background: C.room, borderTop: `1px solid ${C.line}` }}>
            <span className="flex-1" style={{ fontSize: 13.5, fontWeight: 500 }}>{n.name}</span>
            <span className="mono" style={{ fontSize: 11, color: C.mute, marginRight: 12 }}>{(n.net / n.put * 100).toFixed(0)}% · {M(n.net / hrs, cfg.cur)}/hr</span>
            <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: n.net >= 0 ? C.win : C.lose }}>{n.net >= 0 ? "+" : "−"}{M(n.net, cfg.cur)}</span>
          </div>
        ))}
      </div>
      {cfg.mode === "receipt" && transfers.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: C.raise }}><ArrowRight size={13} style={{ color: C.brass }} /><Eyebrow tone={C.brass}>{L.transfers}</Eyebrow></div>
          {transfers.map((t, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-2" style={{ background: C.room, borderTop: `1px solid ${C.line}` }}>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{t.from.name}</span>
              <ArrowRight size={13} style={{ color: C.mute }} />
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{t.to.name}</span>
              <span className="mono flex-1 text-right" style={{ fontSize: 14, fontWeight: 600, color: C.brass }}>{M(t.amount, cfg.cur)}</span>
            </div>
          ))}
        </div>
      )}
      <Btn tone="ghost" full onClick={backHome}><RotateCcw size={14} className="inline -mt-0.5 mr-1.5" /> {L.newTable}</Btn>
    </div>
  );
}

/* ═══════════════════════ friends ═══════════════════════ */
function FriendsTab({ friends, setFriends, mkLog, gameLive, addSeatNamed }) {
  const { L } = useL();
  const [handle, setHandle] = useState("");
  const [added, setAdded] = useState(null);
  function add() {
    const h = handle.trim().replace(/^@?/, "@");
    if (h.length < 2) return;
    const name = h.slice(1).replace(/^\w/, c => c.toUpperCase());
    const f = { id: "f" + Date.now(), name, handle: h, color: PALETTE[friends.length % PALETTE.length], together: 0 };
    setFriends(fs => [f, ...fs]); setHandle(""); setAdded(name); mkLog(L.friendAdded(name)); setTimeout(() => setAdded(null), 1600);
  }
  return (
    <div className="space-y-6">
      <div><div className="disp" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{L.friendsTitle}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.friendsSub}</p></div>

      <div className="p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
        <Eyebrow>{L.addFriend} · {L.addByHandle}</Eyebrow>
        <div className="flex gap-2 mt-3">
          <input value={handle} onChange={e => setHandle(e.target.value)} placeholder={L.handlePh} onKeyDown={e => e.key === "Enter" && add()} className="flex-1 bg-transparent outline-none mono" style={{ fontSize: 16, color: C.ivory, borderBottom: `1px solid ${C.line}`, paddingBottom: 6 }} />
          <Btn small onClick={add} disabled={handle.trim().length < 2}>{L.add}</Btn>
        </div>
        {added && <div className="mono mt-2 flex items-center gap-1" style={{ fontSize: 11, color: C.win }}><Check size={12} /> {L.friendAdded(added)}</div>}
      </div>

      <div className="space-y-2">
        {friends.length === 0 && <div className="mono px-4 py-6 rounded-xl text-center" style={{ fontSize: 12, color: C.mute, background: C.room }}>{L.noFriends}</div>}
        {friends.map(f => (
          <Row key={f.id}>
            <Dot p={f} size={34} />
            <div className="flex-1"><div style={{ fontSize: 14, fontWeight: 600 }}>{f.name}</div><div className="mono" style={{ fontSize: 10.5, color: C.mute }}>{f.handle} · {L.togetherN(f.together)}</div></div>
            {gameLive
              ? <button onClick={() => addSeatNamed(f.name, f.color)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full" style={{ background: C.brassSoft, border: `1px solid ${C.brass}`, fontSize: 11, fontWeight: 600, color: C.brass }}><Plus size={12} /> {L.inviteToNext}</button>
              : <span className="grid place-items-center rounded-full" style={{ width: 30, height: 30, background: C.raise, color: C.mute }}><User size={14} /></span>}
          </Row>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════ profile ═══════════════════════ */
function ProfileTab({ profile, setProfile, history, themeKey, setThemeKey, lang, setLang }) {
  const { L, M, lang: cur } = useL();
  const [editing, setEditing] = useState(!profile.registered);
  const [draft, setDraft] = useState(profile);
  useEffect(() => { setDraft(profile); }, [profile.registered]);

  const stats = useMemo(() => {
    const games = history.length;
    const net = history.reduce((s, h) => s + h.meNet, 0);
    const best = history.reduce((m, h) => Math.max(m, h.meNet), 0);
    const hours = history.reduce((s, h) => s + h.duration, 0) / 3600;
    const cur = history[0]?.cur || profile.currency;
    return { games, net, best, hours, cur };
  }, [history, profile.currency]);

  if (editing) {
    return (
      <div className="space-y-6">
        <div><div className="disp" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{profile.registered ? L.editProfile : L.createProfile}</div>
          <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.regBlurb}</p></div>
        <div className="flex justify-center py-2"><Dot p={draft} size={72} /></div>
        <Field label={L.yourName} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
        <Field label={L.username} value={draft.handle} onChange={e => setDraft({ ...draft, handle: e.target.value.replace(/^@?/, "@") })} />
        <div>
          <Eyebrow>{L.pickColour}</Eyebrow>
          <div className="flex flex-wrap gap-2 mt-2">
            {PALETTE.map(c => <button key={c} onClick={() => setDraft({ ...draft, color: c })} className="rounded-full" style={{ width: 34, height: 34, background: c + "22", border: `2px solid ${draft.color === c ? c : "transparent"}` }}><span className="block mx-auto rounded-full" style={{ width: 16, height: 16, background: c }} /></button>)}
          </div>
        </div>
        <div>
          <Eyebrow>{L.homeCur}</Eyebrow>
          <div className="flex gap-2 mt-2">{CURRENCIES.map(cu => <button key={cu} onClick={() => setDraft({ ...draft, currency: cu })} className="rounded-lg mono" style={{ width: 44, height: 40, fontSize: 16, fontWeight: 600, background: draft.currency === cu ? C.brass : C.room, color: draft.currency === cu ? C.onAccent : C.ivory, border: `1px solid ${draft.currency === cu ? C.brass : C.line}` }}>{cu}</button>)}</div>
        </div>
        <Btn full disabled={!draft.name.trim() || draft.handle.length < 2} onClick={() => { setProfile({ ...draft, registered: true }); setEditing(false); }}>{L.saveProfile}</Btn>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Dot p={profile} size={56} />
        <div className="flex-1"><div className="disp" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>{profile.name}</div><div className="mono" style={{ fontSize: 12, color: C.mute }}>{profile.handle}</div></div>
        <button onClick={() => setEditing(true)} className="grid place-items-center rounded-full" style={{ width: 34, height: 34, background: C.room, border: `1px solid ${C.line}`, color: C.mute }}><User size={15} /></button>
      </div>

      <div>
        <Eyebrow>{L.lifetime}</Eyebrow>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[[L.gamesPlayed, stats.games, Spade], [L.netLifetime, `${stats.net >= 0 ? "+" : "−"}${M(stats.net, stats.cur)}`, TrendingUp], [L.biggestNight, `+${M(stats.best, stats.cur)}`, Trophy], [L.hoursPlayed, stats.hours.toFixed(1), Clock]].map(([k, v, Icon], i) => (
            <div key={i} className="p-3.5 rounded-xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-1.5" style={{ color: i === 2 ? C.gold : C.mute }}><Icon size={12} /><Eyebrow tone={i === 2 ? C.gold : C.mute}>{k}</Eyebrow></div>
              <div className="disp mt-1.5" style={{ fontSize: 20, fontWeight: 800, color: (i === 1 && stats.net < 0) ? C.lose : i === 1 ? C.win : i === 2 ? C.gold : C.ivory }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-2" style={{ color: C.mute }}><History size={12} /><Eyebrow>{L.historyTitle}</Eyebrow></div>
        {history.length === 0 ? <div className="mono px-4 py-6 rounded-xl text-center" style={{ fontSize: 12, color: C.mute, background: C.room }}>{L.noHistory}</div>
          : <div className="space-y-2">{history.map(h => <HistoryRow key={h.id} h={h} />)}</div>}
      </div>

      <div>
        <Eyebrow>{L.appearance}</Eyebrow>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2"><Palette size={15} style={{ color: C.brass }} /><span style={{ fontSize: 13.5, fontWeight: 600 }}>{L.theme}</span></div>
            <div className="flex gap-2">{Object.entries(THEMES).map(([k, th]) => (
              <button key={k} onClick={() => setThemeKey(k)} className="rounded-lg p-1 flex gap-0.5" style={{ border: `1px solid ${k === themeKey ? th.swatch[1] : C.line}`, background: th.swatch[0] }} aria-label={th.name[cur]}>
                {th.swatch.map((c, i) => <span key={i} style={{ width: 9, height: 18, borderRadius: 3, background: c }} />)}
              </button>))}</div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2"><Languages size={15} style={{ color: C.brass }} /><span style={{ fontSize: 13.5, fontWeight: 600 }}>{L.langLabel}</span></div>
            <div className="flex gap-2">{[["en", "English"], ["ru", "Русский"]].map(([k, lbl]) => (
              <button key={k} onClick={() => setLang(k)} className="rounded-lg px-3 py-1.5" style={{ fontSize: 12, fontWeight: 600, background: lang === k ? C.brass : C.raise, color: lang === k ? C.onAccent : C.mute, border: `1px solid ${lang === k ? C.brass : C.line}` }}>{lbl}</button>))}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ join sheet ═══════════════════════ */
function JoinSheet({ onClose }) {
  const { L } = useL();
  const [code, setCode] = useState("");
  const [state, setState] = useState("idle"); // idle | searching | none
  function tryJoin() { setState("searching"); setTimeout(() => setState("none"), 1400); }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(6,6,10,.72)" }}>
      <div className="w-full rounded-t-3xl p-5 pb-8" style={{ maxWidth: 460, background: C.sheet, border: `1px solid ${C.line}` }}>
        <div className="mx-auto mb-5" style={{ width: 36, height: 4, borderRadius: 99, background: C.line }} />
        <div className="disp" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>{L.joinTitle}</div>
        <p className="mt-2" style={{ fontSize: 13, color: C.mute, lineHeight: 1.5 }}>{L.joinBlurb}</p>
        <div className="mt-5 rounded-2xl grid place-items-center" style={{ aspectRatio: "1.5", background: C.room, border: `1px dashed ${C.line}` }}>
          <div className="text-center" style={{ color: C.mute }}><Camera size={26} style={{ margin: "0 auto 8px" }} /><div className="mono" style={{ fontSize: 11 }}>{L.scanFrame}</div></div>
        </div>
        <div className="mt-5"><Eyebrow>{L.enterCodeLabel}</Eyebrow>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="XXXXXX" maxLength={6} className="w-full bg-transparent outline-none mono mt-2 pb-2" style={{ fontSize: 30, fontWeight: 600, letterSpacing: ".22em", color: C.ivory, borderBottom: `1px solid ${C.line}` }} />
        </div>
        {state === "none" && <div className="mono mt-3 flex items-center gap-1.5" style={{ fontSize: 11.5, color: C.lose }}><AlertTriangle size={12} /> {L.noTable}</div>}
        <div className="mt-5">
          <Btn full disabled={code.length < 4 || state === "searching"} onClick={tryJoin}>{state === "searching" ? <><span className="spin inline-block mr-2"><RotateCcw size={14} /></span>{L.lookingFor}</> : L.joinBtn}</Btn>
          <button onClick={onClose} className="w-full mt-3" style={{ fontSize: 12.5, color: C.mute }}>{L.cancel}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ chip-set scanner ═══════════════════════
   Photo → (vision) colour + count per chip → assign denominations and
   split an even starting stack across P players. Denominations climb a
   standard ladder, most-numerous colour gets the smallest value, and the
   top denomination is trimmed so value isn't locked in a couple of big
   chips. Vision runs through the in-artifact model call; if it's
   unavailable the same UI works fully by hand.                          */
const LADDER = [1, 5, 25, 100, 500, 1000, 5000];
function assignDenoms(colors) {
  const order = [...colors.keys()].sort((a, b) => (colors[b].count || 0) - (colors[a].count || 0));
  order.forEach((idx, rank) => { colors[idx] = { ...colors[idx], denom: LADDER[Math.min(rank, LADDER.length - 1)] }; });
  return colors;
}
function computeStacks(colors, P) {
  const p = Math.max(P, 1);
  const per = colors.map(c => Math.max(0, Math.floor((c.count || 0) / p)));
  for (let it = 0; it < 300; it++) {
    const total = colors.reduce((s, c, i) => s + c.denom * per[i], 0);
    if (total <= 0) break;
    const idxs = [...colors.keys()].sort((a, b) => colors[b].denom - colors[a].denom);
    let changed = false;
    for (const i of idxs) { if (per[i] > 1 && colors[i].denom * per[i] > 0.55 * total) { per[i]--; changed = true; break; } }
    if (!changed) break;
  }
  return { per, stackValue: colors.reduce((s, c, i) => s + c.denom * per[i], 0) };
}
const normHex = (h) => { if (typeof h !== "string") return null; const s = h.trim(); return /^#?[0-9a-fA-F]{6}$/.test(s) ? (s[0] === "#" ? s : "#" + s) : null; };
function hexToRgb(h) { let x = (h || "#000000").replace("#", ""); if (x.length === 3) x = x.split("").map(c => c + c).join(""); const n = parseInt(x, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function nearestDenomIndex(hex, denoms) { const [r, g, b] = hexToRgb(hex || "#808080"); let best = 0, bd = Infinity; denoms.forEach((d, i) => { const [R, G, B] = hexToRgb(d.c); const dist = (r - R) ** 2 + (g - G) ** 2 + (b - B) ** 2; if (dist < bd) { bd = dist; best = i; } }); return best; }

function ChipScanner({ P, onClose, onApply }) {
  const { L } = useL();
  const [state, setState] = useState("idle"); // idle | analyzing | done | error
  const [preview, setPreview] = useState(null);
  const [colors, setColors] = useState([]);
  const [np, setNp] = useState(Math.max(P || 6, 2));

  const { per, stackValue } = useMemo(() => computeStacks(colors, np), [colors, np]);

  async function onFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      setPreview(dataUrl);
      const base64 = String(dataUrl).split(",")[1];
      setState("analyzing");
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-6", max_tokens: 1000,
            messages: [{ role: "user", content: [
              { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
              { type: "text", text: 'This is a photo of poker chips, usually grouped or stacked by colour. Identify each DISTINCT chip colour and estimate the TOTAL number of chips of that colour visible. Respond with ONLY compact JSON, no prose or markdown: {"chips":[{"color":"<name>","hex":"#rrggbb","count":<integer>}]}. Use common colour names and your best count estimate.' },
            ] }],
          }),
        });
        const data = await res.json();
        const text = (data.content || []).map(b => (b.type === "text" ? b.text : "")).join("\n");
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        let cols = (parsed.chips || []).map((c, i) => ({
          name: c.color || `Colour ${i + 1}`, hex: normHex(c.hex) || PALETTE[i % PALETTE.length],
          count: Math.max(0, Math.round(+c.count || 0)), denom: 1,
        })).slice(0, 7);
        if (!cols.length) throw new Error("empty");
        setColors(assignDenoms(cols)); setState("done");
      } catch (err) {
        setColors(assignDenoms([
          { name: "White", hex: "#DDD5C6", count: 100, denom: 1 },
          { name: "Red", hex: "#B33A3A", count: 100, denom: 1 },
          { name: "Green", hex: "#3E8A5F", count: 50, denom: 1 },
          { name: "Black", hex: "#22222A", count: 25, denom: 1 },
        ]));
        setState("error");
      }
    };
    reader.readAsDataURL(file);
  }

  const cycleDenom = (i) => setColors(cs => cs.map((c, j) => j === i ? { ...c, denom: LADDER[(LADDER.indexOf(c.denom) + 1) % LADDER.length] } : c));
  const setCount = (i, v) => setColors(cs => cs.map((c, j) => j === i ? { ...c, count: Math.max(0, v) } : c));
  const addColour = () => setColors(cs => [...cs, { name: "Colour", hex: PALETTE[cs.length % PALETTE.length], count: 0, denom: LADDER[Math.min(cs.length, LADDER.length - 1)] }]);
  const removeColour = (i) => setColors(cs => cs.filter((_, j) => j !== i));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(6,6,10,.75)" }}>
      <div className="w-full rounded-t-3xl p-5 pb-8" style={{ maxWidth: 460, maxHeight: "92vh", overflowY: "auto", background: C.sheet, border: `1px solid ${C.line}` }}>
        <div className="mx-auto mb-4" style={{ width: 36, height: 4, borderRadius: 99, background: C.line }} />
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-3">
            <div className="disp" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>{L.scanTitle}</div>
            <p className="mt-1.5" style={{ fontSize: 12.5, color: C.mute, lineHeight: 1.5 }}>{L.scanBlurb}</p>
          </div>
          <button onClick={onClose} style={{ color: C.mute }}><X size={18} /></button>
        </div>

        {/* photo area */}
        <label className="block mt-4 rounded-2xl overflow-hidden cursor-pointer" style={{ border: `1px dashed ${C.line}` }}>
          <input type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: "none" }} />
          {preview ? (
            <div className="relative">
              <img src={preview} alt="chips" style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block", opacity: state === "analyzing" ? 0.5 : 1 }} />
              {state === "analyzing" && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: C.sheet + "d9", color: C.brass, fontSize: 12, fontWeight: 600 }}>
                    <span className="spin"><RotateCcw size={13} /></span> {L.analyzing}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid place-items-center py-8" style={{ color: C.mute }}>
              <Camera size={26} /><div className="mt-2" style={{ fontSize: 12.5, fontWeight: 600 }}>{L.takePhoto}</div>
            </div>
          )}
        </label>

        {state === "error" && <div className="mono mt-3 flex items-start gap-1.5" style={{ fontSize: 11.5, color: C.lose, lineHeight: 1.4 }}><AlertTriangle size={12} style={{ marginTop: 1, flexShrink: 0 }} /> {L.scanFailed}</div>}

        {colors.length > 0 && (<>
          <div className="flex items-center justify-between mt-5 mb-3 p-3 rounded-xl" style={{ background: C.raise, border: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{L.forPlayers(np)}</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setNp(n => Math.max(2, n - 1))} className="grid place-items-center rounded-full" style={{ width: 28, height: 28, background: C.room, border: `1px solid ${C.line}`, color: C.ivory }}>−</button>
              <span className="mono" style={{ fontSize: 16, fontWeight: 700, minWidth: 18, textAlign: "center" }}>{np}</span>
              <button onClick={() => setNp(n => Math.min(12, n + 1))} className="grid place-items-center rounded-full" style={{ width: 28, height: 28, background: C.room, border: `1px solid ${C.line}`, color: C.ivory }}>+</button>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <Eyebrow>{L.detected}</Eyebrow>
            <button onClick={addColour} className="flex items-center gap-1" style={{ fontSize: 11.5, fontWeight: 600, color: C.brass }}><Plus size={12} /> {L.addColour}</button>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 gap-y-1 items-center mb-1">
            <span /><span className="mono" style={{ fontSize: 9, color: C.mute, letterSpacing: ".1em" }}>{L.countLabel.toUpperCase()}</span>
            <span className="mono text-right" style={{ fontSize: 9, color: C.mute, letterSpacing: ".1em" }}>{L.worth.toUpperCase()}</span>
            <span className="mono text-right pr-1" style={{ fontSize: 9, color: C.mute, letterSpacing: ".1em" }}>{L.perPlayerCol.toUpperCase()}</span>
          </div>
          <div className="space-y-1.5">
            {colors.map((c, i) => {
              const short = c.count < np;
              return (
                <div key={i} className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 items-center rounded-xl px-2.5 py-2" style={{ background: C.room, border: `1px solid ${C.line}` }}>
                  <span className="rounded-full" style={{ width: 22, height: 22, background: c.hex, border: `1.5px solid rgba(255,255,255,.15)` }} />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <input type="number" value={c.count} onChange={e => setCount(i, +e.target.value || 0)} className="bg-transparent outline-none mono" style={{ width: 52, fontSize: 15, color: C.ivory, borderBottom: `1px solid ${C.line}` }} />
                    <button onClick={() => removeColour(i)} style={{ color: C.mute, opacity: .6 }}><X size={12} /></button>
                  </div>
                  <button onClick={() => cycleDenom(i)} title={L.tapValue} className="mono rounded-lg px-2 py-1" style={{ fontSize: 13, fontWeight: 600, color: C.brass, background: C.raise, border: `1px solid ${C.line}`, minWidth: 52, textAlign: "center" }}>{c.denom.toLocaleString()}</button>
                  <span className="mono text-right pr-1" style={{ fontSize: 13, fontWeight: 600, width: 48, color: short ? C.lose : C.ivory }}>{short ? L.notEnough(np) : `×${per[i]}`}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-end justify-between mt-4 p-3.5 rounded-xl" style={{ background: C.raise, border: `1px solid ${C.brassSoft}` }}>
            <div><Eyebrow>{L.stackWorth}</Eyebrow><div className="mono" style={{ fontSize: 10.5, color: C.brass, marginTop: 3 }}>{L.equalsBuyin}</div></div>
            <div className="disp" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>{stackValue.toLocaleString()}</div>
          </div>

          <div className="mt-4"><Btn full disabled={stackValue <= 0} onClick={() => onApply({ colors: colors.map((c, i) => ({ name: c.name, hex: c.hex, denom: c.denom, count: c.count, perPlayer: per[i] })), stackValue })}>{L.useSetup}</Btn></div>
        </>)}
      </div>
    </div>
  );
}

/* ═══════════════════════ pay sheet ═══════════════════════ */
function PaySheet({ sheet, cfg, players, onCancel, onConfirm }) {
  const { L, M } = useL();
  const p = players.find(x => x.id === sheet.pid);
  const [state, setState] = useState("idle");
  const reasonTxt = sheet.reason === "buy-in" ? L.buyinReason : L.rebuyReason;
  useEffect(() => { if (state !== "auth") return; const t = setTimeout(() => { setState("ok"); setTimeout(onConfirm, 550); }, 900); return () => clearTimeout(t); }, [state]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(6,6,10,.72)" }}>
      <div className="w-full rounded-t-3xl p-5 pb-8" style={{ maxWidth: 460, background: C.sheet, border: `1px solid ${C.line}` }}>
        <div className="mx-auto mb-5" style={{ width: 36, height: 4, borderRadius: 99, background: C.line }} />
        <div className="flex items-center justify-between mb-5"><div><Eyebrow>{L.simWallet}</Eyebrow><div className="body mt-1" style={{ fontSize: 15, fontWeight: 600 }}>{cfg.title}</div></div><Coins size={20} style={{ color: C.mute }} /></div>
        <div className="py-5 text-center" style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
          <Eyebrow>{L.chargedToCard(reasonTxt)}</Eyebrow>
          <div className="disp mt-2" style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-.04em" }}>{M(sheet.amount, cfg.cur)}</div>
          <div className="mono mt-1" style={{ fontSize: 11, color: C.mute }}>{p.name} · {(sheet.amount * (cfg.chips / cfg.buyIn)).toLocaleString()} {L.chipsWord}</div>
        </div>
        <div className="mt-5">
          {state === "ok" ? <div className="flex items-center justify-center gap-2 py-3.5" style={{ color: C.win, fontSize: 14, fontWeight: 600 }}><Check size={18} /> {L.paidWord}</div>
            : <><Btn full onClick={() => setState("auth")} disabled={state === "auth"}>{state === "auth" ? L.authorising : L.payWithWallet}</Btn><button onClick={onCancel} className="w-full mt-3" style={{ fontSize: 12.5, color: C.mute }}>{L.cancel}</button></>}
        </div>
      </div>
    </div>
  );
}
