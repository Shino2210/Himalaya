// Himalaya Web: shared code of the profile, leaderboard and shop pages.
// Same Supabase project and same browser session as the account section of index.html.
const SUPABASE_URL = 'https://winljnabgngqgxhpfzew.supabase.co'
const SUPABASE_KEY = 'sb_publishable__7UaPiPtQ253KzBDv-Z7ww_NJr5hPyJ'
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, storageKey: 'himalaya-site-auth' } })
const $ = (id) => document.getElementById(id)
const HIMA = window.HIMA ?? { banners: {}, ranks: {}, levelTiers: [] }

/** Escapes player-written text (usernames, titles, game names) before putting it in HTML. */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const safeColor = (c) => (/^#[0-9a-f]{3,8}$/i.test(c ?? '') ? c : null)
const nf = (n) => Number(n ?? 0).toLocaleString('fr-FR')
const euros = (cents) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
const hours = (min) => { const h = Math.floor((min ?? 0) / 60); return h >= 1 ? `${nf(h)} h` : `${min ?? 0} min` }
const dateFr = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Public, shareable address of a player's profile. */
// Online, short form …/joueur/Pseudo (404.html redirects it); locally, joueur.html?u=Pseudo.
const profileUrl = (username) => new URL(location.hostname.endsWith('github.io') ? `joueur/${encodeURIComponent(username)}` : `joueur.html?u=${encodeURIComponent(username)}`, location.href).href

/** Profile picture: Himalaya avatars live in img/avatars, anything else falls back to the initial. */
function avatarHTML(url, name, size = 44, vip = false) {
  const id = typeof url === 'string' && url.startsWith('avatar:') ? url.slice(7).replace(/[^a-z0-9-]/gi, '') : null
  const inner = id ? `<img src="img/avatars/${id}.jpg" alt="" loading="lazy" onerror="this.remove()" />` : ''
  return `<span class="av${vip ? ' vip' : ''}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px">${esc((name ?? '?')[0]?.toUpperCase())}${inner ? `<span style="position:absolute;inset:0">${inner}</span>` : ''}</span>`
}

/** Player name in their chosen colour, with #tag and VIP tag. */
function nameHTML(p, withTag = true) {
  const c = safeColor(p.name_color)
  return `<b${c ? ` style="color:${c}"` : ''}>${esc(p.username)}</b>${withTag && p.tag != null ? `<span class="tagno">#${String(p.tag).padStart(4, '0')}</span>` : ''}${p.vip ? ' <span class="vip-tag">VIP</span>' : ''}`
}

function rankHTML(id, size = 28) {
  const r = HIMA.ranks[id] ?? HIMA.ranks.bronze
  if (!r) return ''
  return `<span style="display:inline-flex;align-items:center;gap:6px;font-weight:800;color:${r.colors[2]}"><img src="img/ranks/${esc(id in HIMA.ranks ? id : 'bronze')}.png" alt="" style="width:${size}px;height:${size}px;object-fit:contain" />${esc(r.name)}</span>`
}

/** Account level crest (same tiers as the app). */
function levelHTML(level, size = 56) {
  const tiers = HIMA.levelTiers
  const t = [...tiers].reverse().find((x) => level >= x.from) ?? tiers[0] ?? { from: 0, colors: ['#333', '#999', '#fff'], title: '' }
  const filter = t.gray ? 'grayscale(1) brightness(1.4) drop-shadow(0 0 6px #fff)' : t.hue !== undefined ? `hue-rotate(${t.hue}deg) saturate(1.3) drop-shadow(0 0 ${size / 10}px ${t.colors[1]})` : 'none'
  return `<span title="Niveau ${level} · ${esc(t.title)}" style="position:relative;display:inline-block;width:${size}px;height:${size}px;flex-shrink:0">
    <img src="img/levels/tier-${Math.min(t.from, 50)}.png" alt="" style="width:100%;height:100%;object-fit:contain;filter:${filter}" />
    <span style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);border-radius:99px;border:1px solid ${t.colors[1]};background:${t.colors[0]};padding:0 6px;font:900 ${Math.max(10, size * 0.2)}px Orbitron,sans-serif;color:#fff;line-height:1.35">${level}</span>
  </span>`
}
const levelTitle = (level) => ([...HIMA.levelTiers].reverse().find((x) => level >= x.from) ?? HIMA.levelTiers[0])?.title ?? ''

/** CSS of a profile banner (animated ones use their illustration). */
function bannerCSS(id) {
  const b = HIMA.banners[id]
  if (!b) return 'radial-gradient(ellipse 70% 90% at 20% 0%, rgba(32,217,255,.35), transparent 70%), radial-gradient(ellipse 60% 80% at 85% 10%, rgba(177,140,255,.3), transparent 70%), linear-gradient(180deg, #0c2238, #070b12)'
  return b.image ? `linear-gradient(90deg, ${b.bg} 0%, transparent 55%), url(img/banners/${b.image}.jpg) right center / cover no-repeat, ${b.bg}` : b.bg
}

/** Top navigation, identical on every page; shows the signed-in player. */
function renderNav(active) {
  const nav = document.createElement('nav')
  nav.innerHTML = `<div class="wrap">
    <a class="brand" href="index.html"><img src="img/logo.png" alt="" /><span>HIMALAYA</span></a>
    <div class="links">
      <a href="classement.html" class="${active === 'rank' ? 'on' : ''}">🏆 Classement</a>
      <a href="boutique.html" class="${active === 'shop' ? 'on' : ''}">🛒 Boutique</a>
    </div>
    <a class="btn btn-ghost btn-sm" id="navMe" href="index.html#compte">Mon compte</a>
  </div>`
  document.body.prepend(nav)
  const sky = document.createElement('div')
  sky.className = 'sky'
  document.body.prepend(sky)
  const foot = document.createElement('footer')
  foot.innerHTML = `<div class="wrap"><a class="brand" href="index.html"><img src="img/logo.png" alt="" style="width:30px;height:30px" /><span style="font-size:13px">HIMALAYA</span></a><div>Créé par <b style="color:var(--cyan)">Shino</b> &amp; <b style="color:#FF9ECB">Chamaolla</b> · © ${new Date().getFullYear()}</div></div>`
  document.body.append(foot)
  me().then((p) => {
    if (!p) return
    const a = $('navMe')
    a.className = 'me-chip'
    a.href = profileUrl(p.username)
    a.title = 'Mon profil public'
    a.innerHTML = `${avatarHTML(p.avatar_url, p.username, 30, p.vip)}<span>${esc(p.username)}</span>`
  })
}

/** Signed-in player (public profile row), or null. */
let mePromise = null
function me() {
  mePromise ??= sb.auth.getSession().then(async ({ data }) => {
    const uid = data.session?.user.id
    if (!uid) return null
    const { data: p } = await sb.from('public_profiles').select('id, username, tag, avatar_url, name_color, is_vip').eq('id', uid).maybeSingle()
    return p ? { ...p, vip: p.is_vip } : { id: uid, username: data.session.user.user_metadata?.username ?? data.session.user.email, tag: null }
  })
  return mePromise
}
sb.auth.onAuthStateChange((e) => { if (e === 'SIGNED_IN' || e === 'SIGNED_OUT') mePromise = null })

const frError = (m) => /Invalid login/i.test(m) ? 'E-mail ou mot de passe incorrect.' : /Email not confirmed/i.test(m) ? 'Confirme d\'abord ton e-mail (clique sur le lien reçu), puis connecte-toi.' : /rate limit/i.test(m) ? 'Trop d\'essais : réessaie dans quelques minutes.' : m
