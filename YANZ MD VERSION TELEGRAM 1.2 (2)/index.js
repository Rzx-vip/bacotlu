const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');

const bot = new Telegraf(config.BOT_TOKEN);
const OWNER_ID = Number(config.OWNER_ID);
const { DEFAULT_BUTTON_STYLE, EMOJI_MAP, BOT_IMAGE } = config;

// ==========================================
// 🔰 DATABASE SISTEM
// ==========================================
const DB_FOLDER = path.join(__dirname, 'db');
const GROUP_CONFIG_FILE = path.join(DB_FOLDER, 'groupSecurity.json');
const GROUP_MEMBERS_FILE = path.join(DB_FOLDER, 'groupMembers.json');
const WELCOME_CONFIG_FILE = path.join(DB_FOLDER, 'groupWelcome.json');
const LEFT_CONFIG_FILE = path.join(DB_FOLDER, 'groupLeft.json');
const SYS_CONFIG_FILE = path.join(DB_FOLDER, 'system.json');
const CUSTOM_LINKS_FILE = path.join(DB_FOLDER, 'customLinks.json');
const SHOLAT_CONFIG_FILE = path.join(DB_FOLDER, 'sholatConfig.json');
const WARN_CONFIG_FILE = path.join(DB_FOLDER, 'warnConfig.json');
const FILTER_CONFIG_FILE = path.join(DB_FOLDER, 'filterConfig.json');
const STOP_CONFIG_FILE = path.join(DB_FOLDER, 'stopConfig.json');
const USER_DB_FILE = path.join(DB_FOLDER, 'users.json');

if (!fs.existsSync(DB_FOLDER)) fs.mkdirSync(DB_FOLDER, { recursive: true });
if (!fs.existsSync(GROUP_CONFIG_FILE)) fs.writeFileSync(GROUP_CONFIG_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(GROUP_MEMBERS_FILE)) fs.writeFileSync(GROUP_MEMBERS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(WELCOME_CONFIG_FILE)) fs.writeFileSync(WELCOME_CONFIG_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(LEFT_CONFIG_FILE)) fs.writeFileSync(LEFT_CONFIG_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(SYS_CONFIG_FILE)) fs.writeFileSync(SYS_CONFIG_FILE, JSON.stringify({ maintenance: false }, null, 2));
if (!fs.existsSync(CUSTOM_LINKS_FILE)) fs.writeFileSync(CUSTOM_LINKS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(SHOLAT_CONFIG_FILE)) fs.writeFileSync(SHOLAT_CONFIG_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(WARN_CONFIG_FILE)) fs.writeFileSync(WARN_CONFIG_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(FILTER_CONFIG_FILE)) fs.writeFileSync(FILTER_CONFIG_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(STOP_CONFIG_FILE)) fs.writeFileSync(STOP_CONFIG_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(USER_DB_FILE)) fs.writeFileSync(USER_DB_FILE, JSON.stringify({ users: [] }, null, 2));

const loadGroupConfig = () => { try { return JSON.parse(fs.readFileSync(GROUP_CONFIG_FILE, 'utf8')); } catch { return {}; } };
const saveGroupConfig = data => fs.writeFileSync(GROUP_CONFIG_FILE, JSON.stringify(data, null, 2));
const loadGroupMembers = () => { try { return JSON.parse(fs.readFileSync(GROUP_MEMBERS_FILE, 'utf8')); } catch { return {}; } };
const saveGroupMembers = data => fs.writeFileSync(GROUP_MEMBERS_FILE, JSON.stringify(data, null, 2));
const loadWelcomeConfig = () => { try { return JSON.parse(fs.readFileSync(WELCOME_CONFIG_FILE, 'utf8')); } catch { return {}; } };
const saveWelcomeConfig = data => fs.writeFileSync(WELCOME_CONFIG_FILE, JSON.stringify(data, null, 2));
const loadLeftConfig = () => { try { return JSON.parse(fs.readFileSync(LEFT_CONFIG_FILE, 'utf8')); } catch { return {}; } };
const saveLeftConfig = data => fs.writeFileSync(LEFT_CONFIG_FILE, JSON.stringify(data, null, 2));
const loadSystem = () => { try { return JSON.parse(fs.readFileSync(SYS_CONFIG_FILE, 'utf8')); } catch { return { maintenance: false }; } };
const saveSystem = data => fs.writeFileSync(SYS_CONFIG_FILE, JSON.stringify(data, null, 2));
const loadCustomLinks = () => { try { return JSON.parse(fs.readFileSync(CUSTOM_LINKS_FILE, 'utf8')); } catch { return {}; } };
const saveCustomLinks = data => fs.writeFileSync(CUSTOM_LINKS_FILE, JSON.stringify(data, null, 2));
const loadSholatConfig = () => { try { return JSON.parse(fs.readFileSync(SHOLAT_CONFIG_FILE, 'utf8')); } catch { return {}; } };
const saveSholatConfig = data => fs.writeFileSync(SHOLAT_CONFIG_FILE, JSON.stringify(data, null, 2));
const loadWarnConfig = () => { try { return JSON.parse(fs.readFileSync(WARN_CONFIG_FILE, 'utf8')); } catch { return {}; } };
const saveWarnConfig = data => fs.writeFileSync(WARN_CONFIG_FILE, JSON.stringify(data, null, 2));
const loadFilterConfig = () => { try { return JSON.parse(fs.readFileSync(FILTER_CONFIG_FILE, 'utf8')); } catch { return {}; } };
const saveFilterConfig = data => fs.writeFileSync(FILTER_CONFIG_FILE, JSON.stringify(data, null, 2));
const loadStopConfig = () => { try { return JSON.parse(fs.readFileSync(STOP_CONFIG_FILE, 'utf8')); } catch { return {}; } };
const saveStopConfig = data => fs.writeFileSync(STOP_CONFIG_FILE, JSON.stringify(data, null, 2));
const loadUsers = () => { try { return JSON.parse(fs.readFileSync(USER_DB_FILE, 'utf8')); } catch { return { users: [] }; } };
const saveUsers = data => fs.writeFileSync(USER_DB_FILE, JSON.stringify(data, null, 2));

// ==========================================
// 📋 BROADCAST VARIABLES
// ==========================================
let broadcastRunning = false;
let broadcastPaused = false;
let broadcastStats = {
  total: 0,
  sent: 0,
  failed: 0,
  started: null,
  finished: null
};

// ==========================================
// 📋 TAGALL CACHE
// ==========================================
let memberCache = {};
let memberCacheTime = {};

// ❌ Daftar Kata Terlarang
const badWords = [
  'jomok','jilmek','memek','kontol','ngentot','binal','gatel','pepek','titit',
  'dick','pussy','sex','seks','bokep','porn','mesum','bego','bodoh','goblok',
  'ngentod','anjing','babi','tai','sial','brengsek','kampret','setan','kafir'
];

// ❌ Daftar Domain Promosi
const promoDomains = [
  't.me/','wa.me/','chat.whatsapp.com','instagram.com/','fb.me/','facebook.com/',
  'youtube.com/','youtu.be/','tiktok.com/','shopee.','tokopedia.','bukalapak.',
  'blibli.','lazada.','bit.ly','tinyurl.com','goo.gl','cutt.ly','linktr.ee','carrd.co'
];

// ❌ DAFTAR KATA PROMOSI JUAL BELI
const promoKeywords = [
  'jual','jualan','jual beli','jual script','jual bot','jual nokos','jual nomor',
  'jual akun','jual virtual','jual tool','jual cheat','jual panel','jual vps',
  'jual domain','jual hosting','jual server','jual database','jual exploit',
  'jual malware','jual virus','jual ransomware','jual spammer','jual scam',
  'jual hack','jual crack','jual key','jual license','jual premium',
  'jual crypto','jual bitcoin','jual eth','jual usdt','jual saldo',
  'jual ovo','jual gopay','jual dana','jual shopeepay','jual linkaja',
  'jual pulsa','jual kuota','jual paket data','jual emoney',
  'jual steam','jual spotify','jual netflix','jual disney','jual canva',
  'jual template','jual theme','jual plugin','jual addon','jual modul',
  'jual course','jual ebook','jual pdf','jual tutorial','jual mentor',
  'jual bimbingan','jual konsultasi','jual jasa','jual service',
  'beli','beli script','beli bot','beli nokos','beli nomor','beli akun',
  'beli virtual','beli tool','beli cheat','beli panel','beli vps',
  'beli domain','beli hosting','beli server','beli database','beli exploit',
  'beli malware','beli virus','beli ransomware','beli spammer','beli scam',
  'beli hack','beli crack','beli key','beli license','beli premium',
  'beli crypto','beli bitcoin','beli eth','beli usdt','beli saldo',
  'beli ovo','beli gopay','beli dana','beli shopeepay','beli linkaja',
  'beli pulsa','beli kuota','beli paket data','beli emoney',
  'beli steam','beli spotify','beli netflix','beli disney','beli canva',
  'beli template','beli theme','beli plugin','beli addon','beli modul',
  'beli course','beli ebook','beli pdf','beli tutorial','beli mentor',
  'beli bimbingan','beli konsultasi','beli jasa','beli service',
  'transaksi','transfer','bayar','dibayar','pembayaran','payment',
  'harga','price','cost','biaya','ongkos','tarif','rate',
  'diskusi','nego','negosiasi','tawar','menawar',
  'minat','berminat','tertarik','order','pesan','booking',
  'stok','tersedia','ready','available','stock',
  'garansi','warranty','refund','return','retur',
  'reseller','distributor','agen','dealer','supplier',
  'promo','diskon','discount','potongan','murah','murah meriah',
  'gratis','free','bonus','giveaway','hadiah',
  'open order','oo','open jasa','oj','open bot',
  'script','bot','nokos','nomor','akun','virtual','tool','cheat',
  'panel','vps','domain','hosting','server','database','exploit',
  'malware','virus','ransomware','spammer','scam','hack','crack',
  'key','license','premium','crypto','bitcoin','eth','usdt',
  'saldo','ovo','gopay','dana','shopeepay','linkaja','pulsa',
  'kuota','paket data','emoney','steam','spotify','netflix',
  'disney','canva','template','theme','plugin','addon','modul',
  'course','ebook','pdf','tutorial','mentor','bimbingan','konsultasi',
  'jasa','service','pw','njual','jualn','jualan','djual','dijual',
  'bjual','jul','nbeli','beliin','dbeli','dibeli','bbeli','bli',
  'cp','contact person','wa','telegram','dm','pm',
  'sedia','sediakan','menyediakan','menjual','menawarkan',
  'bisnis','usaha','dagang','trading','jualan online',
  'sell','selling','sale','for sale','buy','buying','purchase',
  'price','cost','fee','charge','payment','pay','paid',
  'stock','available','ready','order','booking','reserve',
  'discount','deal','offer','promotion','special price',
  'cheap','affordable','budget','economy','low price',
  'free','complimentary','bonus','gift','giveaway',
  'reseller','distributor','agent','dealer','supplier',
  'service','services','jasa','digital product',
  'script','bot','tool','cheat','panel','vps','domain',
  'hosting','server','database','exploit','malware','virus',
  'ransomware','spammer','scam','hack','crack','key',
  'license','premium','crypto','bitcoin','eth','usdt',
  'saldo','ovo','gopay','dana','shopeepay','pulsa',
  'steam','spotify','netflix','canva','template',
  'course','ebook','pdf','tutorial','mentor'
];

// ⏱️ Tracker Anti-Spam
let spamTracker = {};

// ==========================================
// 🎯 ANTI-SPAM STIKER
// ==========================================
const STICKER_SPAM_CONFIG = {
  MAX_STICKER_PER_MINUTE: 5,
  MUTE_DURATION: 300,
  CHECK_INTERVAL: 60000,
  WARNING_COUNT: 3
};

let stickerUserData = {};

function cleanStickerData() {
  const now = Date.now();
  for (const userId in stickerUserData) {
    if (now - stickerUserData[userId].lastActivity > 300000) {
      delete stickerUserData[userId];
    }
  }
}
setInterval(cleanStickerData, 300000);

// ==========================================
// 🕌 AUTO SHOLAT REMINDER
// ==========================================
let sholatInterval = null;
const SHOLAT_API = 'https://api.aladhan.com/v1/timingsByCity';

const KOTA_INDONESIA = {
  'jakarta': { city: 'Jakarta', country: 'Indonesia' },
  'bandung': { city: 'Bandung', country: 'Indonesia' },
  'surabaya': { city: 'Surabaya', country: 'Indonesia' },
  'medan': { city: 'Medan', country: 'Indonesia' },
  'makassar': { city: 'Makassar', country: 'Indonesia' },
  'semarang': { city: 'Semarang', country: 'Indonesia' },
  'yogyakarta': { city: 'Yogyakarta', country: 'Indonesia' },
  'denpasar': { city: 'Denpasar', country: 'Indonesia' },
  'palembang': { city: 'Palembang', country: 'Indonesia' },
  'pekanbaru': { city: 'Pekanbaru', country: 'Indonesia' },
  'bandar lampung': { city: 'Bandar Lampung', country: 'Indonesia' },
  'padang': { city: 'Padang', country: 'Indonesia' },
  'manado': { city: 'Manado', country: 'Indonesia' },
  'ambon': { city: 'Ambon', country: 'Indonesia' }
};

const SHOLAT_NAMES = {
  'Fajr': '🌅 Subuh',
  'Sunrise': '🌤️ Syuruq',
  'Dhuhr': '☀️ Dzuhur',
  'Asr': '🌇 Ashar',
  'Maghrib': '🌆 Maghrib',
  'Isha': '🌙 Isya'
};

async function getSholatSchedule(city = 'jakarta') {
  try {
    const cityData = KOTA_INDONESIA[city.toLowerCase()] || KOTA_INDONESIA['jakarta'];
    const today = new Date();
    const date = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
    const url = `${SHOLAT_API}?city=${encodeURIComponent(cityData.city)}&country=${encodeURIComponent(cityData.country)}&date=${date}`;
    const response = await axios.get(url);
    if (response.data && response.data.data && response.data.data.timings) {
      return response.data.data.timings;
    }
    return null;
  } catch (error) {
    console.error('Error fetching sholat schedule:', error.message);
    return null;
  }
}

async function startSholatReminder(chatId, city = 'jakarta') {
  try {
    if (sholatInterval) {
      clearInterval(sholatInterval);
      sholatInterval = null;
    }
    const timings = await getSholatSchedule(city);
    if (!timings) {
      return { success: false, message: 'Gagal mendapatkan jadwal sholat.' };
    }
    let sholatConf = loadSholatConfig();
    sholatConf[chatId] = {
      active: true,
      city: city,
      timings: timings,
      lastUpdate: Date.now()
    };
    saveSholatConfig(sholatConf);
    sholatInterval = setInterval(async () => {
      try {
        const now = new Date();
        const sholatConf = loadSholatConfig();
        const chatConfig = sholatConf[chatId];
        if (!chatConfig || !chatConfig.active) {
          clearInterval(sholatInterval);
          sholatInterval = null;
          return;
        }
        const timings = chatConfig.timings;
        const today = new Date();
        const sholatList = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        for (const sholat of sholatList) {
          if (timings[sholat]) {
            const [jam, menit] = timings[sholat].split(':').map(Number);
            const sholatTime = new Date();
            sholatTime.setHours(jam, menit, 0, 0);
            const selisih = (sholatTime - now) / 60000;
            if (selisih > 0 && selisih <= 5) {
              const key = `sent_${sholat}_${today.getDate()}`;
              if (!chatConfig[key]) {
                const waktuSekarang = new Date();
                const [jamS, menitS] = timings[sholat].split(':').map(Number);
                const waktuSholat = new Date();
                waktuSholat.setHours(jamS, menitS, 0, 0);
                const selisihMenit = Math.floor((waktuSholat - waktuSekarang) / 60000);
                let pesan = `🕌 *Pengingat Waktu Sholat*\n\n`;
                pesan += `📌 *${SHOLAT_NAMES[sholat] || sholat}* tiba dalam ${selisihMenit} menit!\n`;
                pesan += `⏰ Waktu: *${timings[sholat]}*\n`;
                pesan += `📍 Kota: *${city.charAt(0).toUpperCase() + city.slice(1)}*\n\n`;
                pesan += `🏃‍♂️ Jangan lupa segera persiapkan diri untuk sholat!\n`;
                pesan += `🤲 Semoga Allah menerima ibadah kita semua.`;
                await bot.telegram.sendMessage(chatId, pesan, { parse_mode: 'Markdown' });
                chatConfig[key] = true;
                saveSholatConfig(sholatConf);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in sholat interval:', error.message);
      }
    }, 30000);
    return { success: true, message: 'Auto sholat berhasil diaktifkan!' };
  } catch (error) {
    return { success: false, message: 'Terjadi kesalahan: ' + error.message };
  }
}

function stopSholatReminder(chatId) {
  if (sholatInterval) {
    clearInterval(sholatInterval);
    sholatInterval = null;
  }
  let sholatConf = loadSholatConfig();
  if (sholatConf[chatId]) {
    sholatConf[chatId].active = false;
    saveSholatConfig(sholatConf);
  }
  return { success: true, message: 'Auto sholat berhasil dimatikan!' };
}

// ==========================================
// 🔒 SISTEM UTAMA
// ==========================================
bot.use(async (ctx, next) => {
  const sys = loadSystem();
  const userId = ctx.from?.id;
  
  // Registrasi user otomatis (kecuali owner)
  if (ctx.from && ctx.from.id !== OWNER_ID) {
    const userData = loadUsers();
    const users = userData.users || [];
    const exists = users.some(u => u.id === ctx.from.id);
    if (!exists) {
      users.push({
        id: ctx.from.id,
        username: ctx.from.username || null,
        name: ctx.from.first_name || 'User',
        first_seen: new Date().toISOString()
      });
      userData.users = users;
      saveUsers(userData);
    }
  }

  if (ctx.message?.text && ctx.message.text.startsWith('/stop')) {
    return next();
  }
  if (ctx.message?.forward_origin || ctx.editedMessage?.forward_origin) return;
  if (sys.maintenance && userId !== OWNER_ID) {
    if (ctx.message?.text === '/start' || ctx.message?.text === '/menu' || ctx.message?.text === '/help') {
      await ctx.reply(`🛠️ *BOT SEDANG DALAM PERBAIKAN!*\n\nMohon bersabar ya, bot sedang diperbaiki oleh tim pengembang.\n\n📌 *BY VAELIX OFC ⚔️*\n\n⏳ Akan segera kembali normal. Terima kasih atas pengertiannya!`, { parse_mode: 'Markdown' });
    }
    return;
  }
  return next();
});

bot.action(/.*/, async (ctx, next) => {
  try {
    const msg = ctx.callbackQuery.message;
    if (!msg?.from || msg.from.id !== ctx.botInfo?.id) {
      return ctx.answerCbQuery('❌ TOMBOL INI TIDAK BERASAL DARI SAYA!\nJangan pakai pesan yang di-forward.', { show_alert: true });
    }
  } catch {
    return ctx.answerCbQuery('⚠️ Tidak dapat memverifikasi pesan ini!', { show_alert: true });
  }
  await ctx.answerCbQuery();
  return next();
});

// ==========================================
// 🎨 FUNGSI UTILITAS
// ==========================================
function buatTombol(teks, dataCallback, warna = DEFAULT_BUTTON_STYLE, emojiNama = null) {
  const tombol = { text: teks, callback_data: dataCallback };
  if (warna && warna !== 'default') tombol.style = warna;
  if (emojiNama && EMOJI_MAP?.[emojiNama]) tombol.icon_custom_emoji_id = EMOJI_MAP[emojiNama];
  return tombol;
}

const colors = { reset:"\x1b[0m", bright:"\x1b[1m", dim:"\x1b[2m", cyan:"\x1b[36m", green:"\x1b[32m", yellow:"\x1b[33m", red:"\x1b[31m", magenta:"\x1b[35m", blue:"\x1b[34m" };
function getWIBTime() { return new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }); }
function logActivity(type, ctx, extraInfo = '') {
  const user = ctx.from ? `${ctx.from.first_name} (@${ctx.from.username || 'NoUser'})` : 'Unknown';
  const userId = ctx.from ? ctx.from.id : '-';
  const chatType = ctx.chat ? ctx.chat.type.toUpperCase() : 'UNKNOWN';
  let tagColor = colors.cyan;
  if (type === 'COMMAND') tagColor = colors.green;
  if (type === 'BUTTON') tagColor = colors.yellow;
  if (type === 'ERROR') tagColor = colors.red;
  console.log(`${colors.dim}[${getWIBTime()}]${colors.reset} ${tagColor}${colors.bright}[${type}]${colors.reset} ${colors.magenta}Chat:${colors.reset} ${colors.bright}${chatType}${colors.reset} | ${colors.blue}User:${colors.reset} ${user} (${userId}) ${extraInfo ? '| ' + colors.yellow + extraInfo + colors.reset : ''}`);
}
bot.use((ctx, next) => {
  if (ctx.message && ctx.message.text) logActivity('COMMAND', ctx, `CMD: "${ctx.message.text}"`);
  else if (ctx.callbackQuery) logActivity('BUTTON', ctx, `Data: "${ctx.callbackQuery.data}"`);
  return next();
});
function isOwner(ctx) { return ctx.from && ctx.from.id === OWNER_ID; }
function extractApiResponse(resData) { return !resData ? null : typeof resData === 'string' ? resData : resData.data||resData.result||resData.message||JSON.stringify(resData); }

// ==========================================
// 🔘 TOMBOL & NAVIGASI MENU
// ==========================================
const DEFAULT_MENU_IMAGE = 'https://telegra.ph/file/placeholder-image.jpg';

function getMenuButtons(userId, isSubmenu = false) {
  const buttons = [
    [buatTombol('👑 Admin & Security', 'menu_admin', 'danger', '👑'), buatTombol('🎮 Fun & Games', 'menu_fun', 'success', '⚔️')],
    [buatTombol('📥 Downloader', 'menu_downloader', 'primary', '📥'), buatTombol('🤖 AI Chat', 'menu_ai', 'primary', '🤖')],
    [buatTombol('📋 More Menu', 'menu_more', 'primary', '📋'), buatTombol('➕ Add Bot ke Grup', 'menu_addgroup', 'primary', '➕')],
    [buatTombol('🌠 Thanks To', 'menu_thanksto', 'primary', '🌠'), buatTombol('📜 Tampilkan Semua', 'menu_all', 'primary', '📌')]
  ];
  if (userId === OWNER_ID) buttons.push([buatTombol('👤 Owner Panel', 'menu_owner', 'danger', '👤')]);
  if (isSubmenu) buttons.push([buatTombol('🔙 Kembali', 'menu_main', 'primary', '📌')]);
  return { inline_keyboard: buttons };
}

async function sendMenuWithPhoto(ctx, captionText, isSubmenu = false) {
  const userId = ctx.from ? ctx.from.id : null;
  try {
    const imageToUse = BOT_IMAGE || DEFAULT_MENU_IMAGE;
    await ctx.telegram.callApi('sendPhoto', { 
      chat_id: ctx.chat.id, 
      photo: imageToUse, 
      caption: captionText, 
      reply_markup: getMenuButtons(userId, isSubmenu),
      parse_mode: 'HTML'
    });
  } catch (e) {
    try {
      await ctx.reply(captionText, { 
        reply_markup: getMenuButtons(userId, isSubmenu),
        parse_mode: 'HTML'
      });
    } catch (err) {
      await ctx.reply(captionText);
    }
  }
}

async function editMenuCaption(ctx, text, isSubmenu = true) {
  try {
    await ctx.editMessageCaption(text, {
      reply_markup: getMenuButtons(ctx.from.id, isSubmenu),
      parse_mode: 'HTML'
    });
  } catch (e) {
    try {
      await ctx.deleteMessage().catch(() => {});
    } catch {}
    await sendMenuWithPhoto(ctx, text, isSubmenu);
  }
}

// ==========================================
// 📜 DAFTAR MENU
// ==========================================
const textAdminSecurity = `
<b>👑 ADMIN &amp; SECURITY MENU</b>

<b>🛡 Moderasi Member</b>
 ├ /ban — Ban anggota
 ├ /kick — Kick anggota
 ├ /mute — Bisukan anggota
 └ /unmute — Cabut mute anggota

<b>👑 Manajemen Grup</b>
 ├ /info — Lihat info akun
 ├ /id — Cek ID grup / user / channel
 ├ /link @username — Buat link khusus user
 ├ /linkgb — Dapatkan link grup
 ├ /setwelcome &lt;teks&gt; / off — Atur / matikan welcome
 ├ /setleft &lt;teks&gt; / off — Atur / matikan pesan left
 ├ /setpic — Ganti foto profil grup
 ├ /setcontact — Set kontak admin
 ├ /welcomestatus — Cek status welcome
 ├ /leftstatus — Cek status left
 ├ /open — Buka grup
 ├ /close — Tutup grup
 ├ /pin — Sematkan pesan
 ├ /unpin — Hapus sematan pesan
 ├ /clear — Hapus semua pesan (reply ke pesan)
 ├ /clearcache — Hapus cache member
 └ /tagall — Sebut semua anggota (reply, tanpa emoji, support 1000+)

<b>📊 Monitoring Member</b>
 ├ /cekmember — Cek jumlah member grup
 └ /cekadmin — Cek daftar admin grup

<b>⏰ Setting Waktu</b>
 └ /settime &lt;timezone&gt; — Set zona waktu (Asia/Jakarta)

<b>⚠️ Sistem Warn</b>
 ├ /warn @user &lt;alasan&gt; — Beri peringatan ke user
 ├ /resetwarn @user — Reset peringatan user
 └ /cekstatus — Cek status user (warn, mute, dll)

<b>🏷️ Set Tag</b>
 └ /settag @user &lt;tag&gt; — Set tag untuk user

<b>🔒 Pengaturan Proteksi</b>
 ├ /antilink on/off — Blokir link <b>(TERMASUK ADMIN!)</b>
 ├ /antipromosi on/off — Blokir PROMOSI JUAL BELI <b>(TERMASUK ADMIN!)</b>
 ├ /antiforward on/off — Blokir FORWARD/MENERUSKAN PESAN <b>(TERMASUK ADMIN!)</b>
 ├ /antitoxic on/off — Blokir kata kasar
 ├ /antifoto on/off — Blokir kirim foto
 ├ /antijomok on/off — Blokir kata jomok
 ├ /antispam on/off — Blokir spam pesan (mute 1 jam)
 ├ /antistiker on/off — Blokir spam stiker (mute 5 menit)
 └ /antibot on/off — Blokir &amp; Kick BOT otomatis!

<b>📋 Sistem Filter</b>
 ├ /filter &lt;kata&gt; &lt;reply&gt; — Tambah filter kata
 ├ /stop &lt;kata&gt; — Hentikan filter sementara
 ├ /listfilter — Lihat semua filter
 ├ /cekfilter — Cek filter (debug)
 ├ /testfilter &lt;kata&gt; — Test filter
 └ /delfilter &lt;kata&gt; — Hapus filter

<b>🕌 Fitur Sholat</b>
 └ /autosholat on/off/status/list — Pengingat waktu sholat

<b>⚙ Sistem Bot (Owner)</b>
 ├ /maintenance on/off — Mode perawatan
 ├ /brotopcash — Broadcast ke semua user
 ├ /cekuser — Cek jumlah user terdaftar
 └ Saat maintenance aktif, user yang /start akan mendapat pesan perbaikan

⏱️ Peringatan akan otomatis terhapus dalam <b>10 detik!</b>

<b>📌 BY VAELIX OFC ⚔️</b>
`.trim();

const textFunGames = `
<b>🎮 FUN &amp; GAMES MENU</b>

<b>🔮 Ramalan &amp; Cek Fun</b>
 ├ /cekkhodam — Cek khodam
 ├ /cektampan — Cek ketampanan
 ├ /cekkaya — Cek kekayaan
 └ /tebakumur — Tebak umur

<b>🎯 GAMES TEBAK-TEBAKAN</b>
 ├ /tebakangka — Tebak angka 1–100
 ├ /tebakwarna — Tebak nama warna
 ├ /susunangka — Urutkan angka
 └ /tebakhewan — Tebak nama hewan

<b>🎰 Games Lainnya</b>
 ├ /casino — Main slot machine
 ├ /pantun — Pantun lucu
 ├ /brat &lt;teks&gt; — Buat gambar brat
 └ /iqc &lt;teks&gt; — Buat gambar iqc

<b>📌 BY VAELIX OFC ⚔️</b>
`.trim();

const textDownloader = `
<b>📥 DOWNLOADER MENU</b>

 ├ /tiktok &lt;url&gt; — Download TikTok
 └ /spotify &lt;url&gt; — Download Spotify

<b>📌 BY VAELIX OFC ⚔️</b>
`.trim();

const textAiMenu = `
<b>🤖 AI CHAT MENU</b>

 ├ /ai &lt;pesan&gt; — Tanya ke AI Meta

<b>📌 BY VAELIX OFC ⚔️</b>
`.trim();

const textMoreMenu = `
<b>📋 MORE MENU</b>

<b>🤖 Info Bot</b>
 ├ /cekbot — Cek status bot
 └ /ping — Cek kecepatan response bot

<b>🎨 Gambar &amp; Generator</b>
 ├ /gta &lt;teks&gt; — Buat gambar gaya GTA
 ├ /tofigure &lt;teks&gt; — Buat gambar action figure
 ├ /hytamkan &lt;teks&gt; — Buat gambar Hytam Kan
 ├ /disney &lt;teks&gt; — Buat gambar gaya Disney
 └ /anime &lt;teks&gt; — Buat gambar gaya Anime

<b>🔍 Cek Lainnya</b>
 ├ /cekemoji — Cek daftar emoji
 └ /cekch — Cek daftar karakter

<b>📌 BY VAELIX OFC ⚔️</b>
`.trim();

const textOwnerMenu = `
<b>👤 OWNER PANEL</b>

 ├ /botinfo — Cek status bot
 ├ /brotopcash — Broadcast ke semua user
 ├ /cekuser — Cek jumlah user terdaftar
 └ /restart — Mulai ulang bot

<b>📌 BY VAELIX OFC ⚔️</b>
`.trim();

const textThanksTo = `
<b>🌠 THANKS TO</b>

👑 VAELIX DEVELOPER MD
👑 VELDORA OM GWE
👑 TYAR OM KE 2 GWE
👑 REZZX MY OWNER

<b>📌 BY VAELIX OFC ⚔️</b>
`.trim();

const textMainMenu = `
<b>🤖 MAIN MENU</b>

✨ <b>VAELIX MD</b> ✨

✅ TOMBOL ONLY — TIDAK BISA DIPAKAI JIKA DI-FORWARD!
🖼 FOTO PROFIL TETAP ADA DI SEMUA MENU
⏱️ Peringatan otomatis terhapus 10 detik!
🤖 Anti-Bot aktif untuk keamanan grup!
🕌 Auto Sholat siap mengingatkan waktu sholat!

Pilih menu di bawah ini:

<b>📌 BY VAELIX OFC ⚔️</b>
`.trim();

// ==========================================
// 🎯 PERINTAH MORE MENU
// ==========================================

// CEKBOT
bot.command('cekbot', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  const uptime = process.uptime();
  const jam = Math.floor(uptime/3600);
  const menit = Math.floor((uptime%3600)/60);
  const detik = Math.floor(uptime%60);
  const memUsage = process.memoryUsage();
  const usedMemory = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const totalMemory = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
  
  let pesan = `🤖 *STATUS BOT*\n\n`;
  pesan += `📌 *Nama:* VAELIX MD\n`;
  pesan += `⏱️ *Uptime:* ${jam}j ${menit}m ${detik}d\n`;
  pesan += `💾 *Memory:* ${usedMemory}MB / ${totalMemory}MB\n`;
  pesan += `👑 *Owner:* ${OWNER_ID}\n`;
  pesan += `📅 *Waktu:* ${getWIBTime()}\n\n`;
  pesan += `📌 *BY VAELIX OFC ⚔️*`;
  ctx.reply(pesan, { parse_mode: 'Markdown' });
});

// PING
bot.command('ping', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  const start = Date.now();
  const msg = await ctx.reply('🏓 *Pinging...*', { parse_mode: 'Markdown' });
  const end = Date.now();
  const ping = end - start;
  await ctx.deleteMessage(msg.message_id).catch(() => {});
  ctx.reply(`🏓 *Pong!*\n\n⏱️ Response Time: *${ping}ms*\n\n📌 *BY VAELIX OFC ⚔️*`, { parse_mode: 'Markdown' });
});

// GTA
bot.command('gta', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  const teks = ctx.message.text.split(' ').slice(1).join(' ');
  if (!teks) return ctx.reply('⚠️ Gunakan format: /gta <teks>');
  const msg = await ctx.reply('⏳ Membuat gambar GTA...');
  try {
    const apiUrl = `https://api.azbry.com/api/maker/gta?text=${encodeURIComponent(teks)}`;
    const res = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    await ctx.deleteMessage(msg.message_id).catch(() => {});
    await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, { caption: `🎮 GTA: ${teks}` });
  } catch {
    await ctx.deleteMessage(msg.message_id).catch(() => {});
    ctx.reply('❌ Gagal membuat gambar GTA.');
  }
});

// TOFIGURE
bot.command('tofigure', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  const teks = ctx.message.text.split(' ').slice(1).join(' ');
  if (!teks) return ctx.reply('⚠️ Gunakan format: /tofigure <teks>');
  const msg = await ctx.reply('⏳ Membuat gambar Action Figure...');
  try {
    const apiUrl = `https://api.azbry.com/api/maker/tofigure?text=${encodeURIComponent(teks)}`;
    const res = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    await ctx.deleteMessage(msg.message_id).catch(() => {});
    await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, { caption: `🦸 Action Figure: ${teks}` });
  } catch {
    await ctx.deleteMessage(msg.message_id).catch(() => {});
    ctx.reply('❌ Gagal membuat gambar Action Figure.');
  }
});

// HYTAMKAN
bot.command('hytamkan', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  const teks = ctx.message.text.split(' ').slice(1).join(' ');
  if (!teks) return ctx.reply('⚠️ Gunakan format: /hytamkan <teks>');
  const msg = await ctx.reply('⏳ Membuat gambar Hytam Kan...');
  try {
    const apiUrl = `https://api.azbry.com/api/maker/hytamkan?text=${encodeURIComponent(teks)}`;
    const res = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    await ctx.deleteMessage(msg.message_id).catch(() => {});
    await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, { caption: `🎨 Hytam Kan: ${teks}` });
  } catch {
    await ctx.deleteMessage(msg.message_id).catch(() => {});
    ctx.reply('❌ Gagal membuat gambar Hytam Kan.');
  }
});

// DISNEY
bot.command('disney', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  const teks = ctx.message.text.split(' ').slice(1).join(' ');
  if (!teks) return ctx.reply('⚠️ Gunakan format: /disney <teks>');
  const msg = await ctx.reply('⏳ Membuat gambar gaya Disney...');
  try {
    const apiUrl = `https://api.azbry.com/api/maker/disney?text=${encodeURIComponent(teks)}`;
    const res = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    await ctx.deleteMessage(msg.message_id).catch(() => {});
    await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, { caption: `🏰 Disney: ${teks}` });
  } catch {
    await ctx.deleteMessage(msg.message_id).catch(() => {});
    ctx.reply('❌ Gagal membuat gambar Disney.');
  }
});

// ANIME
bot.command('anime', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  const teks = ctx.message.text.split(' ').slice(1).join(' ');
  if (!teks) return ctx.reply('⚠️ Gunakan format: /anime <teks>');
  const msg = await ctx.reply('⏳ Membuat gambar gaya Anime...');
  try {
    const apiUrl = `https://api.azbry.com/api/maker/anime?text=${encodeURIComponent(teks)}`;
    const res = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    await ctx.deleteMessage(msg.message_id).catch(() => {});
    await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, { caption: `🌸 Anime: ${teks}` });
  } catch {
    await ctx.deleteMessage(msg.message_id).catch(() => {});
    ctx.reply('❌ Gagal membuat gambar Anime.');
  }
});

// CEKEMOJI
bot.command('cekemoji', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  const emojiList = [
    '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
    '😋', '😎', '😍', '🥰', '😘', '😗', '😙', '😚', '🥲', '😜',
    '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐',
    '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪',
    '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥴', '😵', '🤯',
    '🤠', '🥳', '😈', '👿', '👹', '👺', '💀', '☠️', '👻', '👽',
    '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
    '😾', '🙌', '👏', '🙏', '🤝', '👍', '👎', '👊', '✊', '🤛',
    '🤜', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️'
  ];
  let pesan = `🔍 *DAFTAR EMOJI*\n\n`;
  let rows = [];
  for (let i = 0; i < emojiList.length; i += 10) {
    rows.push(emojiList.slice(i, i + 10).join(' '));
  }
  pesan += rows.join('\n');
  pesan += `\n\n📌 Total: ${emojiList.length} emoji\n📌 *BY VAELIX OFC ⚔️*`;
  ctx.reply(pesan, { parse_mode: 'Markdown' });
});

// CEKCH
bot.command('cekch', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  const charList = [
    '⭐', '🌟', '✨', '💫', '🔥', '💥', '💢', '💨', '💦', '💧',
    '🌀', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️',
    '⛈️', '🌩️', '❄️', '☃️', '⛄', '🌊', '🌋', '🗻', '🏔️', '⛰️',
    '🏕️', '🏖️', '🏜️', '🏝️', '🌴', '🌲', '🌳', '🌿', '☘️', '🍀',
    '🌸', '🌺', '🌻', '🌹', '🥀', '🌷', '🌼', '💐', '🍂', '🍁',
    '🍃', '🍄', '🌰', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍',
    '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅',
    '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒'
  ];
  let pesan = `🔍 *DAFTAR KARAKTER*\n\n`;
  let rows = [];
  for (let i = 0; i < charList.length; i += 10) {
    rows.push(charList.slice(i, i + 10).join(' '));
  }
  pesan += rows.join('\n');
  pesan += `\n\n📌 Total: ${charList.length} karakter\n📌 *BY VAELIX OFC ⚔️*`;
  ctx.reply(pesan, { parse_mode: 'Markdown' });
});

// ==========================================
// 💰 FITUR BROTOP CASH - BROADCAST SYSTEM
// ==========================================
bot.command('brotopcash', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (!isOwner(ctx)) {
    return ctx.reply(`⚠️ *Fitur ini khusus untuk OWNER!*\n\n📌 *BY VAELIX OFC ⚔️*`, { parse_mode: 'Markdown' });
  }

  const args = ctx.message.text.split(' ');
  const action = (args[1] || '').toLowerCase();
  const message = args.slice(2).join(' ');

  // MENU
  if (!action || action === 'help' || action === 'menu') {
    let pesan = `💰 *BROTOP CASH - BROADCAST SYSTEM*\n\n`;
    pesan += `📌 *Perintah:*\n`;
    pesan += `/brotopcash send <pesan> - Kirim broadcast ke semua user\n`;
    pesan += `/brotopcash stop - Hentikan broadcast\n`;
    pesan += `/brotopcash status - Cek status broadcast\n`;
    pesan += `/brotopcash stats - Statistik broadcast\n`;
    pesan += `/brotopcash list - Daftar user\n`;
    pesan += `/brotopcash clear - Hapus semua user\n\n`;
    pesan += `📌 *BY VAELIX OFC ⚔️*`;
    return ctx.reply(pesan, { parse_mode: 'Markdown' });
  }

  // SEND BROADCAST
  if (action === 'send') {
    if (!message) {
      return ctx.reply(`⚠️ *Cara Penggunaan:*\n\n/brotopcash send <pesan>\n\n📌 Contoh:\n/brotopcash send Halo semua! Ini pesan broadcast dari VAELIX MD`, { parse_mode: 'Markdown' });
    }

    if (broadcastRunning) {
      return ctx.reply(`⚠️ *Broadcast sedang berjalan!*\n\nGunakan /brotopcash stop untuk menghentikan.`, { parse_mode: 'Markdown' });
    }

    const userData = loadUsers();
    const users = userData.users || [];
    
    if (users.length === 0) {
      return ctx.reply(`⚠️ *Tidak ada user yang terdaftar!*\n\nUser akan otomatis terdaftar saat pertama kali menggunakan bot.`, { parse_mode: 'Markdown' });
    }

    broadcastRunning = true;
    broadcastPaused = false;
    broadcastStats = {
      total: users.length,
      sent: 0,
      failed: 0,
      started: new Date().toISOString(),
      finished: null
    };

    const msg = await ctx.reply(`⏳ *Memulai broadcast...*\n\n📌 Total User: ${users.length}\n📌 Pesan: ${message}\n\n⏱️ Proses akan berjalan di background.`, { parse_mode: 'Markdown' });

    // Jalankan broadcast di background
    runBroadcast(ctx, users, message, msg.message_id);
    return;
  }

  // STOP BROADCAST
  if (action === 'stop') {
    if (!broadcastRunning) {
      return ctx.reply(`ℹ️ *Tidak ada broadcast yang berjalan.*`, { parse_mode: 'Markdown' });
    }
    broadcastPaused = true;
    broadcastRunning = false;
    broadcastStats.finished = new Date().toISOString();
    
    let pesan = `⏹️ *Broadcast DIHENTIKAN!*\n\n`;
    pesan += `📊 *Statistik:*\n`;
    pesan += `• Total: ${broadcastStats.total}\n`;
    pesan += `• Terkirim: ${broadcastStats.sent}\n`;
    pesan += `• Gagal: ${broadcastStats.failed}\n`;
    pesan += `• Mulai: ${new Date(broadcastStats.started).toLocaleString('id-ID')}\n`;
    pesan += `• Selesai: ${new Date(broadcastStats.finished).toLocaleString('id-ID')}\n\n`;
    pesan += `📌 *BY VAELIX OFC ⚔️*`;
    return ctx.reply(pesan, { parse_mode: 'Markdown' });
  }

  // STATUS BROADCAST
  if (action === 'status') {
    if (!broadcastRunning && !broadcastStats.started) {
      return ctx.reply(`ℹ️ *Tidak ada broadcast yang sedang atau pernah berjalan.*`, { parse_mode: 'Markdown' });
    }

    let pesan = `📊 *STATUS BROADCAST*\n\n`;
    pesan += `📌 Status: ${broadcastRunning ? '🔄 BERJALAN' : '⏹️ BERHENTI'}\n`;
    if (broadcastStats.total > 0) {
      pesan += `• Total User: ${broadcastStats.total}\n`;
      pesan += `• Terkirim: ${broadcastStats.sent}\n`;
      pesan += `• Gagal: ${broadcastStats.failed}\n`;
      pesan += `• Progress: ${Math.round((broadcastStats.sent / broadcastStats.total) * 100)}%\n`;
    }
    if (broadcastStats.started) {
      pesan += `• Mulai: ${new Date(broadcastStats.started).toLocaleString('id-ID')}\n`;
    }
    if (broadcastStats.finished) {
      pesan += `• Selesai: ${new Date(broadcastStats.finished).toLocaleString('id-ID')}\n`;
    }
    pesan += `\n📌 *BY VAELIX OFC ⚔️*`;
    return ctx.reply(pesan, { parse_mode: 'Markdown' });
  }

  // STATISTIK
  if (action === 'stats') {
    const userData = loadUsers();
    const users = userData.users || [];
    
    let pesan = `📊 *STATISTIK USER*\n\n`;
    pesan += `👥 Total User: ${users.length}\n`;
    pesan += `📌 Terakhir update: ${new Date().toLocaleString('id-ID')}\n\n`;
    
    if (broadcastStats.total > 0) {
      pesan += `📋 *Broadcast Terakhir:*\n`;
      pesan += `• Total: ${broadcastStats.total}\n`;
      pesan += `• Terkirim: ${broadcastStats.sent}\n`;
      pesan += `• Gagal: ${broadcastStats.failed}\n`;
    }
    pesan += `\n📌 *BY VAELIX OFC ⚔️*`;
    return ctx.reply(pesan, { parse_mode: 'Markdown' });
  }

  // LIST USER
  if (action === 'list') {
    const userData = loadUsers();
    const users = userData.users || [];
    
    if (users.length === 0) {
      return ctx.reply(`ℹ️ *Belum ada user yang terdaftar.*`, { parse_mode: 'Markdown' });
    }

    let pesan = `👥 *DAFTAR USER*\n\n`;
    const chunkSize = 20;
    const chunks = [];
    
    for (let i = 0; i < users.length; i += chunkSize) {
      chunks.push(users.slice(i, i + chunkSize));
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let text = `👥 *DAFTAR USER (${i + 1}/${chunks.length})*\n\n`;
      chunk.forEach(user => {
        text += `• ${user.name || 'User'} (@${user.username || 'Tidak Ada'}) - ${user.id}\n`;
      });
      text += `\n📌 Total: ${users.length} user\n📌 *BY VAELIX OFC ⚔️*`;
      await ctx.reply(text, { parse_mode: 'Markdown' });
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return;
  }

  // CLEAR USER
  if (action === 'clear') {
    if (!isOwner(ctx)) return ctx.reply('⚠️ KHUSUS OWNER!');
    
    const userData = loadUsers();
    const count = (userData.users || []).length;
    userData.users = [];
    saveUsers(userData);
    
    ctx.reply(`✅ *Berhasil menghapus ${count} user!*`, { parse_mode: 'Markdown' });
    return;
  }

  ctx.reply(
    `⚠️ *Perintah tidak dikenal!*\n\n` +
    `Gunakan /brotopcash help untuk melihat daftar perintah.\n\n` +
    `📌 *BY VAELIX OFC ⚔️*`,
    { parse_mode: 'Markdown' }
  );
});

// ==========================================
// 🔄 FUNGSI BROADCAST
// ==========================================
async function runBroadcast(ctx, users, message, replyMsgId) {
  const chatId = ctx.chat.id;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < users.length; i++) {
    if (broadcastPaused) {
      broadcastRunning = false;
      break;
    }

    const user = users[i];
    try {
      await ctx.telegram.sendMessage(user.id, 
        `📢 *BROADCAST MESSAGE*\n\n${message}\n\n📌 *BY VAELIX OFC ⚔️*`,
        { parse_mode: 'Markdown' }
      );
      successCount++;
      broadcastStats.sent = successCount;
    } catch (error) {
      failCount++;
      broadcastStats.failed = failCount;
      console.error(`Broadcast gagal ke ${user.id}:`, error.message);
    }

    if (i % 10 === 0 && i > 0) {
      try {
        await ctx.telegram.editMessageText(
          chatId,
          replyMsgId,
          null,
          `⏳ *Broadcast berjalan...*\n\n` +
          `📌 Total: ${users.length}\n` +
          `✅ Terkirim: ${successCount}\n` +
          `❌ Gagal: ${failCount}\n` +
          `📊 Progress: ${Math.round((i / users.length) * 100)}%\n\n` +
          `⏱️ Proses akan berjalan di background.`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {}
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  broadcastRunning = false;
  broadcastStats.finished = new Date().toISOString();

  let finalMsg = `✅ *Broadcast SELESAI!*\n\n`;
  finalMsg += `📊 *Statistik:*\n`;
  finalMsg += `• Total: ${users.length}\n`;
  finalMsg += `• Terkirim: ${successCount}\n`;
  finalMsg += `• Gagal: ${failCount}\n`;
  finalMsg += `• Mulai: ${new Date(broadcastStats.started).toLocaleString('id-ID')}\n`;
  finalMsg += `• Selesai: ${new Date(broadcastStats.finished).toLocaleString('id-ID')}\n\n`;
  finalMsg += `📌 *BY VAELIX OFC ⚔️*`;

  try {
    await ctx.telegram.editMessageText(chatId, replyMsgId, null, finalMsg, { parse_mode: 'Markdown' });
  } catch (e) {
    await ctx.reply(finalMsg, { parse_mode: 'Markdown' });
  }
}

// ==========================================
// 📊 CEK USER
// ==========================================
bot.command('cekuser', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (!isOwner(ctx)) return ctx.reply('⚠️ KHUSUS OWNER!');
  
  const userData = loadUsers();
  const users = userData.users || [];
  
  let pesan = `👥 *STATISTIK USER*\n\n`;
  pesan += `📌 Total User: ${users.length}\n`;
  pesan += `📅 Update: ${new Date().toLocaleString('id-ID')}\n\n`;
  pesan += `📌 *BY VAELIX OFC ⚔️*`;
  ctx.reply(pesan, { parse_mode: 'Markdown' });
});

// ==========================================
// 📢 FITUR /TAGALL & /ALL (OPTIMASI 1000+ USER)
// ==========================================
const ramMembers = {};
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fungsi untuk mendapatkan semua member grup dengan cache
async function getAllGroupMembers(chatId, ctx) {
  const now = Date.now();
  // Cache selama 5 menit
  if (memberCache[chatId] && (now - memberCacheTime[chatId]) < 300000) {
    return memberCache[chatId];
  }

  try {
    const allMembers = [];
    let offset = 0;
    let hasMore = true;

    // Dapatkan admin terlebih dahulu
    const admins = await ctx.telegram.getChatAdministrators(chatId);
    const adminIds = new Set();
    admins.forEach(admin => {
      if (!admin.user.is_bot) {
        adminIds.add(admin.user.id);
        allMembers.push({
          id: admin.user.id,
          username: admin.user.username || null,
          first_name: admin.user.first_name || 'Member'
        });
      }
    });

    // Dapatkan member dari cache RAM
    if (ramMembers[chatId]) {
      for (const [id, userObj] of ramMembers[chatId].entries()) {
        if (!adminIds.has(id)) {
          allMembers.push({
            id: userObj.id,
            username: userObj.username || null,
            first_name: userObj.first_name || 'Member'
          });
        }
      }
    }

    // Cache hasil
    memberCache[chatId] = allMembers;
    memberCacheTime[chatId] = now;

    return allMembers;
  } catch (err) {
    console.error('Get All Members Error:', err.message);
    // Fallback ke ramMembers
    if (ramMembers[chatId]) {
      const fallbackMembers = [];
      for (const [id, userObj] of ramMembers[chatId].entries()) {
        fallbackMembers.push({
          id: userObj.id,
          username: userObj.username || null,
          first_name: userObj.first_name || 'Member'
        });
      }
      return fallbackMembers;
    }
    return [];
  }
}

bot.use(async (ctx, next) => {
  if (ctx.chat && ['group', 'supergroup'].includes(ctx.chat.type) && ctx.from) {
    const chatId = ctx.chat.id;
    const user = ctx.from;
    if (!ramMembers[chatId]) ramMembers[chatId] = new Map();
    ramMembers[chatId].set(user.id, {
      id: user.id,
      username: user.username || null,
      first_name: user.first_name || 'Member'
    });
  }
  return next();
});

bot.command(['tagall', 'all'], async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') {
    return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  }

  // Cek apakah user adalah admin
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA MENGGUNAKAN PERINTAH INI!');
    }
  } catch {
    return ctx.reply('❌ Gagal verifikasi status admin.');
  }

  const chatId = ctx.chat.id;
  const args = ctx.message.text.split(' ');
  const customMessage = args.slice(1).join(' ');
  const captionHeader = customMessage || '📢 Tagall semua member!';

  try {
    // Reply ke pesan yang diminta
    const replyMsg = await ctx.reply(
      `⏳ Sedang mengumpulkan member...\n📌 Pesan: ${captionHeader}`,
      { 
        reply_to_message_id: ctx.message.message_id,
        parse_mode: 'HTML'
      }
    );

    // Dapatkan semua member
    const allMembers = await getAllGroupMembers(chatId, ctx);
    
    if (allMembers.length === 0) {
      await ctx.editMessageText('⚠️ Belum ada member yang terdeteksi. Harap tunggu beberapa saat sampai ada yang aktif.', {
        chat_id: chatId,
        message_id: replyMsg.message_id
      });
      return;
    }

    // Batasi hingga 1000 user
    const maxMembers = Math.min(allMembers.length, 1000);
    const membersToTag = allMembers.slice(0, maxMembers);
    
    // Update pesan dengan info
    await ctx.editMessageText(
      `⏳ Men-tag ${membersToTag.length} member...\n📌 Pesan: ${captionHeader}`,
      {
        chat_id: chatId,
        message_id: replyMsg.message_id,
        parse_mode: 'HTML'
      }
    );

    // Kirim dalam chunk besar (50 member per pesan)
    const chunkSize = 50;
    const totalChunks = Math.ceil(membersToTag.length / chunkSize);
    let sentCount = 0;

    for (let i = 0; i < membersToTag.length; i += chunkSize) {
      const chunk = membersToTag.slice(i, i + chunkSize);
      let mentionTags = '';
      
      for (const user of chunk) {
        // Gunakan mention dengan username jika ada, fallback ke user ID
        if (user.username) {
          mentionTags += `@${user.username} `;
        } else {
          mentionTags += `<a href="tg://user?id=${user.id}">${user.first_name || 'Member'}</a> `;
        }
      }

      // Kirim chunk dengan reply ke pesan utama
      try {
        await ctx.telegram.sendMessage(chatId, mentionTags.trim(), { 
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_to_message_id: ctx.message.message_id
        });
        sentCount += chunk.length;
        
        // Update progress setiap 5 chunk
        if (i % (chunkSize * 5) === 0 && i > 0) {
          const progress = Math.round((sentCount / membersToTag.length) * 100);
          try {
            await ctx.editMessageText(
              `⏳ Men-tag member... ${progress}% (${sentCount}/${membersToTag.length})\n📌 Pesan: ${captionHeader}`,
              {
                chat_id: chatId,
                message_id: replyMsg.message_id,
                parse_mode: 'HTML'
              }
            );
          } catch (e) {}
        }

        // Delay antar chunk untuk menghindari rate limit
        await delay(500);
      } catch (err) {
        console.error('Tagall Chunk Error:', err.message);
        // Jika gagal, coba dengan delay lebih lama
        await delay(1000);
        try {
          await ctx.telegram.sendMessage(chatId, mentionTags.trim(), { 
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_to_message_id: ctx.message.message_id
          });
        } catch (e) {
          console.error('Tagall Retry Failed:', e.message);
        }
      }
    }

    // Kirim pesan selesai
    const completionMsg = await ctx.reply(
      `✅ *Tagall Selesai!*\n\n` +
      `📌 Total Member: ${allMembers.length}\n` +
      `✅ Berhasil Ditag: ${sentCount} member\n` +
      `📊 Total Pesan: ${totalChunks}\n\n` +
      `📌 *BY VAELIX OFC ⚔️*`,
      { 
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      }
    );

    // Hapus pesan progress
    try {
      await ctx.deleteMessage(replyMsg.message_id);
    } catch (e) {}

    // Auto delete pesan selesai setelah 10 detik
    setTimeout(() => {
      ctx.deleteMessage(completionMsg.message_id).catch(() => {});
    }, 10000);

  } catch (err) {
    console.error('Tagall Error:', err.message);
    ctx.reply('❌ Terjadi kesalahan saat memproses /tagall.');
  }
});

// ==========================================
// 🔄 PERINTAH CLEAR CACHE MEMBER
// ==========================================
bot.command('clearcache', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (!isOwner(ctx)) return ctx.reply('⚠️ KHUSUS OWNER!');
  
  memberCache = {};
  memberCacheTime = {};
  ctx.reply('✅ Cache member berhasil dibersihkan!');
});

// ==========================================
// ⚙ PERINTAH SETTING KEAMANAN GRUP
// ==========================================
bot.command(['antilink', 'antipromosi', 'antiforward', 'antitoxic', 'antifoto', 'antijomok', 'antispam', 'antistiker', 'antibot'], async (ctx) => {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  const parts = ctx.message.text.split(' ');
  const cmd = parts[0].replace('/', '').toLowerCase();
  const status = (parts[1] || 'on').toLowerCase() === 'on';

  if (!chatId || !userId || ctx.chat.type === 'private') return ctx.reply('⚠️ Khusus digunakan di dalam grup!');
  try {
    const member = await ctx.telegram.getChatMember(chatId, userId);
    if (!['creator','administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN YANG BISA MENGATUR!');
  } catch { return; }

  let conf = loadGroupConfig();
  if (!conf[chatId]) conf[chatId] = {};
  const key = cmd === 'antilink' ? 'antiLink' 
            : cmd === 'antipromosi' ? 'antiPromo'
            : cmd === 'antiforward' ? 'antiForward'
            : cmd === 'antitoxic' ? 'antiToxic'
            : cmd === 'antifoto' ? 'antiFoto'
            : cmd === 'antispam' ? 'antiSpam'
            : cmd === 'antistiker' ? 'antiStiker'
            : cmd === 'antibot' ? 'antiBot'
            : 'antiJomok';
  conf[chatId][key] = status;
  saveGroupConfig(conf);
  ctx.reply(`✅ ${cmd.toUpperCase()} Sekarang: ${status ? '🔴 AKTIF' : '🟢 MATI'}`);
});

// ==========================================
// 🕌 PERINTAH AUTO SHOLAT
// ==========================================
bot.command(['autosholat', 'sholat', 'as'], async (ctx) => {
  if (ctx.message?.forward_origin) return;
  const chatId = ctx.chat.id;
  const args = ctx.message.text.split(' ');
  const action = (args[1] || '').toLowerCase();
  const city = (args[2] || 'jakarta').toLowerCase();

  if (ctx.chat.type === 'private') {
    return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  }
  try {
    const member = await ctx.telegram.getChatMember(chatId, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA MENGATUR AUTO SHOLAT!');
    }
  } catch {
    return ctx.reply('❌ Gagal verifikasi status admin.');
  }

  if (action === 'on' || action === 'start') {
    if (!KOTA_INDONESIA[city]) {
      const kotaList = Object.keys(KOTA_INDONESIA).join(', ');
      return ctx.reply(`⚠️ Kota tidak ditemukan!\n\nKota yang tersedia: ${kotaList}\n\nContoh: /autosholat on jakarta`);
    }
    const result = await startSholatReminder(chatId, city);
    if (result.success) {
      let pesan = `✅ *Auto Sholat Activated!*\n\n`;
      pesan += `📍 Kota: *${city.charAt(0).toUpperCase() + city.slice(1)}*\n`;
      const timings = await getSholatSchedule(city);
      if (timings) {
        pesan += `\n📋 *Jadwal Sholat Hari Ini:*\n`;
        pesan += `🌅 Subuh: ${timings.Fajr || '-'}\n`;
        pesan += `☀️ Dzuhur: ${timings.Dhuhr || '-'}\n`;
        pesan += `🌇 Ashar: ${timings.Asr || '-'}\n`;
        pesan += `🌆 Maghrib: ${timings.Maghrib || '-'}\n`;
        pesan += `🌙 Isya: ${timings.Isha || '-'}\n`;
      }
      pesan += `\n⏰ Bot akan mengingatkan 5 menit sebelum waktu sholat tiba.`;
      ctx.reply(pesan, { parse_mode: 'Markdown' });
    } else {
      ctx.reply(`❌ ${result.message}`);
    }
  } else if (action === 'off' || action === 'stop') {
    const result = stopSholatReminder(chatId);
    ctx.reply(result.message);
  } else if (action === 'status') {
    let sholatConf = loadSholatConfig();
    const config = sholatConf[chatId];
    if (config && config.active) {
      let pesan = `📊 *Status Auto Sholat*\n\n✅ Status: *AKTIF*\n📍 Kota: *${config.city.charAt(0).toUpperCase() + config.city.slice(1)}*\n📅 Update: ${new Date(config.lastUpdate).toLocaleString('id-ID')}`;
      if (config.timings) {
        pesan += `\n\n📋 *Jadwal:*\n🌅 Subuh: ${config.timings.Fajr || '-'}\n☀️ Dzuhur: ${config.timings.Dhuhr || '-'}\n🌇 Ashar: ${config.timings.Asr || '-'}\n🌆 Maghrib: ${config.timings.Maghrib || '-'}\n🌙 Isya: ${config.timings.Isha || '-'}`;
      }
      ctx.reply(pesan, { parse_mode: 'Markdown' });
    } else {
      ctx.reply('📊 *Status Auto Sholat*\n\n❌ Status: *MATI*', { parse_mode: 'Markdown' });
    }
  } else if (action === 'list') {
    const kotaList = Object.keys(KOTA_INDONESIA).map(k => `• ${k.charAt(0).toUpperCase() + k.slice(1)}`).join('\n');
    ctx.reply(`📍 *Daftar Kota:*\n\n${kotaList}`, { parse_mode: 'Markdown' });
  } else {
    ctx.reply(
      `🕌 *Auto Sholat Reminder*\n\n` +
      `/autosholat on <kota> - Aktifkan\n` +
      `/autosholat off - Matikan\n` +
      `/autosholat status - Cek status\n` +
      `/autosholat list - Daftar kota\n\n` +
      `📍 Kota: ${Object.keys(KOTA_INDONESIA).join(', ')}`,
      { parse_mode: 'Markdown' }
    );
  }
});

// ==========================================
// 👋 FITUR WELCOME & LEFT
// ==========================================
bot.command('setwelcome', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA MENGATUR PESAN SELAMAT DATANG!');
    }
  } catch { return; }

  const args = ctx.message.text.split(' ');
  const subArg = (args[1] || '').toLowerCase();

  if (subArg === 'off' || subArg === 'disable') {
    let welcomeConf = loadWelcomeConfig();
    if (welcomeConf[ctx.chat.id]) {
      welcomeConf[ctx.chat.id].active = false;
      saveWelcomeConfig(welcomeConf);
    }
    return ctx.reply('✅ Pesan selamat datang (welcome) berhasil dimatikan!');
  }

  const textArgs = ctx.message.text.split(' ').slice(1).join(' ');
  if (!textArgs) {
    return ctx.reply(
      '⚠️ Gunakan format yang benar!\n\n' +
      'Contoh:\n' +
      '• `/setwelcome Halo @user, selamat datang di grup @group!`\n' +
      '• `/setwelcome off` (Untuk mematikan welcome)\n\n' +
      'Variabel tersedia:\n' +
      '• `@user` = Mention/Nama member\n' +
      '• `@group` = Nama grup'
    );
  }

  let welcomeConf = loadWelcomeConfig();
  welcomeConf[ctx.chat.id] = {
    text: textArgs,
    active: true
  };
  saveWelcomeConfig(welcomeConf);
  ctx.reply('✅ Pesan selamat datang (welcome) berhasil diatur dan diaktifkan!');
});

bot.command('setleft', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA MENGATUR PESAN LEFT!');
    }
  } catch { return; }

  const args = ctx.message.text.split(' ');
  const subArg = (args[1] || '').toLowerCase();

  if (subArg === 'off' || subArg === 'disable') {
    let leftConf = loadLeftConfig();
    if (leftConf[ctx.chat.id]) {
      leftConf[ctx.chat.id].active = false;
      saveLeftConfig(leftConf);
    }
    return ctx.reply('✅ Pesan left berhasil dimatikan!');
  }

  const textArgs = ctx.message.text.split(' ').slice(1).join(' ');
  if (!textArgs) {
    return ctx.reply(
      '⚠️ Gunakan format yang benar!\n\n' +
      'Contoh:\n' +
      '• `/setleft @user telah meninggalkan grup @group!`\n' +
      '• `/setleft off` (Untuk mematikan left)\n\n' +
      'Variabel tersedia:\n' +
      '• `@user` = Mention/Nama member\n' +
      '• `@group` = Nama grup'
    );
  }

  let leftConf = loadLeftConfig();
  leftConf[ctx.chat.id] = {
    text: textArgs,
    active: true
  };
  saveLeftConfig(leftConf);
  ctx.reply('✅ Pesan left berhasil diatur dan diaktifkan!');
});

bot.command('welcomestatus', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Khusus grup!');
  const chatId = ctx.chat.id;
  let welcomeConf = loadWelcomeConfig();
  const groupWel = welcomeConf[chatId];
  if (!groupWel || !groupWel.active) {
    return ctx.reply('ℹ️ Welcome message di grup ini sedang MATI atau belum diatur.');
  }
  ctx.reply(`ℹ️ Status Welcome Saat Ini:\n\n"${groupWel.text}"`);
});

bot.command('leftstatus', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Khusus grup!');
  const chatId = ctx.chat.id;
  let leftConf = loadLeftConfig();
  const groupLeft = leftConf[chatId];
  if (!groupLeft || !groupLeft.active) {
    return ctx.reply('ℹ️ Left message di grup ini sedang MATI atau belum diatur.');
  }
  ctx.reply(`ℹ️ Status Left Saat Ini:\n\n"${groupLeft.text}"`);
});

bot.on('new_chat_members', async (ctx) => {
  const chatId = ctx.chat.id;
  const welcomeConf = loadWelcomeConfig();
  const groupWel = welcomeConf[chatId];
  if (!groupWel || !groupWel.active) return;

  const newMembers = ctx.message.new_chat_members;
  for (const newMember of newMembers) {
    if (newMember.id === ctx.botInfo.id) continue;
    const name = newMember.first_name || 'Member';
    const mentionHtml = newMember.username ? `@${newMember.username}` : `<a href="tg://user?id=${newMember.id}">${name}</a>`;
    const groupName = ctx.chat.title || 'Grup Ini';
    let customText = groupWel.text.replace(/@user/g, mentionHtml).replace(/@group/g, groupName);
    try {
      await ctx.reply(customText, { parse_mode: 'HTML' });
    } catch (err) {
      console.error('Welcome Message Error:', err.message);
    }
  }
});

bot.on('left_chat_member', async (ctx) => {
  const chatId = ctx.chat.id;
  const leftConf = loadLeftConfig();
  const groupLeft = leftConf[chatId];
  if (!groupLeft || !groupLeft.active) return;

  const leftMember = ctx.message.left_chat_member;
  if (leftMember.id === ctx.botInfo.id) return;
  
  const name = leftMember.first_name || 'Member';
  const mentionHtml = leftMember.username ? `@${leftMember.username}` : `<a href="tg://user?id=${leftMember.id}">${name}</a>`;
  const groupName = ctx.chat.title || 'Grup Ini';
  let customText = groupLeft.text.replace(/@user/g, mentionHtml).replace(/@group/g, groupName);
  try {
    await ctx.reply(customText, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Left Message Error:', err.message);
  }
});

// ==========================================
// 🖼️ FITUR SETPIC
// ==========================================
bot.command('setpic', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA MENGGANTI FOTO PROFIL GRUP!');
    }
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.photo) {
    return ctx.reply(
      '⚠️ *Cara Penggunaan SetPic:*\n\n' +
      'Balas pesan foto yang ingin dijadikan foto profil grup:\n' +
      `/setpic\n\n` +
      `📌 *BY VAELIX OFC ⚔️*`,
      { parse_mode: 'Markdown' }
    );
  }

  try {
    const photoId = ctx.message.reply_to_message.photo[ctx.message.reply_to_message.photo.length - 1].file_id;
    await ctx.telegram.setChatPhoto(ctx.chat.id, { source: await ctx.telegram.getFile(photoId) });
    ctx.reply('✅ Foto profil grup berhasil diganti!');
  } catch (err) {
    console.error('SetPic Error:', err.message);
    ctx.reply('❌ Gagal mengganti foto profil grup. Pastikan bot memiliki izin yang cukup.');
  }
});

// ==========================================
// 📞 FITUR SETCONTACT
// ==========================================
bot.command('setcontact', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA SET KONTAK!');
    }
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }

  const args = ctx.message.text.split(' ');
  const contact = args.slice(1).join(' ');
  
  if (!contact) {
    return ctx.reply(
      '⚠️ *Cara Penggunaan SetContact:*\n\n' +
      `/setcontact <kontak>\n\n` +
      '📌 Contoh:\n' +
      `/setcontact @admin1\n` +
      `/setcontact 08123456789\n\n` +
      `📌 *BY VAELIX OFC ⚔️*`,
      { parse_mode: 'Markdown' }
    );
  }

  let conf = loadGroupConfig();
  if (!conf[ctx.chat.id]) conf[ctx.chat.id] = {};
  conf[ctx.chat.id].contact = contact;
  saveGroupConfig(conf);
  ctx.reply(`✅ Kontak admin berhasil diset:\n\n📞 ${contact}`);
});

// ==========================================
// 🗑️ FITUR CLEAR
// ==========================================
bot.command('clear', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA MENGHAPUS PESAN!');
    }
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }

  if (!ctx.message.reply_to_message) {
    return ctx.reply(
      '⚠️ *Cara Penggunaan Clear:*\n\n' +
      'Balas pesan yang ingin dijadikan batas penghapusan:\n' +
      `/clear\n\n` +
      '📌 Bot akan menghapus semua pesan dari pesan yang di-reply hingga pesan terakhir.\n\n' +
      `📌 *BY VAELIX OFC ⚔️*`,
      { parse_mode: 'Markdown' }
    );
  }

  try {
    const messageId = ctx.message.reply_to_message.message_id;
    const chatId = ctx.chat.id;
    
    let deletedCount = 0;
    for (let i = messageId; i <= ctx.message.message_id; i++) {
      try {
        await ctx.telegram.deleteMessage(chatId, i);
        deletedCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        continue;
      }
    }
    
    const warningMsg = await ctx.reply(`✅ Berhasil menghapus ${deletedCount} pesan!`);
    setTimeout(() => {
      ctx.deleteMessage(warningMsg.message_id).catch(() => {});
    }, 5000);
  } catch (err) {
    console.error('Clear Error:', err.message);
    ctx.reply('❌ Gagal menghapus pesan. Pastikan bot memiliki izin yang cukup.');
  }
});

// ==========================================
// ⏰ FITUR SETTIME
// ==========================================
bot.command('settime', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA SET ZONA WAKTU!');
    }
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }

  const args = ctx.message.text.split(' ');
  const timezone = args.slice(1).join(' ');
  
  const validTimezones = [
    'Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura',
    'Asia/Bangkok', 'Asia/Singapore', 'Asia/Kuala_Lumpur'
  ];
  
  if (!timezone) {
    return ctx.reply(
      '⚠️ *Cara Penggunaan SetTime:*\n\n' +
      `/settime <zona_waktu>\n\n` +
      '📌 Zona waktu yang tersedia:\n' +
      validTimezones.map(tz => `• ${tz}`).join('\n') +
      `\n\n📌 *BY VAELIX OFC ⚔️*`,
      { parse_mode: 'Markdown' }
    );
  }

  if (!validTimezones.includes(timezone)) {
    return ctx.reply(
      `⚠️ Zona waktu tidak valid!\n\n` +
      `Zona waktu yang tersedia:\n` +
      validTimezones.map(tz => `• ${tz}`).join('\n'),
      { parse_mode: 'Markdown' }
    );
  }

  let conf = loadGroupConfig();
  if (!conf[ctx.chat.id]) conf[ctx.chat.id] = {};
  conf[ctx.chat.id].timezone = timezone;
  saveGroupConfig(conf);
  
  const currentTime = new Date().toLocaleString('id-ID', { timeZone: timezone });
  ctx.reply(`✅ Zona waktu berhasil diset ke:\n\n🕐 ${timezone}\n📅 Waktu sekarang: ${currentTime}`);
});

// ==========================================
// 📋 FITUR FILTER & STOP
// ==========================================
bot.command('filter', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA MENAMBAH FILTER!');
    }
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }

  const args = ctx.message.text.split(' ');
  const keyword = args.slice(1).join(' ');
  
  if (!keyword) {
    return ctx.reply(
      '⚠️ *Cara Penggunaan Filter:*\n\n' +
      `/filter <kata> <reply>\n\n` +
      '📌 Contoh:\n' +
      `/filter cn rvx\n` +
      `/filter halo Halo juga! Ada yang bisa dibantu?\n\n` +
      `📌 *BY VAELIX OFC ⚔️*`,
      { parse_mode: 'Markdown' }
    );
  }

  const parts = keyword.split(' ');
  const filterKeyword = parts[0].toLowerCase();
  const replyText = parts.slice(1).join(' ');
  
  if (!replyText) {
    return ctx.reply('⚠️ Silakan sertakan pesan balasan untuk filter.\nContoh: /filter cn rvx');
  }

  let filterConf = loadFilterConfig();
  if (!filterConf[ctx.chat.id]) filterConf[ctx.chat.id] = {};
  filterConf[ctx.chat.id][filterKeyword] = replyText;
  saveFilterConfig(filterConf);
  
  let stopConf = loadStopConfig();
  if (stopConf[ctx.chat.id] && stopConf[ctx.chat.id][filterKeyword]) {
    delete stopConf[ctx.chat.id][filterKeyword];
    saveStopConfig(stopConf);
  }
  
  ctx.reply(`✅ Filter berhasil ditambahkan!\n\n📌 Kata: *${filterKeyword}*\n📌 Balasan: ${replyText}\n\n📌 *BY VAELIX OFC ⚔️*`, { parse_mode: 'Markdown' });
});

bot.command('stop', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA MENGHENTIKAN FILTER!');
    }
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }

  const args = ctx.message.text.split(' ');
  const keyword = args.slice(1).join(' ').toLowerCase();
  
  if (!keyword) {
    return ctx.reply(
      '⚠️ *Cara Penggunaan Stop:*\n\n' +
      `/stop <kata>\n\n` +
      '📌 Contoh:\n' +
      `/stop cn\n\n` +
      '📌 Perintah ini akan menghentikan filter sementara tanpa menghapusnya.\n\n' +
      `📌 *BY VAELIX OFC ⚔️*`,
      { parse_mode: 'Markdown' }
    );
  }

  let filterConf = loadFilterConfig();
  const filters = filterConf[ctx.chat.id] || {};
  
  if (!filters[keyword]) {
    return ctx.reply(`❌ Filter *${keyword}* tidak ditemukan!\n\nGunakan /listfilter untuk melihat daftar filter.`, { parse_mode: 'Markdown' });
  }

  let stopConf = loadStopConfig();
  if (!stopConf[ctx.chat.id]) stopConf[ctx.chat.id] = {};
  stopConf[ctx.chat.id][keyword] = true;
  saveStopConfig(stopConf);
  
  ctx.reply(`⏸️ Filter *${keyword}* berhasil dihentikan sementara!\n\n📌 Untuk mengaktifkan kembali, gunakan /filter ${keyword} ${filters[keyword]}\n📌 Atau hapus dengan /delfilter ${keyword}\n\n📌 *BY VAELIX OFC ⚔️*`, { parse_mode: 'Markdown' });
});

bot.command('listfilter', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA MELIHAT FILTER!');
    }
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }

  const filterConf = loadFilterConfig();
  const stopConf = loadStopConfig();
  const filters = filterConf[ctx.chat.id] || {};
  const stops = stopConf[ctx.chat.id] || {};
  const filterKeys = Object.keys(filters);
  
  if (filterKeys.length === 0) {
    return ctx.reply('ℹ️ Belum ada filter yang diatur di grup ini.\n\nGunakan /filter untuk menambah filter.');
  }

  let pesan = `📋 *DAFTAR FILTER*\n\n`;
  filterKeys.forEach(key => {
    const status = stops[key] ? '⏸️ [STOP]' : '✅ [AKTIF]';
    pesan += `${status} *${key}* → ${filters[key]}\n`;
  });
  pesan += `\n📌 Total: ${filterKeys.length} filter\n📌 *BY VAELIX OFC ⚔️*`;
  
  ctx.reply(pesan, { parse_mode: 'Markdown' });
});

bot.command('cekfilter', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA MELIHAT FILTER!');
    }
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }

  const filterConf = loadFilterConfig();
  const stopConf = loadStopConfig();
  const filters = filterConf[ctx.chat.id] || {};
  const stops = stopConf[ctx.chat.id] || {};
  const filterKeys = Object.keys(filters);
  
  if (filterKeys.length === 0) {
    return ctx.reply('ℹ️ Belum ada filter yang diatur.\n\nGunakan /filter untuk menambah filter.');
  }

  let pesan = `📋 *DAFTAR FILTER (DEBUG)*\n\n`;
  filterKeys.forEach(key => {
    const status = stops[key] ? '⏸️ STOP' : '✅ AKTIF';
    pesan += `${status} *${key}* → ${filters[key]}\n`;
  });
  pesan += `\n📌 Total: ${filterKeys.length} filter\n📌 *BY VAELIX OFC ⚔️*`;
  
  ctx.reply(pesan, { parse_mode: 'Markdown' });
});

bot.command('testfilter', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA TEST FILTER!');
    }
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }

  const args = ctx.message.text.split(' ');
  const keyword = args.slice(1).join(' ').toLowerCase();
  
  if (!keyword) {
    return ctx.reply(
      '⚠️ *Cara Penggunaan TestFilter:*\n\n' +
      `/testfilter <kata>\n\n` +
      '📌 Contoh:\n' +
      `/testfilter cn\n\n` +
      '📌 Bot akan mengecek apakah kata tersebut ada di filter.\n\n' +
      `📌 *BY VAELIX OFC ⚔️*`,
      { parse_mode: 'Markdown' }
    );
  }

  const filterConf = loadFilterConfig();
  const stopConf = loadStopConfig();
  const filters = filterConf[ctx.chat.id] || {};
  const stops = stopConf[ctx.chat.id] || {};
  
  if (filters[keyword]) {
    const status = stops[keyword] ? '⏸️ [STOP]' : '✅ [AKTIF]';
    ctx.reply(`✅ Filter *${keyword}* DITEMUKAN!\n\n📌 Status: ${status}\n📌 Balasan: ${filters[keyword]}\n\n📌 *BY VAELIX OFC ⚔️*`, { parse_mode: 'Markdown' });
  } else {
    let found = false;
    let foundKey = '';
    for (const [key, value] of Object.entries(filters)) {
      if (key.includes(keyword) || keyword.includes(key)) {
        found = true;
        foundKey = key;
        break;
      }
    }
    
    if (found) {
      const status = stops[foundKey] ? '⏸️ [STOP]' : '✅ [AKTIF]';
      ctx.reply(`⚠️ Filter *${keyword}* tidak ditemukan persis.\n\n📌 Filter yang mirip: *${foundKey}* ${status} → ${filters[foundKey]}\n\n📌 *BY VAELIX OFC ⚔️*`, { parse_mode: 'Markdown' });
    } else {
      ctx.reply(`❌ Filter *${keyword}* TIDAK DITEMUKAN!\n\n📌 Daftar filter saat ini:\n${Object.keys(filters).map(k => `• ${k}`).join('\n') || 'Tidak ada filter'}\n\n📌 *BY VAELIX OFC ⚔️*`, { parse_mode: 'Markdown' });
    }
  }
});

bot.command('delfilter', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply('❌ HANYA ADMIN YANG BISA MENGHAPUS FILTER!');
    }
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }

  const args = ctx.message.text.split(' ');
  const keyword = args.slice(1).join(' ').toLowerCase();
  
  if (!keyword) {
    return ctx.reply(
      '⚠️ *Cara Penggunaan DelFilter:*\n\n' +
      `/delfilter <kata>\n\n` +
      '📌 Contoh:\n' +
      `/delfilter cn\n\n` +
      `📌 *BY VAELIX OFC ⚔️*`,
      { parse_mode: 'Markdown' }
    );
  }

  let filterConf = loadFilterConfig();
  let stopConf = loadStopConfig();
  
  if (filterConf[ctx.chat.id] && filterConf[ctx.chat.id][keyword]) {
    delete filterConf[ctx.chat.id][keyword];
    saveFilterConfig(filterConf);
    
    if (stopConf[ctx.chat.id] && stopConf[ctx.chat.id][keyword]) {
      delete stopConf[ctx.chat.id][keyword];
      saveStopConfig(stopConf);
    }
    
    ctx.reply(`✅ Filter *${keyword}* berhasil dihapus!`, { parse_mode: 'Markdown' });
  } else {
    ctx.reply(`❌ Filter *${keyword}* tidak ditemukan!`, { parse_mode: 'Markdown' });
  }
});

// ==========================================
// 🆔 FITUR /ID
// ==========================================
bot.command('id', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  let text = `🆔 **INFORMASI ID TELEGRAM**\n\n`;
  text += `• **ID Chat / Grup Ini:** \`${ctx.chat.id}\`\n`;
  text += `• **Tipe Chat:** \`${ctx.chat.type}\`\n`;
  text += `• **ID Kamu (User ID):** \`${ctx.from.id}\`\n`;
  if (ctx.message.reply_to_message) {
    const replied = ctx.message.reply_to_message;
    if (replied.forward_from_chat) {
      text += `\n📢 **Info Channel (Dari Pesan Forward):**\n`;
      text += `• **Nama Channel:** ${replied.forward_from_chat.title || '-'}\n`;
      text += `• **ID Channel:** \`${replied.forward_from_chat.id}\`\n`;
      if (replied.forward_from_chat.username) {
        text += `• **Username:** @${replied.forward_from_chat.username}\n`;
      }
    }
  }
  try {
    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('ID Command Error:', err.message);
  }
});

// ==========================================
// 👮 PENGECEKAN, PENCATATAN & ANTI-SPAM
// ==========================================
bot.on('message', async (ctx, next) => {
  const chatId = ctx.chat?.id;
  const fromId = ctx.from?.id;
  const msgObj = ctx.message || ctx.editedMessage;
  if (!chatId || !fromId || !msgObj || ctx.chat.type === 'private') return next ? next() : undefined;

  try {
    let membersData = loadGroupMembers();
    if (!membersData[chatId]) membersData[chatId] = {};
    if (!membersData[chatId][fromId]) {
      membersData[chatId][fromId] = { 
        id: fromId, 
        name: ctx.from.first_name || 'Member', 
        username: ctx.from.username || null 
      };
      saveGroupMembers(membersData);
    }
  } catch {}

  let conf = loadGroupConfig()[chatId] || {};
  let isAdmin = false;
  let isBot = ctx.from?.is_bot || false;
  try { 
    const m = await ctx.telegram.getChatMember(chatId, fromId); 
    isAdmin = ['creator','administrator'].includes(m.status); 
  } catch {}

  // 📋 FITUR FILTER - Deteksi kata kunci
  if (msgObj.text) {
    const filterConf = loadFilterConfig();
    const stopConf = loadStopConfig();
    const filters = filterConf[chatId] || {};
    const stops = stopConf[chatId] || {};
    const textLower = msgObj.text.toLowerCase();
    
    for (const [keyword, reply] of Object.entries(filters)) {
      if (stops[keyword]) continue;
      if (textLower.includes(keyword.toLowerCase())) {
        try {
          await ctx.reply(reply);
        } catch (err) {
          console.error('Filter Reply Error:', err.message);
        }
        break;
      }
    }
  }

  // 🚫 ANTI-FORWARD - Deteksi semua jenis forward
  const isForwarded = msgObj.forward_origin || 
                      msgObj.forward_date || 
                      msgObj.forward_from || 
                      msgObj.forward_from_chat ||
                      msgObj.forward_sender_name ||
                      msgObj.forward_signature;
  
  if (conf.antiForward !== false && isForwarded) {
    try {
      await ctx.deleteMessage(msgObj.message_id).catch(() => {});
      const warningMsg = await ctx.reply(`🚫 **PESAN FORWARD DIHAPUS!**\n\n📌 Forward/Meneruskan pesan tidak diizinkan di grup ini!\n👤 Pengguna: @${ctx.from.username || 'user_'+fromId}\n\n⚠️ Silakan kirim pesan asli (bukan forward)!`).catch(()=>{});
      if (warningMsg) {
        setTimeout(() => { 
          ctx.deleteMessage(warningMsg.message_id).catch(() => {}); 
        }, 10000);
      }
      return;
    } catch (err) {
      console.error('Anti-Forward Error:', err.message);
    }
  }

  // ANTI-BOT
  if (conf.antiBot !== false && isBot && !isAdmin) {
    try {
      await ctx.telegram.banChatMember(chatId, fromId);
      await ctx.telegram.unbanChatMember(chatId, fromId);
      await ctx.deleteMessage(msgObj.message_id).catch(() => {});
      const warningMsg = await ctx.reply(`🤖 **BOT TERDETEKSI!**\n\n🚫 @${ctx.from.username || 'Bot'} telah di-KICK otomatis!\n📌 Grup ini tidak mengizinkan bot selain admin.`);
      setTimeout(() => { ctx.deleteMessage(warningMsg.message_id).catch(() => {}); }, 10000);
      return;
    } catch (err) { console.error('Anti-Bot Error:', err.message); }
  }

  // ANTI-SPAM
  const isAntiSpamActive = conf.antiSpam !== false; 
  if (!isAdmin && isAntiSpamActive) {
    const now = Date.now();
    if (!spamTracker[chatId]) spamTracker[chatId] = {};
    if (!spamTracker[chatId][fromId]) {
      spamTracker[chatId][fromId] = { count: 1, lastTime: now };
    } else {
      const userSpam = spamTracker[chatId][fromId];
      if (now - userSpam.lastTime < 4000) {
        userSpam.count += 1;
        userSpam.lastTime = now;
        if (userSpam.count >= 5) {
          userSpam.count = 0; 
          try {
            const muteUntil = Math.floor(Date.now() / 1000) + 3600;
            await ctx.telegram.restrictChatMember(chatId, fromId, {
              until_date: muteUntil,
              can_send_messages: false,
              can_send_media_messages: false,
              can_send_other_messages: false,
              can_add_web_page_previews: false
            });
            await ctx.deleteMessage(msgObj.message_id).catch(() => {});
            const warningMsg = await ctx.reply(`⚠️ @${ctx.from.username || ctx.from.first_name} TELAH DI-MUTE OTOMATIS SELAMA 1 JAM!\n🚫 Alasan: Melakukan SPAM pesan (5x berturut-turut terlalu cepat).`);
            setTimeout(() => { ctx.deleteMessage(warningMsg.message_id).catch(() => {}); }, 10000);
            return;
          } catch (err) { console.error('Anti-Spam Mute Error:', err.message); }
        }
      } else {
        userSpam.count = 1;
        userSpam.lastTime = now;
      }
    }
  }

  const text = (msgObj.text || msgObj.caption || '').toLowerCase();
  const isPhoto = !!msgObj.photo;
  let hapus = false, alasan = '';
  
  if (conf.antiLink && /(https?:\/\/|www\.|\.[a-z]{2,}\b)/i.test(text)) { hapus = true; alasan = 'MENGIRIM LINK / URL (Termasuk Admin)'; }
  if (!hapus && conf.antiPromo) {
    const kenaPromo = promoKeywords.some(word => new RegExp(`\\b${word.toLowerCase()}\\b|${word.toLowerCase()}`, 'gi').test(text));
    if (kenaPromo) { hapus = true; alasan = 'PROMOSI JUAL BELI / IKLAN'; }
  }
  if (!hapus && conf.antiPromo && promoDomains.some(d => text.includes(d.toLowerCase()))) { hapus = true; alasan = 'PROMOSI / IKLAN SOSMED'; }
  if (!hapus && conf.antiFoto && isPhoto) { hapus = true; alasan = 'MENGIRIM FOTO / GAMBAR'; }
  if (!hapus && (conf.antiJomok || conf.antiToxic)) {
    const kena = badWords.some(word => new RegExp(`\\b${word}\\b|${word}`,'gi').test(text));
    if (kena) { hapus = true; alasan = conf.antiJomok ? 'KATA JOMOK / KOTOR' : 'KATA KASAR / TOXIC'; }
  }

  if (hapus) {
    try { 
      await ctx.deleteMessage(msgObj.message_id); 
      let warningMsg;
      if (isAdmin && conf.antiLink && /(https?:\/\/|www\.|\.[a-z]{2,}\b)/i.test(text)) {
        warningMsg = await ctx.reply(`👑⚠️ **PERINGATAN UNTUK ADMIN!**\n\nAnda adalah ADMIN tetapi tetap terkena aturan ANTI-LINK!\n🔗 Link Anda telah dihapus otomatis.\n\n📌 Semua anggota termasuk ADMIN wajib mematuhi aturan grup!`).catch(()=>{});
      } else if (alasan === 'PROMOSI JUAL BELI / IKLAN') {
        warningMsg = await ctx.reply(`🚫 **PESAN PROMOSI DIHAPUS!**\n\nAlasan: ${alasan}\n👤 Pengguna: @${ctx.from.username || 'user_'+fromId}\n\n📌 Dilarang keras melakukan promosi jual beli di grup ini!`).catch(()=>{});
      } else {
        warningMsg = await ctx.reply(`👑 PESAN DIHAPUS!\nAlasan: ${alasan}\n👤 Pengguna: @${ctx.from.username || 'user_'+fromId}\n⚠️ Hormati aturan grup ya!`).catch(()=>{});
      }
      if (warningMsg) {
        setTimeout(() => { ctx.deleteMessage(warningMsg.message_id).catch(() => {}); }, 10000);
      }
    } catch {}
    return;
  }
  if (next) return next();
});

// ==========================================
// 🎯 ANTI-SPAM STIKER HANDLER
// ==========================================
bot.on('sticker', async (ctx) => {
  const chatId = ctx.chat?.id;
  const fromId = ctx.from?.id;
  const username = ctx.from?.username || ctx.from?.first_name || 'User';
  if (!chatId || ctx.chat.type === 'private') return;
  let conf = loadGroupConfig()[chatId] || {};
  const isAntiStikerActive = conf.antiStiker !== false;
  if (!isAntiStikerActive) return;
  let isAdmin = false;
  try {
    const member = await ctx.telegram.getChatMember(chatId, fromId);
    isAdmin = ['creator', 'administrator'].includes(member.status);
  } catch { isAdmin = false; }
  if (!stickerUserData[fromId]) {
    stickerUserData[fromId] = { count: 0, lastActivity: Date.now(), warnings: 0, mutedUntil: 0 };
  }
  const userData = stickerUserData[fromId];
  const now = Date.now();
  if (now - userData.lastActivity > STICKER_SPAM_CONFIG.CHECK_INTERVAL) {
    userData.count = 0;
    userData.warnings = 0;
  }
  userData.count++;
  userData.lastActivity = now;
  if (userData.mutedUntil > Math.floor(now / 1000)) {
    try {
      await ctx.deleteMessage(ctx.message.message_id);
      const remainingTime = userData.mutedUntil - Math.floor(now / 1000);
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      const warningMsg = await ctx.reply(`⛔ @${username} sedang dalam masa mute stiker! Tunggu ${minutes}m ${seconds}s lagi.`);
      setTimeout(() => { ctx.deleteMessage(warningMsg.message_id).catch(() => {}); }, 10000);
    } catch (err) { console.error('Error deleting sticker:', err.message); }
    return;
  }
  if (userData.count > STICKER_SPAM_CONFIG.MAX_STICKER_PER_MINUTE) {
    userData.warnings++;
    if (userData.warnings >= STICKER_SPAM_CONFIG.WARNING_COUNT) {
      try {
        const muteUntil = Math.floor(now / 1000) + STICKER_SPAM_CONFIG.MUTE_DURATION;
        await ctx.telegram.restrictChatMember(chatId, fromId, {
          until_date: muteUntil,
          can_send_messages: false,
          can_send_media_messages: false,
          can_send_other_messages: false,
          can_add_web_page_previews: false
        });
        userData.mutedUntil = muteUntil;
        userData.count = 0;
        userData.warnings = 0;
        const warningMsg = await ctx.reply(`🔇 @${username} telah di-MUTE selama ${STICKER_SPAM_CONFIG.MUTE_DURATION/60} menit karena SPAM STIKER!`);
        await ctx.deleteMessage(ctx.message.message_id);
        setTimeout(() => { ctx.deleteMessage(warningMsg.message_id).catch(() => {}); }, 10000);
      } catch (err) { console.error('Error muting sticker spammer:', err.message); }
    } else {
      try {
        await ctx.deleteMessage(ctx.message.message_id);
        const remainingWarning = STICKER_SPAM_CONFIG.WARNING_COUNT - userData.warnings;
        const warningMsg = await ctx.reply(`⚠️ @${username}, Anda mengirim stiker terlalu cepat! (${userData.count}/${STICKER_SPAM_CONFIG.MAX_STICKER_PER_MINUTE})\n📢 Peringatan ${userData.warnings}/${STICKER_SPAM_CONFIG.WARNING_COUNT}!`);
        setTimeout(() => { ctx.deleteMessage(warningMsg.message_id).catch(() => {}); }, 10000);
      } catch (err) { console.error('Error warning sticker spam:', err.message); }
    }
    return;
  }
});

// ==========================================
// 🔗 HANDLER AUTO-APPROVE JOIN REQUEST
// ==========================================
bot.on('chat_join_request', async ctx => {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  const username = (ctx.from?.username || '').toLowerCase();
  const inviteLinkObj = ctx.chatJoinRequest?.invite_link;
  const inviteLink = inviteLinkObj?.invite_link;
  if (!chatId || !userId || !inviteLink) return;
  let customLinks = loadCustomLinks();
  const groupLinks = customLinks[chatId];
  if (groupLinks && groupLinks[inviteLink]) {
    const targetData = groupLinks[inviteLink];
    if (username === targetData.username) {
      try {
        await ctx.telegram.approveChatJoinRequest(chatId, userId);
        await ctx.telegram.sendMessage(chatId, `✅ JOIN REQUEST DISETUJUI OTOMATIS!\n\n👤 Selamat datang @${username}, kamu berhasil bergabung menggunakan link khusus!`).catch(()=>{});
      } catch (err) { console.error('Approve Join Request Error:', err.message); }
    } else {
      try { await ctx.telegram.declineChatJoinRequest(chatId, userId); } catch (err) { console.error('Decline Join Request Error:', err.message); }
    }
  }
});

// ==========================================
// 📊 FITUR CEKMEMBER, CEKADMIN, WARN, RESETWARN, CEKSTATUS, SETTAG
// ==========================================
bot.command('cekmember', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN YANG BISA MENGGUNAKAN PERINTAH INI!');
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }
  try {
    const chat = await ctx.telegram.getChat(ctx.chat.id);
    const memberCount = chat.members_count || 0;
    let pesan = `📊 *STATISTIK MEMBER GRUP*\n\n`;
    pesan += `👥 *Nama Grup:* ${chat.title || 'Tidak Diketahui'}\n`;
    pesan += `📌 *Total Member:* ${memberCount} orang\n`;
    pesan += `📅 *Dibuat:* ${chat.date ? new Date(chat.date * 1000).toLocaleDateString('id-ID') : 'Tidak Diketahui'}\n\n📌 *BY VAELIX OFC ⚔️*`;
    await ctx.reply(pesan, { parse_mode: 'Markdown' });
  } catch (err) { ctx.reply('❌ Gagal mengambil data member grup.'); }
});

bot.command('cekadmin', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN YANG BISA MENGGUNAKAN PERINTAH INI!');
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }
  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    let pesan = `👑 *DAFTAR ADMIN GRUP*\n\n`;
    let listAdmin = '';
    admins.forEach(admin => {
      const user = admin.user;
      const status = admin.status === 'creator' ? '👑 Owner' : '🛡️ Admin';
      const username = user.username ? `@${user.username}` : user.first_name || 'Tidak Ada';
      listAdmin += `${status}: ${username} (${user.id})\n`;
    });
    pesan += listAdmin || 'Tidak ada admin.';
    pesan += `\n\n📌 *BY VAELIX OFC ⚔️*`;
    await ctx.reply(pesan, { parse_mode: 'Markdown' });
  } catch (err) { ctx.reply('❌ Gagal mengambil data admin grup.'); }
});

bot.command('warn', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN YANG BISA MEMBERI WARN!');
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }
  if (!ctx.message.reply_to_message) {
    return ctx.reply(`⚠️ *Cara Penggunaan Warn:*\n\nBalas pesan user yang ingin di-warn:\n/warn <alasan>\n\n📌 *BY VAELIX OFC ⚔️*`, { parse_mode: 'Markdown' });
  }
  const targetUser = ctx.message.reply_to_message.from;
  const args = ctx.message.text.split(' ');
  const alasan = args.slice(1).join(' ') || 'Tidak ada alasan';
  try {
    const targetMember = await ctx.telegram.getChatMember(ctx.chat.id, targetUser.id);
    if (['creator', 'administrator'].includes(targetMember.status)) {
      return ctx.reply('❌ Tidak bisa memberi warn ke admin atau owner!');
    }
  } catch {}
  let warnData = loadWarnConfig();
  const chatId = ctx.chat.id;
  if (!warnData[chatId]) warnData[chatId] = {};
  if (!warnData[chatId][targetUser.id]) {
    warnData[chatId][targetUser.id] = { warns: 0, reasons: [], history: [] };
  }
  warnData[chatId][targetUser.id].warns += 1;
  warnData[chatId][targetUser.id].reasons.push(alasan);
  warnData[chatId][targetUser.id].history.push({ date: new Date().toISOString(), admin: ctx.from.id, action: 'warn', reason: alasan });
  const totalWarn = warnData[chatId][targetUser.id].warns;
  saveWarnConfig(warnData);
  let pesan = `⚠️ *WARNING!*\n\n👤 User: ${targetUser.first_name || 'Member'} (@${targetUser.username || 'Tidak Ada'})\n📌 Alasan: ${alasan}\n📊 Total Warn: ${totalWarn}/3\n\n`;
  if (totalWarn >= 3) {
    try {
      await ctx.telegram.banChatMember(chatId, targetUser.id);
      await ctx.telegram.unbanChatMember(chatId, targetUser.id);
      pesan += `🚫 *User telah di-KICK otomatis karena mendapatkan 3 warn!*\n\n`;
      delete warnData[chatId][targetUser.id];
      saveWarnConfig(warnData);
    } catch (err) { console.error('Auto Kick Error:', err.message); }
  }
  pesan += `📌 *BY VAELIX OFC ⚔️*`;
  await ctx.reply(pesan, { parse_mode: 'Markdown' });
});

bot.command('resetwarn', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN YANG BISA RESET WARN!');
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }
  if (!ctx.message.reply_to_message) {
    return ctx.reply(`⚠️ *Cara Penggunaan ResetWarn:*\n\nBalas pesan user yang ingin di-reset warn-nya:\n/resetwarn\n\n📌 *BY VAELIX OFC ⚔️*`, { parse_mode: 'Markdown' });
  }
  const targetUser = ctx.message.reply_to_message.from;
  const chatId = ctx.chat.id;
  let warnData = loadWarnConfig();
  if (warnData[chatId] && warnData[chatId][targetUser.id]) {
    delete warnData[chatId][targetUser.id];
    saveWarnConfig(warnData);
    let pesan = `✅ *Warn Berhasil Direset!*\n\n👤 User: ${targetUser.first_name || 'Member'} (@${targetUser.username || 'Tidak Ada'})\n📌 Status: Semua warn telah dihapus.\n\n📌 *BY VAELIX OFC ⚔️*`;
    await ctx.reply(pesan, { parse_mode: 'Markdown' });
  } else {
    ctx.reply(`ℹ️ User ${targetUser.first_name || 'Member'} tidak memiliki warn.`);
  }
});

bot.command('cekstatus', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN YANG BISA MENGGUNAKAN PERINTAH INI!');
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }
  let targetUser = ctx.from;
  if (ctx.message.reply_to_message) targetUser = ctx.message.reply_to_message.from;
  const chatId = ctx.chat.id;
  let warnData = loadWarnConfig();
  let pesan = `📊 *STATUS USER*\n\n`;
  pesan += `👤 User: ${targetUser.first_name || 'Member'} (@${targetUser.username || 'Tidak Ada'})\n`;
  pesan += `🆔 ID: ${targetUser.id}\n`;
  try {
    const member = await ctx.telegram.getChatMember(chatId, targetUser.id);
    pesan += `👑 Status: ${member.status}\n`;
  } catch {}
  if (warnData[chatId] && warnData[chatId][targetUser.id]) {
    const userWarn = warnData[chatId][targetUser.id];
    pesan += `\n⚠️ *Warn:* ${userWarn.warns}/3\n`;
    if (userWarn.reasons.length > 0) {
      pesan += `📌 *Alasan Warn:*\n`;
      userWarn.reasons.forEach((reason, i) => { pesan += `  ${i+1}. ${reason}\n`; });
    }
    if (userWarn.tag) pesan += `\n🏷️ *Tag:* ${userWarn.tag}\n`;
  } else {
    pesan += `\n✅ *Warn:* 0/3 (Bersih)\n`;
  }
  pesan += `\n📌 *BY VAELIX OFC ⚔️*`;
  await ctx.reply(pesan, { parse_mode: 'Markdown' });
});

bot.command('settag', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN YANG BISA SET TAG!');
  } catch { return ctx.reply('❌ Gagal verifikasi status admin.'); }
  const args = ctx.message.text.split(' ');
  if (!ctx.message.reply_to_message || args.length < 2) {
    return ctx.reply(`⚠️ *Cara Penggunaan SetTag:*\n\nBalas pesan user:\n/settag <tag>\n\n📌 Contoh: /settag [OWNER]\n\n📌 *BY VAELIX OFC ⚔️*`, { parse_mode: 'Markdown' });
  }
  const targetUser = ctx.message.reply_to_message.from;
  const tag = args.slice(1).join(' ');
  try {
    const targetMember = await ctx.telegram.getChatMember(ctx.chat.id, targetUser.id);
    if (['creator', 'administrator'].includes(targetMember.status)) {
      return ctx.reply('❌ Tidak bisa set tag ke admin atau owner!');
    }
  } catch {}
  let warnData = loadWarnConfig();
  const chatId = ctx.chat.id;
  if (!warnData[chatId]) warnData[chatId] = {};
  if (!warnData[chatId][targetUser.id]) {
    warnData[chatId][targetUser.id] = { warns: 0, reasons: [], history: [], tag: tag };
  } else {
    warnData[chatId][targetUser.id].tag = tag;
  }
  saveWarnConfig(warnData);
  let pesan = `🏷️ *Tag Berhasil Diset!*\n\n👤 User: ${targetUser.first_name || 'Member'} (@${targetUser.username || 'Tidak Ada'})\n📌 Tag: *${tag}*\n\n📌 *BY VAELIX OFC ⚔️*`;
  await ctx.reply(pesan, { parse_mode: 'Markdown' });
});

// ==========================================
// ⚡ PERINTAH LAINNYA
// ==========================================
bot.command('info', async ctx => {
  if (ctx.message?.forward_origin) return;
  try {
    const user = ctx.message.reply_to_message?.from || ctx.from;
    const userId = user.id;
    const firstName = user.first_name || '-';
    const username = user.username ? `@${user.username}` : 'Tidak Ada';
    let status = 'member';
    if (ctx.chat.type !== 'private') {
      try {
        const member = await ctx.telegram.getChatMember(ctx.chat.id, userId);
        if (member.status === 'creator') status = 'creator';
        else if (member.status === 'administrator') status = 'admin';
        else status = member.status;
      } catch { status = 'member'; }
    } else { status = userId === OWNER_ID ? 'owner' : 'member'; }
    const infoText = `User info:\nID: ${userId}\nFirst Name: ${firstName}\nUsername: ${username}\nStatus: ${status}`;
    await ctx.reply(infoText);
  } catch (err) { console.error('Info Command Error:', err.message); }
});

bot.command('link', async ctx => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa digunakan di dalam Grup!');
  const args = ctx.message.text.trim().split(/\s+/);
  const targetUserArg = args[1];
  if (!targetUserArg) return ctx.reply('⚠️ Gunakan format: /link @username\nContoh: /link @bunga');
  const targetUsername = targetUserArg.replace('@', '').toLowerCase();
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN YANG BISA MEMBUAT LINK KHUSUS!');
    const inviteObj = await ctx.telegram.createChatInviteLink(ctx.chat.id, {
      name: `Special Link for @${targetUsername}`,
      creates_join_request: true
    });
    const inviteLink = inviteObj.invite_link;
    let customLinks = loadCustomLinks();
    if (!customLinks[ctx.chat.id]) customLinks[ctx.chat.id] = {};
    customLinks[ctx.chat.id][inviteLink] = { username: targetUsername, createdAt: Date.now() };
    saveCustomLinks(customLinks);
    await ctx.reply(`🔗 LINK KHUSUS BERHASIL DIBUAT!\n\n👤 Target User: @${targetUsername}\n🔗 Link: ${inviteLink}\n\n⚠️ Link ini hanya bisa digunakan oleh @${targetUsername}.`);
  } catch (err) {
    ctx.reply('❌ Gagal membuat link khusus! Pastikan bot sudah menjadi Admin.');
  }
});

bot.command('linkgb', async ctx => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Perintah ini hanya bisa di gunakan di dalam Grup!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator','administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN YANG BOLEH MENGAMBIL LINK GRUP!');
    const link = await ctx.exportChatInviteLink();
    ctx.reply(`🔗 LINK GRUP ANDA:\n\n${link}`);
  } catch (err) { ctx.reply('❌ Gagal mendapatkan link grup! Pastikan bot sudah di jadikan Admin.'); }
});

bot.command('open', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Khusus grup saja!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator','administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN!');
    await ctx.setChatPermissions({ can_send_messages:true, can_send_media_messages:true, can_send_other_messages:true, can_add_web_page_previews:true });
    ctx.reply('🔓 GRUP BERHASIL DIBUKA! Semua anggota bisa mengirim pesan.');
  } catch { ctx.reply('❌ Gagal membuka grup!'); }
});

bot.command('close', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Khusus grup saja!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator','administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN!');
    await ctx.setChatPermissions({ can_send_messages:false });
    ctx.reply('🔒 GRUP BERHASIL DITUTUP! Hanya admin yang bisa bicara.');
  } catch { ctx.reply('❌ Gagal menutup grup!'); }
});

bot.command('maintenance', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (!isOwner(ctx)) return ctx.reply('⚠️ KHUSUS OWNER SAJA!');
  const arg = (ctx.message.text.split(' ')[1] || '').toLowerCase();
  const sys = loadSystem();
  if (arg === 'on') { 
    sys.maintenance = true; saveSystem(sys); 
    ctx.reply(`🛠️ *MODE MAINTENANCE: AKTIF!*\n\nBot sedang dalam perbaikan.\nUser yang mengetik /start akan mendapat pesan perbaikan.\n\n📌 *BY VAELIX OFC ⚔️*`, { parse_mode: 'Markdown' }); 
  } else if (arg === 'off') { 
    sys.maintenance = false; saveSystem(sys); 
    ctx.reply('✅ *MODE MAINTENANCE: MATI!*\nBot kembali normal.', { parse_mode: 'Markdown' }); 
  } else {
    ctx.reply(`⚙ Gunakan: /maintenance on / off\nStatus saat ini: ${sys.maintenance ? '🛠️ Sedang Perawatan' : '✅ Berjalan Normal'}`);
  }
});

bot.command('pin', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (!ctx.message.reply_to_message) return ctx.reply('⚠️ Balas pesan yang mau disematkan!');
  try { await ctx.pinChatMessage(ctx.message.reply_to_message.message_id); ctx.reply('📌 Berhasil disematkan!'); }
  catch { ctx.reply('❌ Gagal menyematkan pesan.'); }
});

bot.command('unpin', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  try { await ctx.unpinChatMessage(); ctx.reply('📌 Berhasil dilepas!'); } catch { ctx.reply('❌ Gagal melepas sematan.'); }
});

bot.command('ban', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Khusus grup!');
  if (!ctx.message.reply_to_message) return ctx.reply('⚠️ Balas pesan user!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator','administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN!');
    await ctx.banChatMember(ctx.message.reply_to_message.from.id);
    ctx.reply(`🔨 Berhasil mem-ban ${ctx.message.reply_to_message.from.first_name}!`);
  } catch { ctx.reply('❌ Gagal mem-ban.'); }
});

bot.command('kick', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Khusus grup!');
  if (!ctx.message.reply_to_message) return ctx.reply('⚠️ Balas pesan user!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator','administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN!');
    const uid = ctx.message.reply_to_message.from.id;
    await ctx.banChatMember(uid); await ctx.unbanChatMember(uid);
    ctx.reply(`👢 Berhasil mengeluarkan ${ctx.message.reply_to_message.from.first_name}!`);
  } catch { ctx.reply('❌ Gagal mengeluarkan.'); }
});

bot.command('mute', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Khusus grup!');
  if (!ctx.message.reply_to_message) return ctx.reply('⚠️ Balas pesan user!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator','administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN!');
    await ctx.restrictChatMember(ctx.message.reply_to_message.from.id, { can_send_messages:false, can_send_media_messages:false, can_send_other_messages:false });
    ctx.reply(`🤐 ${ctx.message.reply_to_message.from.first_name} telah dibisukan!`);
  } catch { ctx.reply('❌ Gagal membisukan.'); }
});

bot.command('unmute', async (ctx) => {
  if (ctx.message?.forward_origin) return;
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Khusus grup!');
  if (!ctx.message.reply_to_message) return ctx.reply('⚠️ Balas pesan user!');
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator','administrator'].includes(member.status)) return ctx.reply('❌ HANYA ADMIN!');
    await ctx.restrictChatMember(ctx.message.reply_to_message.from.id, { can_send_messages:true, can_send_media_messages:true, can_send_other_messages:true, can_add_web_page_previews:true });
    ctx.reply(`🔊 ${ctx.message.reply_to_message.from.first_name} sekarang bisa bicara lagi!`);
  } catch { ctx.reply('❌ Gagal membuka suara.'); }
});

// ==========================================
// 🎮 GAME HANDLERS
// ==========================================
const warnaList = [{nama:'Merah',emoji:'🔴'},{nama:'Hijau',emoji:'🟢'},{nama:'Biru',emoji:'🔵'},{nama:'Kuning',emoji:'🟡'},{nama:'Ungu',emoji:'🟣'},{nama:'Oranye',emoji:'🟠'},{nama:'Hitam',emoji:'⚫'},{nama:'Putih',emoji:'⚪'}];
const hewanList = [{nama:'Kucing',emoji:'🐱'},{nama:'Anjing',emoji:'🐶'},{nama:'Singa',emoji:'🦁'},{nama:'Kuda',emoji:'🐴'},{nama:'Ayam',emoji:'🐔'},{nama:'Ikan',emoji:'🐟'},{nama:'Burung',emoji:'🐦'},{nama:'Gajah',emoji:'🐘'},{nama:'Kelinci',emoji:'🐰'},{nama:'Ular',emoji:'🐍'}];
let gameSesi = {};

bot.command('tebakangka', ctx => {
  if (ctx.message?.forward_origin) return;
  const uid = ctx.from.id;
  if (!gameSesi[uid]) {
    const angka = Math.floor(Math.random()*100)+1;
    gameSesi[uid] = { jenis:'angka', jawab:angka };
    ctx.reply('🎯 TEBAK ANGKA\nAngka saya antara 1–100, coba tebak berapa?');
  } else ctx.reply('⚠️ Selesaikan dulu permainan yang sebelumnya!');
});

bot.command('tebakwarna', ctx => {
  if (ctx.message?.forward_origin) return;
  const uid = ctx.from.id;
  if (!gameSesi[uid]) {
    const idx = Math.floor(Math.random()*warnaList.length);
    const soal = warnaList[idx];
    gameSesi[uid] = { jenis:'warna', jawab:soal.nama.toLowerCase() };
    ctx.reply(`🎨 TEBAK WARNA\nWarna apa ini: ${soal.emoji} ?`);
  } else ctx.reply('⚠️ Masih ada permainan yang belum selesai!');
});

bot.command('susunangka', ctx => {
  if (ctx.message?.forward_origin) return;
  const uid = ctx.from.id;
  if (!gameSesi[uid]) {
    const acak = Array.from({length:4}, ()=>Math.floor(Math.random()*9)+1);
    const urut = [...acak].sort((a,b)=>a-b).join('');
    gameSesi[uid] = { jenis:'susun', jawab:urut };
    ctx.reply(`🔢 SUSUN ANGKA\nUrutkan dari kecil ke besar:\n${acak.join('  ')}\nKetik jawaban 4 angka!`);
  } else ctx.reply('⚠️ Masih ada permainan yang belum selesai!');
});

bot.command('tebakhewan', ctx => {
  if (ctx.message?.forward_origin) return;
  const uid = ctx.from.id;
  if (!gameSesi[uid]) {
    const idx = Math.floor(Math.random()*hewanList.length);
    const soal = hewanList[idx];
    gameSesi[uid] = { jenis:'hewan', jawab:soal.nama.toLowerCase() };
    ctx.reply(`🐾 TEBAK HEWAN\nHewan apa ini: ${soal.emoji} ?`);
  } else ctx.reply('⚠️ Masih ada permainan yang belum selesai!');
});

bot.on('text', async (ctx, next) => {
  const uid = ctx.from?.id;
  const jawab = ctx.message?.text?.trim();
  if (!uid || !jawab || jawab.startsWith('/') || !gameSesi[uid] || ctx.message?.forward_origin) return next();
  const sesi = gameSesi[uid];
  let benar = false;
  if (sesi.jenis === 'angka' && /^\d+$/.test(jawab)) {
    const num = parseInt(jawab);
    if (num === sesi.jawab) benar = true;
    else return ctx.reply(num < sesi.jawab ? '📈 Masih terlalu kecil!' : '📉 Masih terlalu besar!');
  } else if ((sesi.jenis === 'warna' || sesi.jenis === 'hewan') && jawab.toLowerCase() === sesi.jawab) benar = true;
  else if (sesi.jenis === 'susun' && /^\d{4}$/.test(jawab) && jawab === sesi.jawab) benar = true;
  else return next();
  if (benar) { delete gameSesi[uid]; ctx.reply('🎉 BENAR SEKALI! Permainan selesai!'); }
});

// ==========================================
// 📥 DOWNLOADER & FUN COMMANDS
// ==========================================
bot.command(['tiktok','tt'], async ctx => {
  if (ctx.message?.forward_origin) return;
  const url = ctx.message.text.split(' ')[1];
  if (!url) return ctx.reply('⚠️ Gunakan: /tiktok <link>');
  const msg = await ctx.reply('⏳ Memproses...');
  try {
    const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { headers:{'User-Agent':'Mozilla/5.0'} });
    if (res.data.code !== 0 || !res.data.data) throw '';
    const video = res.data.data.hdplay || res.data.data.play;
    await ctx.deleteMessage(msg.message_id);
    await ctx.replyWithVideo(video, { caption: `🎬 TIKTOK\n📝 Judul: ${res.data.data.title||'Video'}` });
  } catch { await ctx.deleteMessage(msg.message_id); ctx.reply('❌ Gagal unduh, cek linknya!'); }
});

bot.command(['spotify','sp'], async ctx => {
  if (ctx.message?.forward_origin) return;
  const url = ctx.message.text.split(' ')[1];
  if (!url) return ctx.reply('⚠️ Gunakan: /spotify <link>');
  const msg = await ctx.reply('⏳ Memproses lagu...');
  try {
    const res = await axios.get(`https://api.azbry.com/api/download/spotify?url=${encodeURIComponent(url)}`);
    const dt = res.data?.result||res.data?.data||res.data;
    const audio = typeof dt==='object' ? (dt.download||dt.audio||dt.mp3) : null;
    if (!audio?.startsWith('http')) throw '';
    await ctx.deleteMessage(msg.message_id);
    await ctx.replyWithAudio(audio, { caption: `🎵 SPOTIFY\n📝 Judul: ${dt.title||'Lagu'}` });
  } catch { await ctx.deleteMessage(msg.message_id); ctx.reply('❌ Gagal unduh lagu!'); }
});

bot.command('cekkhodam', ctx => {
  if (ctx.message?.forward_origin) return;
  const daftar = ['Macan Putih','Ular Naga','Kera Sakti','Kosong','Bebek Terbang','Nyi Roro Kidul'];
  ctx.reply(`🔮 Khodam kamu: ${daftar[Math.floor(Math.random()*daftar.length)]}!`);
});

bot.command('cektampan', ctx => {
  if (ctx.message?.forward_origin) return;
  ctx.reply(`😎 Ketampanan: ${Math.floor(Math.random()*100)+1}%`);
});

bot.command('cekkaya', ctx => {
  if (ctx.message?.forward_origin) return;
  const daftar = ['1 Triliun 💸','Mobil Ferrari 🏎️','Dompet Kosong 🕸️','Rumah Mewah 🏰'];
  ctx.reply(`💰 Kekayaan: ${daftar[Math.floor(Math.random()*daftar.length)]}`);
});

bot.command('tebakumur', ctx => {
  if (ctx.message?.forward_origin) return;
  ctx.reply(`🎂 Umur kamu: ${Math.floor(Math.random()*80)+5} Tahun!`);
});

bot.command('casino', ctx => {
  if (ctx.message?.forward_origin) return;
  const icon = ['🎰','💎','7️⃣'];
  const a = icon[Math.floor(Math.random()*3)], b = icon[Math.floor(Math.random()*3)], c = icon[Math.floor(Math.random()*3)];
  ctx.reply(`${a} ${b} ${c}\n\n${a===b&&b===c ? '🎉 JACKPOT MENANG!' : '❌ KALAH!'}`);
});

bot.command('pantun', ctx => {
  if (ctx.message?.forward_origin) return;
  const daftar = ['Makan nasi lauk ikan,\nDibeli dari pasar pagi.\nSalam manis aku ucapkan,\nUntuk kamu yang ganteng/cantik ini.'];
  ctx.reply(daftar[0]);
});

bot.command('brat', async ctx => {
  if (ctx.message?.forward_origin) return;
  const teks = ctx.message.text.split(' ').slice(1).join(' ');
  if (!teks) return ctx.reply('⚠️ Gunakan format: /brat <teks>');
  if (!config.BRAT_API_URL) return ctx.reply('❌ Atur BRAT_API_URL di config.js dulu!');
  const msg = await ctx.reply('⏳ Membuat gambar brat...');
  try {
    const res = await axios.get(`${config.BRAT_API_URL}${encodeURIComponent(teks)}`, { responseType:'arraybuffer' });
    await ctx.deleteMessage(msg.message_id);
    await ctx.replyWithPhoto({ source:Buffer.from(res.data) }, { caption:`🟩 BRAT: ${teks}` });
  } catch { await ctx.deleteMessage(msg.message_id); ctx.reply('❌ Gagal buat gambar brat!'); }
});

bot.command('iqc', async ctx => {
  if (ctx.message?.forward_origin) return;
  const teks = ctx.message.text.split(' ').slice(1).join(' ');
  if (!teks) return ctx.reply('⚠️ Gunakan format: /iqc <teks>');
  const msg = await ctx.reply('⏳ Sedang membuat gambar IQC...');
  const apis = [
    (config.IQC_API_URL || 'https://api.azbry.com/api/maker/igc?text=') + encodeURIComponent(teks),
    `https://api.siputzx.my.id/api/maker/igc?text=${encodeURIComponent(teks)}`
  ];
  let success = false;
  for (const apiUrl of apis) {
    try {
      const res = await axios.get(apiUrl, { 
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 10000
      });
      const contentType = res.headers['content-type'] || '';
      if (contentType.includes('application/json') || contentType.includes('text/plain')) {
        const textData = Buffer.from(res.data).toString('utf8');
        try {
          const jsonData = JSON.parse(textData);
          const imageUrl = jsonData.result || jsonData.data || jsonData.url || jsonData.dl;
          if (imageUrl && typeof imageUrl === 'string') {
            const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0' } });
            await ctx.deleteMessage(msg.message_id).catch(() => {});
            await ctx.replyWithPhoto({ source: Buffer.from(imgRes.data) }, { caption: `📸 IQC: ${teks}` });
            success = true;
            break;
          }
        } catch {}
      } 
      if (contentType.includes('image/') || res.data.length > 500) {
        await ctx.deleteMessage(msg.message_id).catch(() => {});
        await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, { caption: `📸 IQC: ${teks}` });
        success = true;
        break;
      }
    } catch { continue; }
  }
  if (!success) {
    await ctx.deleteMessage(msg.message_id).catch(() => {});
    ctx.reply('❌ Gagal membuat gambar IQC!');
  }
});

bot.command('botinfo', ctx => {
  if (ctx.message?.forward_origin) return;
  const uptime = process.uptime();
  const jam = Math.floor(uptime/3600), menit = Math.floor((uptime%3600)/60), detik = Math.floor(uptime%60);
  ctx.reply(`🤖 INFO BOT\n⏱ Uptime: ${jam}j ${menit}m ${detik}s\n👑 Owner: ${OWNER_ID}\n📌 Nama: VAELIX MD`);
});

bot.command('restart', ctx => {
  if (ctx.message?.forward_origin) return;
  if (!isOwner(ctx)) return ctx.reply('⚠️ KHUSUS OWNER!');
  ctx.reply('🔄 Sedang merestart...').then(() => process.exit(1));
});

bot.command(['add','addgroup'], async ctx => {
  if (ctx.message?.forward_origin) return;
  try {
    const me = await ctx.telegram.getMe();
    ctx.reply('➕ TAMBAHKAN KE GRUP\nKlik tombol di bawah ini:', { reply_markup:{inline_keyboard:[[{text:'➕ Tambahkan Bot',url:`https://t.me/${me.username}?startgroup=true`}]]} });
  } catch { ctx.reply('❌ Gagal membuat link.'); }
});

bot.on('my_chat_member', async ctx => {
  if ((ctx.chatMember.old_chat_member.status === 'left' || ctx.chatMember.old_chat_member.status === 'kicked') && ['member','administrator'].includes(ctx.chatMember.new_chat_member.status)) {
    if (['group','supergroup'].includes(ctx.chat.type)) ctx.telegram.sendMessage(ctx.chat.id, `👋 Halo! Terima kasih sudah menambahkan VAELIX MD ke grup ${ctx.chat.title}!\n✅ Langsung ketik /start untuk melihat menu!\n🖼 FOTO PROFIL TETAP ADA DI SEMUA MENU`).catch(()=>{});
  }
});

// ==========================================
// 🤖 AI CHAT
// ==========================================
bot.command(['ai','metaai'], async ctx => {
  if (ctx.message?.forward_origin) return;
  const tanya = ctx.message.text.split(' ').slice(1).join(' ');
  if (!tanya) return ctx.reply('⚠️ /ai <pertanyaan>');
  if (!config.AI_API_URL || config.AI_API_URL.includes('example.com')) return ctx.reply('❌ Atur AI_API_URL di config.js dulu!');
  const msg = await ctx.reply('🤖 Memproses...');
  try {
    const res = await axios.get(`${config.AI_API_URL}?query=${encodeURIComponent(tanya)}`);
    const jawab = extractApiResponse(res.data);
    await ctx.deleteMessage(msg.message_id);
    await ctx.reply(`🤖 AI MENJAWAB:\n\n${jawab}`);
  } catch { await ctx.deleteMessage(msg.message_id); ctx.reply('❌ AI sedang error!'); }
});

bot.on('text', async (ctx, next) => {
  if (ctx.message?.forward_origin || ctx.message?.text?.startsWith('/')) return next();
  if (!config.AI_API_URL || config.AI_API_URL.includes('example.com')) return next();
  try {
    const res = await axios.get(`${config.AI_API_URL}?query=${encodeURIComponent(ctx.message.text)}`);
    const jawab = extractApiResponse(res.data);
    if (jawab) ctx.reply(jawab);
  } catch { return next(); }
});

// ==========================================
// 🔘 TOMBOL NAVIGASI MENU
// ==========================================
bot.action('menu_main', ctx => editMenuCaption(ctx, textMainMenu, false));
bot.action('menu_admin', ctx => editMenuCaption(ctx, textAdminSecurity, true));
bot.action('menu_fun', ctx => editMenuCaption(ctx, textFunGames, true));
bot.action('menu_downloader', ctx => editMenuCaption(ctx, textDownloader, true));
bot.action('menu_ai', ctx => editMenuCaption(ctx, textAiMenu, true));
bot.action('menu_more', ctx => editMenuCaption(ctx, textMoreMenu, true));
bot.action('menu_thanksto', ctx => editMenuCaption(ctx, textThanksTo, true));
bot.action('menu_owner', ctx => isOwner(ctx) ? editMenuCaption(ctx, textOwnerMenu, true) : ctx.answerCbQuery('⚠️ Khusus Owner!',{show_alert:true}));
bot.action('menu_addgroup', async ctx => {
  try {
    const me = await ctx.telegram.getMe();
    await ctx.reply('➕ TAMBAHKAN KE GRUP', { reply_markup:{inline_keyboard:[[{text:'➕ Tambahkan Bot',url:`https://t.me/${me.username}?startgroup=true`}]]} });
  } catch {}
});
bot.action('menu_all', async ctx => {
  const full = `${textAdminSecurity}\n────────────\n${textFunGames}\n────────────\n${textDownloader}\n────────────\n${textAiMenu}\n────────────\n${textMoreMenu}\n────────────\n${textThanksTo}`;
  await sendMenuWithPhoto(ctx, full, true);
});

// ==========================================
// ⚡ PERINTAH UTAMA
// ==========================================
bot.command('start', async (ctx) => {
  const sys = loadSystem();
  if (sys.maintenance && ctx.from.id !== OWNER_ID) {
    return ctx.reply(`🛠️ *BOT SEDANG DALAM PERBAIKAN!*\n\nMohon bersabar ya, bot sedang diperbaiki oleh tim pengembang.\n\n📌 *BY VAELIX OFC ⚔️*\n\n⏳ Akan segera kembali normal. Terima kasih atas pengertiannya!`, { parse_mode: 'Markdown' });
  }
  sendMenuWithPhoto(ctx, textMainMenu, false);
});

bot.command(['menu','help'], async (ctx) => {
  const sys = loadSystem();
  if (sys.maintenance && ctx.from.id !== OWNER_ID) {
    return ctx.reply(`🛠️ *BOT SEDANG DALAM PERBAIKAN!*\n\nMohon bersabar ya, bot sedang diperbaiki oleh tim pengembang.\n\n📌 *BY VAELIX OFC ⚔️*\n\n⏳ Akan segera kembali normal. Terima kasih atas pengertiannya!`, { parse_mode: 'Markdown' });
  }
  sendMenuWithPhoto(ctx, textMainMenu, false);
});

bot.command(['admin','security'], (ctx) => sendMenuWithPhoto(ctx, textAdminSecurity, true));
bot.command(['fun','games'], (ctx) => sendMenuWithPhoto(ctx, textFunGames, true));
bot.command(['downloader','download'], (ctx) => sendMenuWithPhoto(ctx, textDownloader, true));
bot.command(['aimenu','aihelp'], (ctx) => sendMenuWithPhoto(ctx, textAiMenu, true));
bot.command(['more','moremenu'], (ctx) => sendMenuWithPhoto(ctx, textMoreMenu, true));
bot.command(['thanksto','credits'], (ctx) => sendMenuWithPhoto(ctx, textThanksTo, true));

bot.catch(err => logActivity('ERROR', {}, err.message));

// ==========================================
// 🚀 JALANKAN BOT
// ==========================================
bot.launch().then(() => {
  console.clear();
  console.log(`${colors.cyan}${colors.bright}`);
  console.log(` ╔════════════════════════════════════════╗`);
  console.log(` ║          ✨ VAELIX MD ✨               ║`);
  console.log(` ║   🖼 FOTO PROFIL TETAP DI SEMUA MENU   ║`);
  console.log(` ║   🔒 TOMBOL ONLY — TOLAK FORWARD 🚫    ║`);
  console.log(` ║   🎯 ANTI-SPAM STIKER AKTIF ✅         ║`);
  console.log(` ║   🔗 ANTI-LINK UNTUK SEMUA (ADMIN!)    ║`);
  console.log(` ║   🚫 ANTI-PROMOSI JUAL BELI AKTIF ✅   ║`);
  console.log(` ║   🚫 ANTI-FORWARD AKTIF ✅             ║`);
  console.log(` ║   🤖 ANTI-BOT OTOMATIS AKTIF ✅        ║`);
  console.log(` ║   🕌 AUTO SHOLAT REMINDER AKTIF ✅     ║`);
  console.log(` ║   📊 CEK MEMBER & ADMIN ✅             ║`);
  console.log(` ║   ⚠️ SISTEM WARN (3x = KICK) ✅       ║`);
  console.log(` ║   🏷️ SET TAG USER ✅                  ║`);
  console.log(` ║   👋 WELCOME & LEFT MESSAGE ✅         ║`);
  console.log(` ║   🖼️ SET PIC GROUP ✅                  ║`);
  console.log(` ║   📞 SET CONTACT ADMIN ✅              ║`);
  console.log(` ║   🗑️ CLEAR MESSAGES ✅                 ║`);
  console.log(` ║   ⏰ SET TIMEZONE ✅                   ║`);
  console.log(` ║   📋 FILTER SYSTEM ✅                  ║`);
  console.log(` ║   ⏸️ STOP FILTER ✅                    ║`);
  console.log(` ║   💰 BROTOP CASH (BROADCAST) ✅       ║`);
  console.log(` ║   📢 TAGALL 1000+ USER ✅             ║`);
  console.log(` ║   📋 MORE MENU ✅                      ║`);
  console.log(` ║   ⏱️ AUTO DELETE 10 DETIK ✅            ║`);
  console.log(` ║   🛠️ MAINTENANCE MODE READY ✅         ║`);
  console.log(` ║   🔥 ALL FITUR LENGKAP!                ║`);
  console.log(` ╚════════════════════════════════════════╝${colors.reset}`);
  console.log(` ${colors.green}✔ Status    :${colors.reset} Berjalan Normal ✅`);
  console.log(` ${colors.yellow}📅 Waktu     :${colors.reset} ${getWIBTime()}`);
  console.log(` ${colors.magenta}👑 Owner ID  :${colors.reset} ${OWNER_ID}`);
  console.log(` ${colors.blue}🖼 Foto Menu :${colors.reset} ✅ TETAP ADA (Tidak hilang!)`);
  console.log(` ${colors.green}🎯 Anti-Spam Stiker :${colors.reset} ✅ AKTIF`);
  console.log(` ${colors.green}🔗 Anti-Link Admin :${colors.reset} ✅ AKTIF (Admin Juga Kena!)`);
  console.log(` ${colors.green}🚫 Anti-Promosi    :${colors.reset} ✅ AKTIF (Blokir Jual Beli!)`);
  console.log(` ${colors.green}🚫 Anti-Forward    :${colors.reset} ✅ AKTIF (Admin Juga Kena!)`);
  console.log(` ${colors.green}🤖 Anti-Bot        :${colors.reset} ✅ AKTIF (Kick Otomatis!)`);
  console.log(` ${colors.green}⏱️ Auto Delete      :${colors.reset} ✅ 10 DETIK`);
  console.log(` ${colors.green}🕌 Auto Sholat     :${colors.reset} ✅ ${loadSholatConfig()[Object.keys(loadSholatConfig())[0]]?.active ? 'AKTIF' : 'MATI'}`);
  console.log(` ${colors.green}📊 Cek Member      :${colors.reset} ✅ READY`);
  console.log(` ${colors.green}📊 Cek Admin       :${colors.reset} ✅ READY`);
  console.log(` ${colors.green}⚠️ Sistem Warn     :${colors.reset} ✅ READY (3x = KICK)`);
  console.log(` ${colors.green}🏷️ Set Tag User    :${colors.reset} ✅ READY`);
  console.log(` ${colors.green}👋 Welcome/Left    :${colors.reset} ✅ READY`);
  console.log(` ${colors.green}🖼️ Set Pic Group   :${colors.reset} ✅ READY`);
  console.log(` ${colors.green}📞 Set Contact     :${colors.reset} ✅ READY`);
  console.log(` ${colors.green}🗑️ Clear Messages  :${colors.reset} ✅ READY`);
  console.log(` ${colors.green}⏰ Set Timezone    :${colors.reset} ✅ READY`);
  console.log(` ${colors.green}📋 Filter System   :${colors.reset} ✅ READY (cn, dll)`);
  console.log(` ${colors.green}⏸️ Stop Filter     :${colors.reset} ✅ READY (/stop cn)`);
  console.log(` ${colors.green}💰 Brotop Cash     :${colors.reset} ✅ BROADCAST SYSTEM`);
  console.log(` ${colors.green}📢 Tagall 1000+    :${colors.reset} ✅ REPLY PESAN, TANPA EMOJI`);
  console.log(` ${colors.green}📋 More Menu       :${colors.reset} ✅ READY`);
  console.log(` ${colors.green}💎 Emoji Premium   :${colors.reset} ✅ TERINTEGRASI!`);
  console.log(` ${colors.green}🛠️ Maintenance     :${colors.reset} ✅ ${loadSystem().maintenance ? 'AKTIF' : 'MATI'}`);
});