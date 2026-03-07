// script.js

// 1. Data Anggota
const MEMBERS = [
    "Ilham", "Ali", "Ibrahim", "Yahya", "Falih", "Sa'ad", 
    "Nizar", "Hamzah", "Bilal", "Kholid", "Abdurrahman", "Jarir", "Hudzaifah"
];

// Generate List Bulan (2 tahun range)
const generateMonthOptions = () => {
    const options = [];
    const date = new Date();
    date.setMonth(date.getMonth() - 12);
    for (let i = 0; i < 24; i++) {
        const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        options.push(monthName);
        date.setMonth(date.getMonth() + 1);
    }
    return options;
};

const currentSystemMonth = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

// State Management
let state = {
    currentViewMonth: currentSystemMonth,
    payments: JSON.parse(localStorage.getItem('pw_v32_pay')) || {},
    expenses: JSON.parse(localStorage.getItem('pw_v32_exp')) || [],
    agendas: JSON.parse(localStorage.getItem('pw_v32_age')) || [
        { id: 1, title: "Kumpul Rutin", date: "2024-01-20", desc: "Membahas rencana kegiatan Pemuda Wonogiri." }
    ],
    isAdmin: false
};

const MONTHLY_FEE = 10000;

// Format Rupiah
const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(num);
};

// Render Fungsi Utama
const render = () => {
    // 1. Kalkulasi Saldo
    const totalPemasukanAll = Object.values(state.payments).filter(v => v === true).length * MONTHLY_FEE;
    const totalPengeluaran = state.expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalSaldo = totalPemasukanAll - totalPengeluaran;

    // Pemasukan bulan yang sedang dilihat
    const pemasukanBulanIni = MEMBERS.filter(m => state.payments[`${m}_${state.currentViewMonth}`]).length * MONTHLY_FEE;

    // 2. Update Dashboard Stats
    document.getElementById('totalSaldo').innerText = formatIDR(totalSaldo);
    document.getElementById('totalPemasukan').innerText = formatIDR(pemasukanBulanIni);
    document.getElementById('totalPengeluaran').innerText = formatIDR(totalPengeluaran);
    document.getElementById('labelPemasukanBulan').innerText = `Pemasukan ${state.currentViewMonth}`;

    // 3. Render Grid Anggota
    const memberGrid = document.getElementById('memberGrid');
    memberGrid.innerHTML = MEMBERS.map(name => {
        const isPaid = state.payments[`${name}_${state.currentViewMonth}`];
        return `
            <div onclick="togglePayment('${name}')" class="member-card p-6 rounded-[2.2rem] text-center transition-all ${isPaid ? 'is-paid' : ''}">
                <div class="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center text-xl font-black bg-[#0b0f1a] border border-white/5 text-emerald-500 shadow-inner">
                    ${name.charAt(0)}
                </div>
                <h4 class="font-bold text-xs mb-3 text-white tracking-tight h-10 flex items-center justify-center">${name}</h4>
                <div class="status-indicator inline-flex items-center px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${isPaid ? 'bg-emerald-500 text-slate-900' : 'bg-white/5 text-slate-500'}">
                    ${isPaid ? 'Lunas' : 'Belum'}
                </div>
            </div>
        `;
    }).join('');

    // 4. Render Pengeluaran
    const expenseList = document.getElementById('expenseList');
    expenseList.innerHTML = state.expenses.length ? state.expenses.map(e => `
        <div class="flex items-center justify-between p-4 bg-white/2 rounded-[1.2rem] border border-white/5">
            <div class="max-w-[65%]">
                <p class="text-[11px] font-bold text-slate-200 truncate">${e.note}</p>
                <p class="text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">${e.date}</p>
            </div>
            <div class="flex items-center gap-3">
                <p class="text-rose-400 font-black text-xs">-${formatIDR(e.amount).replace('Rp', '')}</p>
                ${state.isAdmin ? `<button onclick="deleteExpense(${e.id})" class="text-slate-600 hover:text-rose-500"><i data-lucide="trash-2" size="14"></i></button>` : ''}
            </div>
        </div>
    `).join('') : '<p class="p-10 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest opacity-50 italic">Kosong</p>';

    // 5. Render Agenda
    const agendaList = document.getElementById('agendaList');
    agendaList.innerHTML = state.agendas.length ? state.agendas.map(a => `
        <div class="relative pl-6 border-l-2 border-emerald-500/20">
            <div class="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]"></div>
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="text-xs font-black text-white uppercase">${a.title}</h4>
                    <p class="text-[9px] text-emerald-500 font-black uppercase mt-1 mb-2 tracking-widest">${a.date}</p>
                    <p class="text-[11px] text-slate-400 leading-relaxed font-medium">${a.desc}</p>
                </div>
                ${state.isAdmin ? `<button onclick="deleteAgenda(${a.id})" class="text-slate-700 active:text-rose-500"><i data-lucide="x-circle" size="18"></i></button>` : ''}
            </div>
        </div>
    `).join('') : '<p class="text-center text-slate-600 text-[10px] font-black uppercase tracking-widest opacity-50 italic">Belum ada agenda</p>';

    lucide.createIcons();
};

// --- LOGIC FUNCTIONS ---

// Inisialisasi Selector Bulan
const monthSelector = document.getElementById('monthSelector');
generateMonthOptions().forEach(opt => {
    const el = document.createElement('option');
    el.value = opt;
    el.innerText = opt;
    if(opt === currentSystemMonth) el.selected = true;
    monthSelector.appendChild(el);
});

monthSelector.addEventListener('change', (e) => {
    state.currentViewMonth = e.target.value;
    render();
});

// Admin Control
document.getElementById('adminBtn').addEventListener('click', () => {
    if(!state.isAdmin) {
        const pass = prompt("Password *****:");
        if(pass === "admin932") {
            state.isAdmin = true;
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
            document.body.classList.add('admin-mode');
            render();
        } else if(pass !== null) { alert("Akses Ditolak!"); }
    } else {
        state.isAdmin = false;
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
        document.body.classList.remove('admin-mode');
        render();
    }
});

const togglePayment = (name) => {
    if(!state.isAdmin) return;
    const key = `${name}_${state.currentViewMonth}`;
    state.payments[key] = !state.payments[key];
    saveData();
};

const openExpenseModal = () => {
    document.getElementById('modalTitle').innerText = "Catat Keluar";
    document.getElementById('modalBody').innerHTML = `
        <div class="space-y-1"><label class="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Alasan Pengeluaran</label>
        <input type="text" id="expNote" placeholder="Contoh: Beli Teh Pucuk" class="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-white"></div>
        <div class="space-y-1"><label class="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nominal (Angka Saja)</label>
        <input type="number" id="expAmount" placeholder="Contoh: 50000" class="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-white font-bold"></div>
    `;
    document.getElementById('modalConfirm').onclick = () => {
        const note = document.getElementById('expNote').value;
        const amount = parseInt(document.getElementById('expAmount').value);
        if(note && amount) {
            state.expenses.unshift({ id: Date.now(), note, amount, date: new Date().toLocaleDateString('id-ID') });
            saveData();
            closeModal();
        }
    };
    toggleModal(true);
};

const openAgendaModal = () => {
    document.getElementById('modalTitle').innerText = "Agenda Baru";
    document.getElementById('modalBody').innerHTML = `
        <input type="text" id="ageTitle" placeholder="Judul Agenda" class="w-full bg-white/5 border border-white/5 p-4 rounded-2xl">
        <input type="date" id="ageDate" class="w-full bg-white/5 border border-white/5 p-4 rounded-2xl">
        <textarea id="ageDesc" placeholder="Deskripsi atau info tambahan..." class="w-full bg-white/5 border border-white/5 p-4 rounded-2xl h-28"></textarea>
    `;
    document.getElementById('modalConfirm').onclick = () => {
        const title = document.getElementById('ageTitle').value;
        const date = document.getElementById('ageDate').value;
        const desc = document.getElementById('ageDesc').value;
        if(title && date) {
            state.agendas.unshift({ id: Date.now(), title, date, desc });
            saveData();
            closeModal();
        }
    };
    toggleModal(true);
};

const deleteExpense = (id) => { state.expenses = state.expenses.filter(e => e.id !== id); saveData(); };
const deleteAgenda = (id) => { state.agendas = state.agendas.filter(a => a.id !== id); saveData(); };
const toggleModal = (show) => { document.getElementById('modalOverlay').classList.toggle('hidden', !show); document.getElementById('modalOverlay').classList.toggle('flex', show); };
const closeModal = () => toggleModal(false);

const saveData = () => {
    localStorage.setItem('pw_v32_pay', JSON.stringify(state.payments));
    localStorage.setItem('pw_v32_exp', JSON.stringify(state.expenses));
    localStorage.setItem('pw_v32_age', JSON.stringify(state.agendas));
    render();
};

// Inisialisasi Tanggal Header
const updateHeaderDate = () => {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('headerTodayDate').innerText = now.toLocaleDateString('id-ID', options);
};

// Mulai Aplikasi
updateHeaderDate();

render();

