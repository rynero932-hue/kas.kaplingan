// --- CONFIGURATION & DATA ---
const MEMBERS = ["Ilham","Ali","Ibrahim","Yahya","Falih","Saad","Nizar","Hamzah","Bilal","Kholid","Abdurrahman","Jarir","Hudzaifah"];
const FEE = 10000;
const PASS = "admin932";
const KP = 'kpw_pay_v9', KE = 'kpw_exp_v9';

// --- INITIAL STATE ---
function mLabel(d){return d.toLocaleDateString('id-ID',{month:'long',year:'numeric'});}

const S = {
  month: mLabel(new Date()),
  payments: loadLS(KP),
  expenses: loadArr(KE),
  isAdmin: false,
};

// --- HELPERS ---
function loadLS(k){try{return JSON.parse(localStorage.getItem(k))||{};}catch{return{};}}
function loadArr(k){try{const v=JSON.parse(localStorage.getItem(k));return Array.isArray(v)?v:[];}catch{return[];}}
function fmt(n){return 'Rp '+new Intl.NumberFormat('id-ID').format(n);}
function save(){
  localStorage.setItem(KP,JSON.stringify(S.payments));
  localStorage.setItem(KE,JSON.stringify(S.expenses));
  render();
}

// --- CORE RENDER ---
function render(){
  const m = S.month;
  const paidAll = Object.values(S.payments).filter(Boolean).length;
  const totalIn = paidAll * FEE;
  const totalOut = S.expenses.reduce((s,e)=>s+(e.amount||0), 0);
  const saldo = totalIn - totalOut;
  
  const paidM = MEMBERS.filter(n => S.payments[n+'|'+m]).length;
  const unpaid = MEMBERS.length - paidM;
  const pct = Math.round((paidM / MEMBERS.length) * 100);

  // Update Stats
  document.getElementById('statSaldo').textContent = fmt(saldo);
  document.getElementById('statIn').textContent = fmt(paidM * FEE);
  document.getElementById('statOut').textContent = fmt(totalOut);
  document.getElementById('statUnpaid').textContent = unpaid + ' orang';
  
  // Update Progress
  document.getElementById('progFill').style.width = pct + '%';
  document.getElementById('progPct').textContent = pct + '% lunas';
  document.getElementById('progCount').textContent = paidM + ' / ' + MEMBERS.length;

  // Render Members
  document.getElementById('memberList').innerHTML = MEMBERS.map((n, i) => {
    const paid = !!S.payments[n + '|' + m];
    return `
      <div class="mrow" onclick="togglePay('${n}')">
        <span class="mno">${String(i + 1).padStart(2, '0')}</span>
        <div class="mav av${i % 13}">${n.substring(0, 2).toUpperCase()}</div>
        <span class="mname">${n}</span>
        <span class="mbadge ${paid ? 'paid' : 'unpaid'}">${paid ? '✓ Lunas' : 'Belum'}</span>
      </div>`;
  }).join('');

  // Render Expenses
  const el = document.getElementById('expenseList');
  if (!S.expenses.length) {
    el.innerHTML = '<div class="empty">Belum ada pengeluaran dicatat</div>';
  } else {
    el.innerHTML = S.expenses.map((e, i) => `
      <div class="erow">
        <div class="eico">
          <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
        <div class="einfo">
          <div class="enote">${e.note}</div>
          <div class="edate">${e.date}</div>
        </div>
        <div class="eamt">−${fmt(e.amount)}</div>
        <button class="edel ${S.isAdmin ? '' : 'hidden'}" onclick="delExp(${i})">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>`).join('');
  }

  // Admin UI visibility
  document.getElementById('admBar').classList.toggle('hidden', !S.isAdmin);
  document.getElementById('addExpBtn').classList.toggle('hidden', !S.isAdmin);
  document.getElementById('adminBtn').classList.toggle('on', S.isAdmin);
}

// --- ACTIONS ---
window.togglePay = function(name) {
  if (!S.isAdmin) { toast('Ga usah klik kepo wkwkwk'); return; }
  const key = name + '|' + S.month;
  S.payments[key] = !S.payments[key];
  if (!S.payments[key]) delete S.payments[key];
  save();
  toast(S.payments[key] ? name + ' — Lunas ✓' : name + ' — Belum Lunas');
};

window.delExp = function(i) {
  if (!S.isAdmin) return;
  if (!confirm('Hapus pengeluaran ini?')) return;
  S.expenses.splice(i, 1);
  save();
  toast('Pengeluaran dihapus');
};

// --- MODAL & ADMIN LOGIC ---
document.getElementById('adminBtn').addEventListener('click', () => {
  if (S.isAdmin) {
    S.isAdmin = false;
    render();
    toast('Keluar mode admin');
  } else {
    document.getElementById('pwModal').classList.add('open');
    setTimeout(() => document.getElementById('pwInput').focus(), 200);
  }
});

window.closePw = function() {
  document.getElementById('pwModal').classList.remove('open');
  document.getElementById('pwInput').value = '';
};

window.checkPw = function() {
  if (document.getElementById('pwInput').value === PASS) {
    S.isAdmin = true;
    render();
    closePw();
    toast('Mode admin aktif ✓');
  } else {
    toast('Password salah!');
    document.getElementById('pwInput').value = '';
    document.getElementById('pwInput').focus();
  }
};

document.getElementById('pwInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkPw();
});

// Modal Expense
document.getElementById('addExpBtn').addEventListener('click', () => {
  document.getElementById('mBody').innerHTML = `
    <div class="mf"><label>Keperluan</label><input type="text" id="eN" placeholder="Contoh: Konsumsi rapat"></div>
    <div class="mf"><label>Jumlah (Rp)</label><input type="number" id="eA" placeholder="50000" min="0"></div>`;
  
  document.getElementById('mOk').onclick = () => {
    const note = document.getElementById('eN').value.trim();
    const amount = parseInt(document.getElementById('eA').value);
    if (!note || !amount || amount <= 0) { toast('Lengkapi semua isian'); return; }
    
    S.expenses.unshift({
      id: Date.now(),
      note,
      amount,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    });
    save();
    closeModal();
    toast('Pengeluaran berhasil dicatat');
  };
  document.getElementById('modal').classList.add('open');
});

window.closeModal = function() {
  document.getElementById('modal').classList.remove('open');
};

// --- PDF GENERATOR ---
document.getElementById('pdfBtn').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const m = S.month;

  // Header PDF
  doc.setFillColor(15, 33, 71);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('KAS PEMUDA WONOGIRI', 14, 16);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(160, 175, 200);
  doc.text('Periode: ' + m + '   |   Dicetak: ' + new Date().toLocaleDateString('id-ID', { dateStyle: 'long' }), 14, 28);

  // Summary Bar
  doc.setFillColor(29, 78, 216);
  doc.rect(0, 36, 210, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Saldo: ' + document.getElementById('statSaldo').textContent + '   Masuk: ' + document.getElementById('statIn').textContent + '   Keluar: ' + document.getElementById('statOut').textContent, 14, 45);

  // Table Members
  const rows = MEMBERS.map((n, i) => [
    String(i + 1).padStart(2, '0'),
    n,
    S.payments[n + '|' + m] ? 'LUNAS' : 'BELUM',
    S.payments[n + '|' + m] ? fmt(FEE) : '-'
  ]);

  doc.autoTable({
    startY: 57,
    head: [['No', 'Nama', 'Status', 'Iuran']],
    body: rows,
    headStyles: { fillColor: [15, 33, 71], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    didParseCell(d) {
      if (d.section === 'body' && d.column.index === 2) {
        d.cell.styles.textColor = d.cell.raw === 'LUNAS' ? [22, 163, 74] : [156, 163, 175];
        d.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // Table Expenses
  if (S.expenses.length) {
    const y = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('HISTORI PENGELUARAN', 14, y);
    
    doc.autoTable({
      startY: y + 4,
      head: [['Tanggal', 'Keperluan', 'Jumlah']],
      body: S.expenses.map(e => [e.date, e.note, '−' + fmt(e.amount)]),
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [255, 249, 249] }
    });
  }

  doc.save('Kas_Wonogiri_' + m.replace(/ /g, '_') + '.pdf');
  toast('PDF berhasil diunduh');
});

// --- SELECTORS & INITIALIZATION ---
const mSel = document.getElementById('monthSelector');
const base = new Date();
base.setMonth(base.getMonth() - 6);
for (let i = 0; i < 18; i++) {
  const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
  const t = mLabel(d);
  const o = document.createElement('option');
  o.value = t;
  o.textContent = t;
  if (t === S.month) o.selected = true;
  mSel.appendChild(o);
}
mSel.addEventListener('change', e => { S.month = e.target.value; render(); });

// Toast System
let tt;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(() => el.classList.remove('show'), 2500);
}

// Splash Screen Logic
document.getElementById('enterBtn').addEventListener('click', () => {
  document.getElementById('splash').classList.add('sp-exit');
  setTimeout(() => {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('app').classList.add('show');
    render();
  }, 450);
});

// Set Today's Date
document.getElementById('progDate').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

// Initial Render
render();
