// script.js

// 1. DATA MASTER
const MEMBERS = ["Ilham", "Ali", "Ibrahim", "Yahya", "Falih", "Saad", "Nizar", "Hamzah", "Bilal", "Kholid", "Abdurrahman", "Jarir", "Hudzaifah"];
const MONTHLY_FEE = 10000;

let state = {
    currentMonth: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    payments: JSON.parse(localStorage.getItem('pw_wonogiri_v6_pay')) || {},
    expenses: JSON.parse(localStorage.getItem('pw_wonogiri_v6_exp')) || [],
    isAdmin: false
};

const formatIDR = (n) => "Rp " + new Intl.NumberFormat('id-ID').format(n);

// 2. RENDER ENGINE
function render() {
    // Stats
    const totalPemasukanAll = Object.values(state.payments).filter(v => v === true).length * MONTHLY_FEE;
    const totalPengeluaran = state.expenses.reduce((s, e) => s + e.amount, 0);
    const totalSaldo = totalPemasukanAll - totalPengeluaran;
    
    const lunasBulanIni = MEMBERS.filter(m => state.payments[`${m}_${state.currentMonth}`]).length;
    const progress = Math.round((lunasBulanIni / MEMBERS.length) * 100);

    // Dashboard Update
    document.getElementById('totalSaldo').innerText = formatIDR(totalSaldo);
    document.getElementById('totalPemasukan').innerText = formatIDR(lunasBulanIni * MONTHLY_FEE);
    document.getElementById('totalPengeluaran').innerText = formatIDR(totalPengeluaran);
    document.getElementById('progressText').innerText = progress + "%";
    document.getElementById('progressBar').style.width = progress + "%";

    // Member List
    const listEl = document.getElementById('memberList');
    listEl.innerHTML = MEMBERS.map((name, idx) => {
        const isPaid = state.payments[`${name}_${state.currentMonth}`];
        return `
            <div class="member-row flex items-center justify-between p-6 rounded-[2rem]">
                <div class="flex items-center gap-5">
                    <span class="text-[10px] font-black text-slate-800">${(idx+1).toString().padStart(2, '0')}</span>
                    <p class="name-text ${isPaid ? 'text-white' : 'text-slate-600'}">${name}</p>
                </div>
                <button onclick="togglePayment('${name}')" class="px-7 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${isPaid ? 'bg-[#facc15] text-black shadow-lg shadow-yellow-500/20' : 'bg-white/5 text-slate-600'}">
                    ${isPaid ? 'LUNAS' : 'BELUM'}
                </button>
            </div>
        `;
    }).join('');

    // Expense Log
    document.getElementById('expenseLog').innerHTML = state.expenses.map(e => `
        <div class="p-5 bg-[#111] rounded-3xl flex justify-between items-center border border-white/5">
            <div>
                <p class="text-xs font-black text-slate-300 uppercase">${e.note}</p>
                <p class="text-[9px] text-slate-600 font-bold mt-1 uppercase italic">${e.date}</p>
            </div>
            <p class="text-lg font-black text-rose-500">-${formatIDR(e.amount).replace('Rp ', '')}</p>
        </div>
    `).join('') || '<p class="text-center py-6 text-slate-800 font-black uppercase text-[10px]">Belum ada pengeluaran</p>';

    lucide.createIcons();
}

// 3. INTRO DOOR ANIMATION
document.getElementById('entryBtn').addEventListener('click', () => {
    document.getElementById('doorLeft').classList.add('door-open-left');
    document.getElementById('doorRight').classList.add('door-open-right');
    
    const app = document.getElementById('appWrapper');
    app.classList.remove('hidden');
    setTimeout(() => {
        app.classList.add('show');
        document.getElementById('introContainer').style.display = 'none';
        document.body.style.overflow = 'auto'; // Enable scrolling
    }, 1200);
});

// 4. ADMIN & PDF
document.getElementById('adminBtn').addEventListener('click', () => {
    const p = prompt("Password Admin:");
    if(p === "admin123") {
        state.isAdmin = !state.isAdmin;
        document.getElementById('addExpBtn').classList.toggle('hidden', !state.isAdmin);
        render();
    }
});

window.togglePayment = function(name) {
    if(!state.isAdmin) return;
    const key = `${name}_${state.currentMonth}`;
    state.payments[key] = !state.payments[key];
    save();
};

document.getElementById('pdfBtn').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("KAS PEMUDA WONOGIRI", 14, 20);
    doc.setFontSize(12);
    doc.text(`Periode: ${state.currentMonth}`, 14, 30);
    doc.text(`Total Kas: ${document.getElementById('totalSaldo').innerText}`, 14, 38);

    const data = MEMBERS.map((m, i) => [
        i + 1, m, state.payments[`${m}_${state.currentMonth}`] ? "LUNAS" : "BELUM", "Rp 10.000"
    ]);

    doc.autoTable({
        startY: 45,
        head: [['NO', 'NAMA', 'STATUS', 'IURAN']],
        body: data,
        theme: 'striped',
        headStyles: { fillColor: [250, 204, 21], textColor: [0, 0, 0] }
    });
    doc.save(`Kas_Wonogiri_${state.currentMonth}.pdf`);
});

// 5. MODALS & UTILS
window.openExpenseModal = function() {
    document.getElementById('modalTitle').innerText = "Catat Keluar";
    document.getElementById('modalBody').innerHTML = `<input type="text" id="eN" placeholder="Keperluan..."><input type="number" id="eA" placeholder="Jumlah Rp...">`;
    document.getElementById('modalConfirm').onclick = () => {
        const n = document.getElementById('eN').value, a = parseInt(document.getElementById('eA').value);
        if(n && a) {
            state.expenses.unshift({ id: Date.now(), note: n, amount: a, date: new Date().toLocaleDateString('id-ID') });
            save(); closeModal();
        }
    };
    toggleModal(true);
};
const toggleModal = (s) => document.getElementById('modalOverlay').classList.toggle('hidden', !s);
window.closeModal = () => toggleModal(false);
const save = () => {
    localStorage.setItem('pw_wonogiri_v6_pay', JSON.stringify(state.payments));
    localStorage.setItem('pw_wonogiri_v6_exp', JSON.stringify(state.expenses));
    render();
};

// Month Setup
const mSel = document.getElementById('monthSelector');
const date = new Date(); date.setMonth(date.getMonth() - 12);
for(let i=0; i<24; i++) {
    const t = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const o = document.createElement('option'); o.value = t; o.innerText = t;
    if(t === state.currentMonth) o.selected = true;
    mSel.appendChild(o);
    date.setMonth(date.getMonth() + 1);
}
mSel.onchange = (e) => { state.currentMonth = e.target.value; render(); };

// Start
document.getElementById('currentDateDisplay').innerText = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });
lucide.createIcons();
render();
