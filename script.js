// --- CONFIG ---
const MEMBERS = ["Ilham","Ali","Ibrahim","Yahya","Falih","Saad","Nizar","Hamzah","Bilal","Kholid","Abdurrahman","Jarir","Hudzaifah"];
const FEE = 10000;
const PASS = "admin932";
const KP_KEY = 'kpw_payments_v10';
const KE_KEY = 'kpw_expenses_v10';

// --- STATE ---
let S = {
    month: "",
    payments: JSON.parse(localStorage.getItem(KP_KEY)) || {},
    expenses: JSON.parse(localStorage.getItem(KE_KEY)) || [],
    isAdmin: false,
    searchTerm: ""
};

// --- INIT ---
function init() {
    // Set default month
    const now = new Date();
    S.month = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    setupMonthSelector();
    setupEventListeners();
    render();
}

function setupMonthSelector() {
    const sel = document.getElementById('monthSelector');
    const base = new Date();
    base.setMonth(base.getMonth() - 5);
    
    for(let i=0; i<12; i++) {
        const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
        const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        const opt = document.createElement('option');
        opt.value = label;
        opt.textContent = label;
        if(label === S.month) opt.selected = true;
        sel.appendChild(opt);
    }
}

// --- CORE RENDER ---
function render() {
    const m = S.month;
    
    // Calculate Stats
    const totalPaidItems = Object.values(S.payments).filter(Boolean).length;
    const totalIn = totalPaidItems * FEE;
    const totalOut = S.expenses.reduce((sum, e) => sum + e.amount, 0);
    const saldo = totalIn - totalOut;
    
    const paidThisMonth = MEMBERS.filter(name => S.payments[`${name}|${m}`]).length;
    const unpaidCount = MEMBERS.length - paidThisMonth;
    const progress = Math.round((paidThisMonth / MEMBERS.length) * 100);

    // Update Dashboard
    document.getElementById('statSaldo').textContent = fmt(saldo);
    document.getElementById('statIn').textContent = fmt(paidThisMonth * FEE);
    document.getElementById('statOut').textContent = fmt(totalOut);
    document.getElementById('statUnpaid').textContent = `${unpaidCount} orang`;
    
    document.getElementById('progFill').style.width = `${progress}%`;
    document.getElementById('progCount').textContent = `${paidThisMonth} / ${MEMBERS.length}`;
    document.getElementById('progPct').textContent = `${progress}%`;
    document.getElementById('progDate').textContent = new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long' });

    // Render Members (with Search)
    const list = document.getElementById('memberList');
    const filtered = MEMBERS.filter(name => name.toLowerCase().includes(S.searchTerm.toLowerCase()));
    
    if(filtered.length === 0) {
        list.innerHTML = `<div class="empty">Nama "${S.searchTerm}" tidak ditemukan</div>`;
    } else {
        list.innerHTML = filtered.map((name) => {
            const isPaid = !!S.payments[`${name}|${m}`];
            const idx = MEMBERS.indexOf(name);
            return `
                <div class="mrow" onclick="togglePay('${name}')">
                    <div class="mav av${idx % 6}">${name.substring(0,2).toUpperCase()}</div>
                    <span class="mname">${name}</span>
                    <span class="mbadge ${isPaid ? 'paid' : 'unpaid'}">${isPaid ? '✓ Lunas' : 'Belum'}</span>
                </div>`;
        }).join('');
    }

    // Render Expenses
    const exList = document.getElementById('expenseList');
    if(S.expenses.length === 0) {
        exList.innerHTML = `<div class="empty">Belum ada pengeluaran</div>`;
    } else {
        exList.innerHTML = S.expenses.map((e, i) => `
            <div class="erow">
                <div class="eico"><svg viewBox="0 0 24 24"><path d="M23 6l-9.5 9.5-5-5L1 18"/></svg></div>
                <div class="einfo">
                    <div class="enote">${e.note}</div>
                    <div class="edate">${e.date}</div>
                </div>
                <div class="eamt">-${fmt(e.amount)}</div>
                ${S.isAdmin ? `<button class="edel" onclick="deleteExp(${i})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>` : ''}
            </div>
        `).join('');
    }

    // Admin UI
    document.getElementById('admBar').classList.toggle('hidden', !S.isAdmin);
    document.getElementById('addExpBtn').classList.toggle('hidden', !S.isAdmin);
    document.getElementById('adminBtn').classList.toggle('on', S.isAdmin);
}

// --- ACTIONS ---
window.togglePay = (name) => {
    if(!S.isAdmin) return toast("Login admin untuk mengubah data");
    const key = `${name}|${S.month}`;
    if(S.payments[key]) delete S.payments[key];
    else S.payments[key] = true;
    saveData();
    toast(`${name}: ${S.payments[key] ? 'Lunas' : 'Belum Lunas'}`);
};

window.deleteExp = (index) => {
    if(!confirm("Hapus catatan ini?")) return;
    S.expenses.splice(index, 1);
    saveData();
    toast("Catatan dihapus");
};

function saveData() {
    localStorage.setItem(KP_KEY, JSON.stringify(S.payments));
    localStorage.setItem(KE_KEY, JSON.stringify(S.expenses));
    render();
}

// --- MODALS ---
window.checkPw = () => {
    const inp = document.getElementById('pwInput');
    if(inp.value === PASS) {
        S.isAdmin = true;
        closePw();
        render();
        toast("Mode Admin Aktif");
    } else {
        toast("Password Salah!");
        inp.value = "";
    }
};

window.closePw = () => {
    document.getElementById('pwModal').classList.remove('open');
    document.getElementById('pwInput').value = "";
};

window.closeModal = () => document.getElementById('modal').classList.remove('open');

// --- BACKUP & RESTORE ---
function handleBackup() {
    if(!S.isAdmin) return toast("Login admin untuk backup/restore");
    
    const choice = confirm("Klik 'OK' untuk DOWNLOAD Backup (Simpan Data).\nKlik 'Cancel' untuk RESTORE (Unggah Data).");
    
    if(choice) {
        // Download
        const data = JSON.stringify({ payments: S.payments, expenses: S.expenses });
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_kas_${S.month.replace(' ','_')}.json`;
        a.click();
        toast("Data berhasil didownload");
    } else {
        // Upload
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = '.json';
        inp.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (re) => {
                try {
                    const json = JSON.parse(re.target.result);
                    if(json.payments && json.expenses) {
                        if(confirm("Timpa semua data saat ini dengan file backup?")) {
                            S.payments = json.payments;
                            S.expenses = json.expenses;
                            saveData();
                            toast("Restore Berhasil!");
                        }
                    }
                } catch(err) { alert("File tidak valid!"); }
            };
            reader.readAsText(file);
        };
        inp.click();
    }
}

// --- PDF ---
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const m = S.month;

    doc.setFontSize(18);
    doc.text("LAPORAN KAS PEMUDA WONOGIRI", 14, 20);
    doc.setFontSize(11);
    doc.text(`Periode: ${m} | Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);

    const rows = MEMBERS.map((name, i) => [
        i+1, 
        name, 
        S.payments[`${name}|${m}`] ? 'LUNAS' : 'BELUM',
        S.payments[`${name}|${m}`] ? fmt(FEE) : '-'
    ]);

    doc.autoTable({
        startY: 35,
        head: [['No', 'Nama Anggota', 'Status', 'Nominal']],
        body: rows,
        headStyles: { fillColor: [15, 33, 71] }
    });

    if(S.expenses.length > 0) {
        doc.text("PENGELUARAN:", 14, doc.lastAutoTable.finalY + 10);
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 15,
            head: [['Tanggal', 'Keperluan', 'Jumlah']],
            body: S.expenses.map(e => [e.date, e.note, fmt(e.amount)]),
            headStyles: { fillColor: [220, 38, 38] }
        });
    }

    doc.save(`Laporan_Kas_${m}.pdf`);
    toast("PDF Berhasil dibuat");
}

// --- UTILS ---
function fmt(n) { return "Rp " + n.toLocaleString('id-ID'); }

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function setupEventListeners() {
    document.getElementById('enterBtn').onclick = () => {
        document.getElementById('splash').classList.add('sp-exit');
        document.getElementById('app').classList.add('show');
    };

    document.getElementById('adminBtn').onclick = () => {
        if(S.isAdmin) { S.isAdmin = false; render(); toast("Keluar Mode Admin"); }
        else document.getElementById('pwModal').classList.add('open');
    };

    document.getElementById('monthSelector').onchange = (e) => {
        S.month = e.target.value;
        render();
    };

    document.getElementById('searchMember').oninput = (e) => {
        S.searchTerm = e.target.value;
        render();
    };

    document.getElementById('addExpBtn').onclick = () => {
        document.getElementById('mBody').innerHTML = `
            <div class="mf"><label>Keperluan</label><input type="text" id="exNote" placeholder="Contoh: Beli Lampu"></div>
            <div class="mf"><label>Jumlah (Rp)</label><input type="number" id="exAmount" placeholder="0"></div>
        `;
        document.getElementById('mOk').onclick = () => {
            const note = document.getElementById('exNote').value;
            const amount = parseInt(document.getElementById('exAmount').value);
            if(!note || !amount) return toast("Isi data dengan lengkap");
            S.expenses.push({ note, amount, date: new Date().toLocaleDateString('id-ID') });
            saveData();
            closeModal();
        };
        document.getElementById('modal').classList.add('open');
    };

    document.getElementById('backupBtn').onclick = handleBackup;
    document.getElementById('pdfBtn').onclick = downloadPDF;
}

// Start
init();
