// script.js

// 1. Inisialisasi Anggota
const MEMBERS = ["Ilham", "Ali", "Ibrahim", "Yahya", "Falih", "Saad", "Nizar", "Hamzah", "Bilal", "Kholid", "Jarir", "Abdurrahman", "Hudzaifah"];
const MONTHLY_FEE = 10000;

let state = {
    currentMonth: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    payments: JSON.parse(localStorage.getItem('pw_pro_pay')) || {},
    expenses: JSON.parse(localStorage.getItem('pw_pro_exp')) || [],
    agendas: JSON.parse(localStorage.getItem('pw_pro_age')) || [],
    isAdmin: false,
    searchQuery: ""
};

const formatIDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

// 2. Intro Animation
document.getElementById('entryBtn').addEventListener('click', () => {
    document.getElementById('splashScreen').classList.add('exit');
    setTimeout(() => {
        document.getElementById('splashScreen').style.display = 'none';
        const app = document.getElementById('appContent');
        app.classList.remove('hidden');
        setTimeout(() => app.classList.add('open'), 50);
    }, 800);
});

// 3. Render Engine
const render = () => {
    // Stats Calculation
    const totalPemasukanAll = Object.values(state.payments).filter(v => v === true).length * MONTHLY_FEE;
    const totalPengeluaran = state.expenses.reduce((s, e) => s + e.amount, 0);
    const totalSaldo = totalPemasukanAll - totalPengeluaran;
    
    const lunasBulanIni = MEMBERS.filter(m => state.payments[`${m}_${state.currentMonth}`]).length;
    const persentase = Math.round((lunasBulanIni / MEMBERS.length) * 100);

    // Update Dashboard
    document.getElementById('totalSaldo').innerText = formatIDR(totalSaldo);
    document.getElementById('totalPemasukan').innerText = formatIDR(lunasBulanIni * MONTHLY_FEE);
    document.getElementById('totalPengeluaran').innerText = formatIDR(totalPengeluaran);
    document.getElementById('progressText').innerText = persentase + "%";
    document.getElementById('progressBar').style.width = persentase + "%";

    // Filtered Member List
    const filtered = MEMBERS.filter(m => m.toLowerCase().includes(state.searchQuery.toLowerCase()));
    const listEl = document.getElementById('memberList');
    listEl.innerHTML = filtered.map((name, idx) => {
        const paid = state.payments[`${name}_${state.currentMonth}`];
        return `
            <div class="member-card flex items-center justify-between p-5 rounded-[1.5rem] ${paid ? 'is-paid' : ''}">
                <div class="flex items-center gap-4">
                    <span class="text-[9px] font-black text-slate-800">${(idx + 1).toString().padStart(2,'0')}</span>
                    <p class="font-bold text-sm tracking-tight">${name}</p>
                </div>
                <button onclick="togglePayment('${name}')" class="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${paid ? 'bg-[#facc15] text-black shadow-lg shadow-yellow-500/20' : 'bg-white/5 text-slate-600'}">
                    ${paid ? 'Lunas' : 'Belum'}
                </button>
            </div>
        `;
    }).join('');

    // Logs
    document.getElementById('expenseLog').innerHTML = state.expenses.map(e => `
        <div class="p-4 bg-white/2 rounded-2xl flex justify-between items-center border border-white/5">
            <div><p class="text-[11px] font-bold text-slate-200">${e.note}</p><p class="text-[8px] text-slate-600 font-bold mt-1 uppercase italic">${e.date}</p></div>
            <p class="text-xs font-black text-rose-500">-${formatIDR(e.amount)}</p>
        </div>
    `).join('') || '<p class="text-center py-10 text-[9px] font-black text-slate-800 uppercase tracking-widest">Kosong</p>';

    document.getElementById('agendaLog').innerHTML = state.agendas.map(a => `
        <div class="p-5 bg-white/2 rounded-2xl border-l-2 border-[#facc15]">
            <p class="text-[10px] font-black text-[#facc15] uppercase tracking-widest mb-1">${a.title}</p>
            <p class="text-[11px] text-slate-400 leading-relaxed">${a.desc}</p>
        </div>
    `).join('') || '<p class="text-center py-10 text-[9px] font-black text-slate-800 uppercase tracking-widest">Kosong</p>';

    lucide.createIcons();
};

// 4. Admin Logic
document.getElementById('adminBtn').addEventListener('click', () => {
    if(!state.isAdmin) {
        const p = prompt("Password Admin:");
        if(p === "admin123") {
            state.isAdmin = true;
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
            document.body.classList.add('admin-mode');
            render();
        }
    } else {
        state.isAdmin = false;
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
        document.body.classList.remove('admin-mode');
        render();
    }
});

const togglePayment = (name) => {
    if(!state.isAdmin) return alert("Hanya Admin yang punya akses!");
    const key = `${name}_${state.currentMonth}`;
    state.payments[key] = !state.payments[key];
    save();
};

// 5. WhatsApp Sharing Feature
document.getElementById('shareBtn').addEventListener('click', () => {
    const belumBayar = MEMBERS.filter(m => !state.payments[`${m}_${state.currentMonth}`]);
    const totalSaldo = document.getElementById('totalSaldo').innerText;
    
    let text = `*LAPORAN KAS PEMUDA WONOGIRI* 🤙🏻%0A%0A`;
    text += `Bulan: *${state.currentMonth}*%0A`;
    text += `Total Saldo: *${totalSaldo}*%0A%0A`;
    text += `*Anggota Belum Bayar:*%0A`;
    
    if(belumBayar.length === 0) { text += `Semua sudah Lunas! Alhamdulillah.%0A`; } 
    else { belumBayar.forEach((m, i) => { text += `${i+1}. ${m}%0A`; }); }
    
    text += `%0A_Silakan segera hubungi Bendahara. Syukron._`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
});

// 6. Data Management (Backup/Restore)
const exportData = () => {
    const data = JSON.stringify(state);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_kas_wonogiri_${Date.now()}.json`;
    a.click();
};

document.getElementById('importFile').addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedState = JSON.parse(event.target.result);
            state = { ...state, ...importedState, isAdmin: false };
            save();
            alert("Data berhasil dipulihkan!");
        } catch(e) { alert("File tidak valid!"); }
    };
    reader.readAsText(e.target.files[0]);
});

// 7. Modals
const openExpenseModal = () => {
    document.getElementById('modalTitle').innerText = "Catat Keluar";
    document.getElementById('modalBody').innerHTML = `<input type="text" id="eN" placeholder="Keperluan..."><input type="number" id="eA" placeholder="Nominal (Tanpa Titik)...">`;
    document.getElementById('modalConfirm').onclick = () => {
        const n = document.getElementById('eN').value, a = parseInt(document.getElementById('eA').value);
        if(n && a) { state.expenses.unshift({ id: Date.now(), note: n, amount: a, date: new Date().toLocaleDateString('id-ID') }); save(); closeModal(); }
    };
    toggleModal(true);
};

const openAgendaModal = () => {
    document.getElementById('modalTitle').innerText = "Buat Agenda";
    document.getElementById('modalBody').innerHTML = `<input type="text" id="aT" placeholder="Judul Agenda..."><textarea id="aD" placeholder="Detail Info..."></textarea>`;
    document.getElementById('modalConfirm').onclick = () => {
        const t = document.getElementById('aT').value, d = document.getElementById('aD').value;
        if(t && d) { state.agendas.unshift({ id: Date.now(), title: t, desc: d }); save(); closeModal(); }
    };
    toggleModal(true);
};

// Utilities
const toggleModal = (s) => document.getElementById('modalOverlay').classList.toggle('hidden', !s);
const closeModal = () => toggleModal(false);
const save = () => {
    localStorage.setItem('pw_pro_pay', JSON.stringify(state.payments));
    localStorage.setItem('pw_pro_exp', JSON.stringify(state.expenses));
    localStorage.setItem('pw_pro_age', JSON.stringify(state.agendas));
    render();
};

// Search Logic
document.getElementById('searchMember').oninput = (e) => { state.searchQuery = e.target.value; render(); };

// Month Selector Setup
const mSel = document.getElementById('monthSelector');
const d = new Date(); d.setMonth(d.getMonth() - 12);
for(let i=0; i<24; i++) {
    const t = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const o = document.createElement('option'); o.value = t; o.innerText = t;
    if(t === state.currentMonth) o.selected = true;
    mSel.appendChild(o);
    d.setMonth(d.getMonth() + 1);
}
mSel.onchange = (e) => { state.currentMonth = e.target.value; render(); };

// Start
document.getElementById('currentDateDisplay').innerText = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
render();

