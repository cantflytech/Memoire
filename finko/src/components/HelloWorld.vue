<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { db, auth } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- ÉTATS ---
const loading = ref(true);
const activeTab = ref('Tous');
const positions = ref([]);
const savings = ref(0);
const refreshTimer = ref(null);
const nextUpdate = ref(900); // 15 minutes en secondes pour le compte à rebours visuel

// Modales
const showAddForm = ref(false);
const showEditForm = ref(false);
const selectedPosition = ref(null);

const newAsset = ref({ name: '', ticker: '', category: 'Crypto', amount: 0 });
const editAmount = ref(0);

// --- 1. API PRIX (BINANCE) ---
const fetchLivePrice = async (ticker) => {
  try {
    const t = ticker.toLowerCase().trim();
    let symbol = (t === 'btc') ? 'BTCEUR' : (t === 'eth') ? 'ETCEUR' : null;
    if (!symbol) return Math.floor(Math.random() * (200 - 50)) + 50; // Simulation pour actions
    
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await res.json();
    return parseFloat(data.price);
  } catch (e) { return null; }
};

// --- 2. SYNCHRO & AUTO-REFRESH ---
const syncPortfolio = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const positionsRef = collection(db, "user_investment_positions");
  const q = query(positionsRef, where("userId", "==", user.uid));
  const snap = await getDocs(q);
  
  const updatedPos = [];
  for (const d of snap.docs) {
    const data = d.data();
    const livePrice = await fetchLivePrice(data.ticker);
    
    if (livePrice) {
      const newVal = data.quantity * livePrice;
      const change = ((livePrice - data.buy_price_eur) / data.buy_price_eur) * 100;
      
      await updateDoc(doc(db, "user_investment_positions", d.id), {
        current_price_eur: livePrice,
        total_value_eur: newVal,
        monthly_change_percent: parseFloat(change.toFixed(2))
      });
      updatedPos.push({ id: d.id, ...data, current_price_eur: livePrice, total_value_eur: newVal, monthly_change_percent: change });
    } else {
      updatedPos.push({ id: d.id, ...data });
    }
  }
  positions.value = updatedPos;
  loading.value = false;
  nextUpdate.value = 900; // Reset 15 mins
};

// --- 3. GESTION DES FLUX (ACHAT / VENTE) ---
const handleTransaction = async (type) => {
  const pos = selectedPosition.value;
  const livePrice = await fetchLivePrice(pos.ticker);
  
  // Calcul de la variation de quantité
  // Si j'ajoute 100€, ma qte augmente de (100 / prix_actuel)
  const quantityChange = editAmount.value / livePrice;
  const newQuantity = (type === 'buy') ? pos.quantity + quantityChange : pos.quantity - quantityChange;

  if (newQuantity <= 0) {
    await deleteDoc(doc(db, "user_investment_positions", pos.id));
  } else {
    await updateDoc(doc(db, "user_investment_positions", pos.id), {
      quantity: newQuantity,
      invested_amount_eur: (type === 'buy') ? pos.invested_amount_eur + editAmount.value : pos.invested_amount_eur - editAmount.value,
      total_value_eur: newQuantity * livePrice
    });
  }
  showEditForm.value = false;
  syncPortfolio();
};

// --- 4. CYCLE DE VIE (TIMERS) ---
onMounted(() => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      await syncPortfolio();
      
      // Timer pour le compte à rebours visuel (toutes les secondes)
      setInterval(() => { if (nextUpdate.value > 0) nextUpdate.value--; }, 1000);

      // Rafraîchissement automatique toutes les 15 minutes
      refreshTimer.value = setInterval(syncPortfolio, 15 * 60 * 1000);
    }
  });
});

onUnmounted(() => clearInterval(refreshTimer.value));

// --- CALCULS ---
const totalInvested = computed(() => positions.value.reduce((sum, p) => sum + p.total_value_eur, 0));
const globalYield = computed(() => {
  const invested = positions.value.reduce((sum, p) => sum + p.invested_amount_eur, 0);
  return invested === 0 ? 0 : (((totalInvested.value - invested) / invested) * 100).toFixed(2);
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-6 font-['Inter'] space-y-6">
    
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
        <span class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
          MàJ auto dans {{ Math.floor(nextUpdate / 60) }}m {{ nextUpdate % 60 }}s
        </span>
      </div>
      <button @click="showAddForm = true" class="bg-[#5B51F4] text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm">
        + AJOUTER UNE LIGNE
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white border p-5 rounded-[24px] shadow-xs">
        <span class="text-[10px] font-bold text-gray-400 block uppercase mb-1">Patrimoine Investi</span>
        <span class="text-3xl font-black text-gray-900">{{ Math.round(totalInvested).toLocaleString() }} €</span>
      </div>
      <div class="bg-white border p-5 rounded-[24px] shadow-xs">
        <span class="text-[10px] font-bold text-gray-400 block uppercase mb-1">Rendement Global</span>
        <span class="text-3xl font-black" :class="globalYield >= 0 ? 'text-emerald-500' : 'text-rose-500'">
          {{ globalYield }} %
        </span>
      </div>
    </div>

    <div class="bg-white border rounded-[24px] overflow-hidden">
      <div class="p-5 border-b flex justify-between items-center">
        <h3 class="text-sm font-black uppercase tracking-wide">Mes positions</h3>
        <div class="flex gap-2">
           <button v-for="t in ['Tous', 'Crypto', 'Obligation']" :key="t" @click="activeTab = t" 
           :class="activeTab === t ? 'text-[#5B51F4] border-[#5B51F4]' : 'text-gray-400 border-transparent'"
           class="text-[10px] font-black uppercase border-b-2 pb-1">{{ t }}</button>
        </div>
      </div>

      <div class="divide-y">
        <div v-for="pos in positions" :key="pos.id" class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-xs">{{ pos.ticker }}</div>
            <div>
              <p class="text-sm font-black text-gray-900">{{ pos.name }}</p>
              <p class="text-[10px] text-gray-400 font-bold">Quantité : {{ pos.quantity.toFixed(4) }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-6">
            <div class="text-right">
              <p class="text-sm font-black text-gray-900">{{ Math.round(pos.total_value_eur).toLocaleString() }} €</p>
              <p class="text-[10px] font-bold" :class="pos.monthly_change_percent >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                {{ pos.monthly_change_percent }}%
              </p>
            </div>
            <button @click="selectedPosition = pos; showEditForm = true" class="p-2 hover:bg-indigo-50 rounded-lg text-indigo-500 transition-colors">
              ⚙️
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditForm" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div class="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl space-y-6">
        <div class="text-center">
          <h3 class="text-xl font-black text-gray-900">Mouvement de fonds</h3>
          <p class="text-xs text-gray-400 font-bold uppercase mt-1">{{ selectedPosition.name }} ({{ selectedPosition.ticker }})</p>
        </div>
        
        <div class="space-y-2">
          <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Montant de la transaction (€)</label>
          <input v-model.number="editAmount" type="number" class="w-full p-4 bg-gray-50 border rounded-2xl font-black text-center outline-none focus:border-indigo-500" placeholder="Ex: 500" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button @click="handleTransaction('sell')" class="py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs hover:bg-rose-100 transition-all border border-rose-100">VENDRE</button>
          <button @click="handleTransaction('buy')" class="py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs hover:bg-emerald-100 transition-all border border-emerald-100">ACHETER</button>
        </div>
        <button @click="showEditForm = false" class="w-full text-xs font-bold text-gray-400 py-2">ANNULER</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-ping { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
</style>