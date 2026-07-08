<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { db, auth } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc, addDoc, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { 
  PieChart, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-vue-next';

const loading = ref(true);
const activeTab = ref('Tous');

const showEditModal = ref(false);
const selectedPosition = ref(null);
const transactionAmountEur = ref(0);

const positions = ref([]);
const recentActivities = ref([]); 
const currentUser = ref(null);

const broadcastPortfolioUpdate = () => {
  window.dispatchEvent(new CustomEvent('investment-updated'));
};

const refreshFromExternalUpdate = () => {
  if (currentUser.value) loadDashboardData(currentUser.value);
};

const fetchLivePrice = async (ticker) => {
  try {
    if (!ticker) return null;
    const cleanTicker = ticker.toLowerCase().trim();
    if (cleanTicker === 'btc') {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCEUR');
      const data = await res.json();
      return parseFloat(data.price);
    } else if (cleanTicker === 'eth') {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHEUR');
      const data = await res.json();
      return parseFloat(data.price);
    } else if (cleanTicker === 'sol') {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLEUR');
      const data = await res.json();
      return parseFloat(data.price);
    } else if (cleanTicker === 'bnb') {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBEUR');
      const data = await res.json();
      return parseFloat(data.price);
    } else if (cleanTicker === 'xrp') {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=XRPEUR');
      const data = await res.json();
      return parseFloat(data.price);
    }
    return null;
  } catch (error) {
    console.error("Erreur d'appel API prix pour " + ticker, error);
    return null; 
  }
};

const loadDashboardData = async (user) => {
  try {
    loading.value = true;
    
    const positionsRef = collection(db, "user_investment_positions");
    const q = query(positionsRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    const localPositions = [];
    let calculatedTotal = 0;
    
    for (const document of querySnapshot.docs) {
      const posData = document.data();
      const livePrice = ['Immobilier', 'ETF'].includes(posData.category)
        ? null
        : await fetchLivePrice(posData.ticker);
      
      let currentPrice = posData.current_price_eur || posData.buy_price_eur;
      let totalValueAsset = posData.quantity * currentPrice;
      
      if (livePrice) {
        currentPrice = livePrice;
        totalValueAsset = posData.quantity * currentPrice;
        const changePercent = ((currentPrice - posData.buy_price_eur) / posData.buy_price_eur) * 100;
        
        const posDocRef = doc(db, "user_investment_positions", document.id);
        await updateDoc(posDocRef, {
          current_price_eur: currentPrice,
          total_value_eur: totalValueAsset,
          monthly_change_percent: parseFloat(changePercent.toFixed(2))
        });
      }

      calculatedTotal += totalValueAsset;
      localPositions.push({
        id: document.id,
        ...posData,
        current_price_eur: currentPrice,
        total_value_eur: totalValueAsset,
        monthly_change_percent: livePrice ? parseFloat((((currentPrice - posData.buy_price_eur) / posData.buy_price_eur) * 100).toFixed(2)) : (posData.monthly_change_percent || 0)
      });
    }
    
    positions.value = localPositions;
    
    const profileRef = doc(db, "user_financial_profile", user.uid);
    await updateDoc(profileRef, {
      total_investment: calculatedTotal
    });

    await fetchRecentActivities(user.uid);
    
  } catch (e) {
    console.error("Erreur lors de la synchronisation :", e);
  } finally {
    loading.value = false;
  }
};

const logActivity = async (userId, type, assetName, ticker, amount) => {
  try {
    const activityRef = collection(db, "user_financial_profile", userId, "activities");
    await addDoc(activityRef, {
      type,
      assetName,
      ticker: ticker.toUpperCase(),
      amount: Number(amount),
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error("Erreur lors du log de l'activité :", e);
  }
};

const fetchRecentActivities = async (userId) => {
  try {
    const activityRef = collection(db, "user_financial_profile", userId, "activities");
    
    // SÉCURITÉ DE SECOURS : Si l'index orderBy crashe, on récupère les docs brut et on trie en JavaScript
    const snap = await getDocs(activityRef);
    if (!snap.empty) {
      const allActs = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Affiche les ordres passes (achat / vente) et les ajouts initiaux, puis garde les 5 plus recents.
      recentActivities.value = allActs
        .filter((act) => act.type === 'buy' || act.type === 'sell' || act.type === 'initial')
        .sort((a, b) => {
          const tA = a.timestamp?.seconds || 0;
          const tB = b.timestamp?.seconds || 0;
          return tB - tA;
        })
        .slice(0, 5);
    } else {
      recentActivities.value = [];
    }
  } catch (e) {
    console.error("Erreur lors de la récupération des activités :", e);
  }
};

const handleTransaction = async (type) => {
  const user = auth.currentUser;
  const pos = selectedPosition.value;
  if (!user || !pos || transactionAmountEur.value <= 0) return;

  try {
    const marketPrice = await fetchLivePrice(pos.ticker) || pos.current_price_eur;
    const quantityGap = transactionAmountEur.value / marketPrice;
    let updatedQuantity = pos.quantity;
    let updatedInvestedAmount = pos.invested_amount_eur || pos.total_value_eur;

    if (type === 'buy') {
      updatedQuantity += quantityGap;
      updatedInvestedAmount += transactionAmountEur.value;
    } else if (type === 'sell') {
      updatedQuantity -= quantityGap;
      updatedInvestedAmount -= transactionAmountEur.value;
    }

    const posDocRef = doc(db, "user_investment_positions", pos.id);
    if (updatedQuantity <= 0.0001) {
      await deleteDoc(posDocRef);
    } else {
      await updateDoc(posDocRef, {
        quantity: updatedQuantity,
        invested_amount_eur: updatedInvestedAmount,
        total_value_eur: updatedQuantity * marketPrice
      });
    }

    await logActivity(user.uid, type, pos.name, pos.ticker, transactionAmountEur.value);

    showEditModal.value = false;
    await loadDashboardData(user);
    broadcastPortfolioUpdate();
  } catch (e) {
    console.error("Erreur lors de la modification de la position :", e);
  }
};

const openEditModal = (pos) => {
  selectedPosition.value = pos;
  transactionAmountEur.value = 0;
  showEditModal.value = true;
};

const totalCalculatedInvestment = computed(() => {
  return positions.value.reduce((sum, pos) => sum + pos.total_value_eur, 0);
});

const categoryTotals = computed(() => {
  const totals = { Crypto: 0, ETF: 0, Obligation: 0, Immobilier: 0 };
  positions.value.forEach(p => {
    if (totals[p.category] !== undefined) totals[p.category] += p.total_value_eur;
  });
  return totals;
});

const diversificationScore = computed(() => {
  const total = totalCalculatedInvestment.value;
  if (total === 0) return 0;

  const cryptoWeight = (categoryTotals.value.Crypto || 0) / total;
  const etfWeight = (categoryTotals.value.ETF || 0) / total;
  const obligationWeight = (categoryTotals.value.Obligation || 0) / total;
  const immoWeight = (categoryTotals.value.Immobilier || 0) / total;

  const hhi = Math.pow(cryptoWeight, 2) + Math.pow(etfWeight, 2) + Math.pow(obligationWeight, 2) + Math.pow(immoWeight, 2);
  
  const maxHhi = 1;
  const minHhi = 1 / 4; 
  
  const score = ((maxHhi - hhi) / (maxHhi - minHhi)) * 100;
  return Math.min(Math.max(Math.round(score), 0), 100);
});

const filteredPositions = computed(() => {
  if (activeTab.value === 'Tous') return positions.value;
  return positions.value.filter(p => p.category === activeTab.value);
});

onMounted(() => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser.value = user;
      loadDashboardData(user);
    }
  });
  window.addEventListener('investment-updated', refreshFromExternalUpdate);
});

onUnmounted(() => {
  window.removeEventListener('investment-updated', refreshFromExternalUpdate);
});
</script>

<template>
  <main class="bg-[#F8FAFC] font-['Inter'] max-w-7xl mx-auto heading">
    
    <div v-if="loading" class="h-48 bg-gray-100 animate-pulse rounded-[24px] w-full"></div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      
      <div class="lg:col-span-2 bg-white border border-gray-100 rounded-[24px] p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <h3 class="flex items-center gap-2.5 text-xs font-black text-gray-400 uppercase tracking-wider">
              <span class="p-1.5 bg-indigo-50 text-[#5B51F4] rounded-lg inline-flex items-center justify-center">
                <PieChart class="w-4 h-4" />
              </span>
              Mes positions d'actifs
            </h3>
            
            <div class="flex bg-gray-100/80 p-1 rounded-xl text-xs font-black text-gray-700">
              <button v-for="tab in ['Tous', 'Crypto', 'ETF', 'Obligation', 'Immobilier']" :key="tab"
                @click="activeTab = tab"
                :class="activeTab === tab ? 'bg-[#5B51F4] text-white shadow-sm' : 'hover:text-gray-900'"
                class="px-4 py-1.5 rounded-lg transition-all font-black cursor-pointer"
              >
                {{ tab }}
              </button>
            </div>
          </div>

          <div class="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            <div v-for="pos in filteredPositions" :key="pos.id" class="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/40 px-2 rounded-xl transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center font-black text-xs">
                  {{ pos.ticker.substring(0, 2) }}
                </div>
                <div>
                  <h4 class="text-xs text-gray-900 font-black leading-tight">{{ pos.name }}</h4>
                  <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{{ pos.ticker }}</span>
                </div>
              </div>
              
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="text-xs text-gray-900 font-black tracking-tight">{{ Math.round(pos.total_value_eur).toLocaleString() }} €</p>
                  <span :class="pos.monthly_change_percent >= 0 ? 'text-[#00AA90]' : 'text-red-500'" class="text-[10px] font-black flex items-center justify-end gap-0.5">
                    <component :is="pos.monthly_change_percent >= 0 ? TrendingUp : TrendingDown" class="w-3 h-3" />
                    {{ Math.abs(pos.monthly_change_percent) }}%
                  </span>
                </div>
           
                <button @click="openEditModal(pos)" class="bg-gray-50 hover:bg-gray-100 text-gray-400 p-2 rounded-xl transition-colors border border-gray-100 cursor-pointer">
                  ⚙️
                </button>
              </div>
            </div>
            
            <div v-if="filteredPositions.length === 0" class="text-center py-12 text-xs text-gray-400 font-bold uppercase tracking-wider">
              Aucun actif répertorié.
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4 flex flex-col justify-between h-full">
        
        <div class="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm text-center">
          <h3 class="text-xs font-black text-gray-400 uppercase tracking-wider w-full text-left mb-4">Diversification du capital</h3>
          <div class="relative w-full flex flex-col items-center justify-center mt-2">
            <svg class="w-36 h-20" viewBox="0 0 100 60">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#F1F5F9" stroke-width="10" stroke-linecap="round" />
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#00AA90" stroke-width="10" stroke-linecap="round"
                    stroke-dasharray="126" :stroke-dashoffset="126 - (126 * diversificationScore) / 100" class="transition-all duration-500" />
            </svg>
            <div class="absolute bottom-1 text-xl font-black text-gray-900">
              {{ diversificationScore }} %
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm flex-grow flex flex-col min-h-[220px]">
          <h3 class="text-xs font-black text-gray-400 uppercase tracking-wider text-left mb-4 flex items-center gap-1.5">
            <Clock class="w-4 h-4 text-gray-400" /> Dernières opérations
          </h3>
          
          <div v-if="recentActivities.length > 0" class="space-y-3 flex-grow overflow-y-auto">
            <div v-for="act in recentActivities" :key="act.id" class="flex justify-between items-center border-b border-gray-50 pb-2.5 last:border-none last:pb-0">
              <div class="flex items-center gap-2">
                <div :class="[act.type === 'buy' || act.type === 'initial' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600']" class="p-1.5 rounded-lg">
                  <component :is="act.type === 'buy' || act.type === 'initial' ? ArrowUpRight : ArrowDownRight" class="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 class="text-xs font-black text-gray-900 capitalize leading-none">{{ act.assetName }}</h5>
                  <span class="text-[9px] font-semibold uppercase text-gray-400 tracking-wider">{{ act.type === 'initial' ? 'Ajout' : act.type === 'buy' ? 'Achat' : 'Vente' }}</span>
                </div>
              </div>
              <span class="text-xs font-black text-gray-900">{{ Number(act.amount || 0).toLocaleString() }} €</span>
            </div>
          </div>

          <div v-else class="text-center py-12 text-xs text-gray-400 font-bold uppercase tracking-wider my-auto">
            Aucun ordre exécuté récent
          </div>
        </div>

      </div>
    </div>

    <div v-if="showEditModal" class="fixed inset-0 bg-black/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
      <div class="bg-white rounded-[24px] p-6 max-w-sm w-full border border-gray-100 shadow-xl space-y-5 animate-fade-in">
        <div class="text-center">
          <h3 class="text-xs font-black text-gray-400 uppercase tracking-wider">Ajuster votre position</h3>
          <p class="text-xs text-[#5B51F4] font-black mt-1 uppercase">{{ selectedPosition?.name }} ({{ selectedPosition?.ticker }})</p>
        </div>
        
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-gray-400 uppercase">Montant de la transaction (€)</label>
          <input
            v-model.number="transactionAmountEur"
            type="number"
            class="w-full p-3 bg-gray-50 border rounded-xl font-black text-center text-sm outline-none focus:border-[#5B51F4]"
            placeholder="Ex: 250"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button @click="handleTransaction('sell')" class="py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-black text-xs transition-colors border border-rose-100 cursor-pointer">
            📉 RETIRER / VENDRE
          </button>
          <button @click="handleTransaction('buy')" class="py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-black text-xs transition-colors border border-emerald-100 cursor-pointer">
            📈 COMPLÉTER / ACHETER
          </button>
        </div>
        
        <div class="text-center pt-1">
          <button @click="showEditModal = false" class="text-[10px] font-black uppercase text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
            Annuler
          </button>
        </div>
      </div>
    </div>

  </main>
</template>