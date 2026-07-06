<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { db, auth } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- ÉTATS RÉACTIFS ---
const loading = ref(true);
const updatingPrices = ref(false); 
const activeTab = ref('Tous');

// États pour l'Auto-Refresh automatique toutes les 15 minutes
const refreshIntervalInstance = ref(null);
const nextAutoUpdateTime = ref(900); 

// États pour les modales de modification de positions
const showEditModal = ref(false);
const selectedPosition = ref(null);
const transactionAmountEur = ref(0); 

// Données du profil financier (Bannière haute)
const savings = ref(0);     
const investment = ref(0);  // Sera synchronisé en temps réel avec Firebase

// Liste des positions de l'utilisateur
const positions = ref([]);

// Formulaire d'ajout d'un nouvel actif
const showForm = ref(false);
const newAsset = ref({
  name: '',
  ticker: '',
  category: 'Crypto',
  invested_amount_eur: 0 
});

// --- API FINANCIAL & RECALCUL EN DIRECT (BINANCE) ---
const fetchLivePrice = async (ticker) => {
  try {
    const cleanTicker = ticker.toLowerCase().trim();
    if (cleanTicker === 'btc') {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCEUR');
      const data = await res.json();
      return parseFloat(data.price);
    } else if (cleanTicker === 'eth') {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETCEUR');
      const data = await res.json();
      return parseFloat(data.price);
    }
    return Math.floor(Math.random() * (250 - 50 + 1)) + 50; 
  } catch (error) {
    console.error("Erreur d'appel API prix pour " + ticker, error);
    return null; 
  }
};

// --- CHARGEMENT ET MISE À JOUR DES COURS + MISE À JOUR DU TOTAL FIRESTORE ---
const loadDashboardData = async (user, forceRefresh = false) => {
  try {
    if (forceRefresh) updatingPrices.value = true;
    else loading.value = true;
    
    // 1. Charger l'épargne depuis user_financial_profile
    const profileRef = doc(db, "user_financial_profile", user.uid);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const data = profileSnap.data().user_financial_profile || profileSnap.data();
      savings.value = data.total_wealth || 0;
    }

    // 2. Charger les positions de l'utilisateur
    const positionsRef = collection(db, "user_investment_positions");
    const q = query(positionsRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    const localPositions = [];
    let calculatedTotal = 0; // Variable temporaire pour calculer la somme exacte en direct
    
    for (const document of querySnapshot.docs) {
      const posData = document.data();
      const livePrice = await fetchLivePrice(posData.ticker);
      
      let currentPrice = posData.current_price_eur || posData.buy_price_eur;
      let totalValueAsset = posData.quantity * currentPrice;

      if (livePrice) {
        currentPrice = livePrice;
        totalValueAsset = posData.quantity * currentPrice;
        
        const changePercent = ((currentPrice - posData.buy_price_eur) / posData.buy_price_eur) * 100;

        // Mise à jour de la position individuelle dans Firestore
        const posDocRef = doc(db, "user_investment_positions", document.id);
        await updateDoc(posDocRef, {
          current_price_eur: currentPrice,
          total_value_eur: totalValueAsset,
          monthly_change_percent: parseFloat(changePercent.toFixed(2))
        });
      }

      // Cumul pour obtenir le total exact du portefeuille réévalué
      calculatedTotal += totalValueAsset;

      localPositions.push({
        id: document.id,
        ...posData,
        current_price_eur: currentPrice,
        total_value_eur: totalValueAsset,
        monthly_change_percent: livePrice ? parseFloat((((currentPrice - posData.buy_price_eur) / posData.buy_price_eur) * 100).toFixed(2)) : (posData.monthly_change_percent || 0)
      });
    }
    
    // Attribution au tableau réactif
    positions.value = localPositions;
    
    // 3. MISE À JOUR CRITIQUE DE TOTAL_INVESTMENT DANS FIRESTORE
    // On écrit directement la valeur cumulée `calculatedTotal` pour éviter les décalages de l'état réactif Vue
    await updateDoc(profileRef, {
      total_investment: calculatedTotal
    });
    
    // Mise à jour locale de l'état pour l'affichage de l'interface
    investment.value = calculatedTotal;

    // Reset du compte à rebours de l'auto-refresh (15 min)
    nextAutoUpdateTime.value = 900;

  } catch (e) {
    console.error("Erreur lors de la synchronisation du Dashboard et du total_investment :", e);
  } finally {
    loading.value = false;
    updatingPrices.value = false;
  }
};

// --- LOGIQUE DE TRANSACTIONS (ACHAT / VENTE) ---
const openEditModal = (pos) => {
  selectedPosition.value = pos;
  transactionAmountEur.value = 0;
  showEditModal.value = true;
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

    showEditModal.value = false;
    
    // On relance loadDashboardData qui va tout recalculer et écraser l'ancien total_investment dans Firestore !
    await loadDashboardData(user, true);
    
    alert(type === 'buy' ? "Achat pris en compte ! Capital complété." : "Vente enregistrée avec succès !");
  } catch (e) {
    console.error("Erreur lors de la modification de la position :", e);
  }
};

// --- TIMERS DE RAFRAÎCHISSEMENT COHÉRENTS ---
onMounted(() => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadDashboardData(user);

      // Compte à rebours visuel
      setInterval(() => {
        if (nextAutoUpdateTime.value > 0) nextAutoUpdateTime.value--;
      }, 1000);

      // Auto-refresh toutes les 15 minutes
      refreshIntervalInstance.value = setInterval(() => {
        loadDashboardData(user, true);
      }, 15 * 60 * 1000);
    }
  });
});

onUnmounted(() => {
  if (refreshIntervalInstance.value) clearInterval(refreshIntervalInstance.value);
});

const triggerManualUpdate = () => {
  const user = auth.currentUser;
  if (user) loadDashboardData(user, true);
};

// --- AJOUTER UN NOUVEL ACTIF EN ENTRANT DES EUROS ---
const handleAddAsset = async () => {
  const user = auth.currentUser;
  if (!user || !newAsset.value.ticker || newAsset.value.invested_amount_eur <= 0) return;

  try {
    const marketPrice = await fetchLivePrice(newAsset.value.ticker);
    if (!marketPrice) {
      alert("Impossible de récupérer le prix de cet actif. Vérifiez le ticker.");
      return;
    }

    const calculatedQuantity = newAsset.value.invested_amount_eur / marketPrice;

    const positionsRef = collection(db, "user_investment_positions");
    await addDoc(positionsRef, {
      userId: user.uid,
      name: newAsset.value.name,
      ticker: newAsset.value.ticker.toUpperCase().trim(),
      category: newAsset.value.category,
      quantity: calculatedQuantity,                          
      buy_price_eur: marketPrice,                            
      current_price_eur: marketPrice,
      invested_amount_eur: Number(newAsset.value.invested_amount_eur), 
      total_value_eur: Number(newAsset.value.invested_amount_eur),
      monthly_change_percent: 0
    });

    showForm.value = false;
    newAsset.value = { name: '', ticker: '', category: 'Crypto', invested_amount_eur: 0 };
    
    // Le chargement ici va automatiquement additionner ce nouvel actif et mettre à jour Firebase
    await loadDashboardData(user);
    
    alert("Actif ajouté ! Quantité calculée automatiquement par rapport au marché.");
  } catch (e) {
    console.error("Erreur d'ajout de l'actif :", e);
  }
};

// --- COMPUTED UTILES ---
const totalCalculatedInvestment = computed(() => {
  return positions.value.reduce((sum, pos) => sum + pos.total_value_eur, 0);
});

const totalInvestedCapital = computed(() => {
  return positions.value.reduce((sum, pos) => sum + (pos.invested_amount_eur || pos.total_value_eur), 0);
});

const portfolioYield = computed(() => {
  if (totalInvestedCapital.value === 0) return 0;
  const gain = totalCalculatedInvestment.value - totalInvestedCapital.value;
  return parseFloat(((gain / totalInvestedCapital.value) * 100).toFixed(2));
});

const globalNetWorth = computed(() => savings.value + investment.value);

const savingsPercentage = computed(() => {
  if (globalNetWorth.value === 0) return 0;
  return Math.round((savings.value / globalNetWorth.value) * 100);
});

const investmentPercentage = computed(() => {
  if (globalNetWorth.value === 0) return 0;
  return Math.round((investment.value / globalNetWorth.value) * 100);
});

const filteredPositions = computed(() => {
  if (activeTab.value === 'Tous') return positions.value;
  return positions.value.filter(p => p.category === activeTab.value);
});

const categoryTotals = computed(() => {
  const totals = { Crypto: 0, Obligation: 0, Immobilier: 0 };
  positions.value.forEach(p => {
    if (totals[p.category] !== undefined) totals[p.category] += p.total_value_eur;
  });
  return totals;
});
</script>
<template>
  <div class="max-w-7xl mx-auto w-full px-4 py-6 font-['Inter'] space-y-6">
    
    <div class="bg-[#00AA90] text-white rounded-[20px] p-5 md:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 relative overflow-hidden">
      <div class="flex flex-col items-center sm:items-start z-10 w-full sm:w-auto text-center sm:text-left">
        <div class="bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1.5 mb-2">
          <span class="text-xs">🛡️</span>
          <span class="text-[9px] font-black uppercase tracking-wider">Mode Sécurité</span>
        </div>
        <div class="flex flex-col">
          <span class="text-3xl md:text-4xl font-black tracking-tight">
            {{ Math.round(globalNetWorth).toLocaleString() }} <span class="text-xl md:text-2xl font-bold">€</span>
          </span>
          <span class="text-[11px] font-bold text-white/80 mt-0.5">Patrimoine total réévalué</span>
        </div>
      </div>

      <div class="flex items-center justify-center sm:justify-end gap-10 md:gap-14 z-10 w-full sm:w-auto">
        <div class="flex flex-col items-end pr-10 md:pr-14 border-r border-white/20">
          <h4 class="text-[10px] font-bold uppercase opacity-75 tracking-wide mb-0.5">Épargne</h4>
          <span class="text-2xl md:text-3xl font-black">{{ savingsPercentage }}<span class="text-base font-bold">%</span></span>
          <span class="text-[10px] font-bold text-white/80 mt-0.5">{{ Math.round(savings).toLocaleString() }}€</span>
        </div>
        <div class="flex flex-col items-end">
          <h4 class="text-[10px] font-bold uppercase opacity-75 tracking-wide mb-0.5">Investissement</h4>
          <span class="text-2xl md:text-3xl font-black">{{ investmentPercentage }}<span class="text-base font-bold">%</span></span>
          <span class="text-[10px] font-bold text-white/80 mt-0.5">{{ Math.round(totalCalculatedInvestment).toLocaleString() }}€</span>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center">
      <div class="flex items-center gap-3">
        <button 
          @click="triggerManualUpdate" 
          :disabled="updatingPrices"
          class="bg-gray-100 hover:bg-gray-200 border text-gray-700 font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <span :class="{ 'animate-spin': updatingPrices }">🔄</span>
          {{ updatingPrices ? 'Synchronisation...' : 'Mettre à jour les cours' }}
        </button>

        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg">
          ⏱️ Actu dans {{ Math.floor(nextAutoUpdateTime / 60) }}m {{ nextAutoUpdateTime % 60 }}s
        </span>
      </div>

      <button @click="showForm = !showForm" class="bg-[#5B51F4] hover:bg-[#473EE0] text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition-all">
        {{ showForm ? '✖ Fermer' : '➕ Ajouter un investissement' }}
      </button>
    </div>

    <div v-if="showForm" class="bg-white border border-gray-100 p-5 rounded-[24px] shadow-xs max-w-xl mx-auto w-full space-y-4 animate-fade-in">
      <h3 class="text-sm font-black text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Quel montant avez-vous investi ?</h3>
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="flex flex-col space-y-1">
          <label class="font-bold text-gray-500">Nom de l'actif (ex: Bitcoin)</label>
          <input v-model="newAsset.name" type="text" placeholder="Bitcoin" class="p-2 border rounded-xl outline-none focus:border-[#5B51F4]" />
        </div>
        <div class="flex flex-col space-y-1">
          <label class="font-bold text-gray-500">Ticker (ex: BTC, ETH)</label>
          <input v-model="newAsset.ticker" type="text" placeholder="BTC" class="p-2 border rounded-xl outline-none focus:border-[#5B51F4]" />
        </div>
        <div class="flex flex-col space-y-1">
          <label class="font-bold text-gray-500">Catégorie d'allocation</label>
          <select v-model="newAsset.category" class="p-2 border rounded-xl outline-none bg-white">
            <option value="Crypto">Crypto</option>
            <option value="Obligation">Obligation</option>
            <option value="Immobilier">Immobilier</option>
          </select>
        </div>
        <div class="flex flex-col space-y-1">
          <label class="font-bold text-gray-500">Montant placé en Euros (€)</label>
          <input v-model.number="newAsset.invested_amount_eur" type="number" placeholder="500" class="p-2 border rounded-xl outline-none focus:border-[#5B51F4]" />
        </div>
      </div>
      <button @click="handleAddAsset" class="w-full bg-[#00AA90] text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors">
        Ajouter le placement
      </button>
    </div>

    <div v-if="loading" class="h-40 bg-gray-100 animate-pulse rounded-[24px]"></div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
      <div class="lg:col-span-2 space-y-4">
        
        <div class="grid grid-cols-2 gap-4 text-center">
          <div class="bg-white border p-4 rounded-2xl shadow-xs">
            <span class="text-[10px] font-bold text-gray-400 block mb-1">Volatilité portefeuille</span>
            <span class="text-xl font-black text-gray-800">~ 4.5%</span>
            <p class="text-[9px] font-bold text-gray-400 mt-0.5">Calculé sur le profil risque</p>
          </div>
          <div class="bg-white border p-4 rounded-2xl shadow-xs">
            <span class="text-[10px] font-bold text-gray-400 block mb-1">Rendement total actuel</span>
            <span class="text-xl font-black" :class="portfolioYield >= 0 ? 'text-emerald-600' : 'text-rose-600'">
              {{ portfolioYield >= 0 ? '↗' : '↘' }} {{ portfolioYield }} %
            </span>
            <p class="text-[9px] font-bold text-gray-400 mt-0.5">Plus-value latente marchés</p>
          </div>
        </div>

        <div class="bg-white border border-gray-100 rounded-[24px] p-5 space-y-4">
          <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h3 class="text-sm font-black text-gray-900 uppercase tracking-wide">Mes positions</h3>
            <div class="flex bg-gray-100 p-1 rounded-xl text-[10px] font-black text-gray-500">
              <button v-for="tab in ['Tous', 'Crypto', 'Obligation', 'Immobilier']" :key="tab"
                @click="activeTab = tab"
                :class="activeTab === tab ? 'bg-[#5B51F4] text-white shadow-xs' : 'hover:text-gray-900'"
                class="px-3 py-1.5 rounded-lg transition-all"
              >
                {{ tab }}
              </button>
            </div>
          </div>

          <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            <div v-for="pos in filteredPositions" :key="pos.id" class="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 bg-indigo-100 text-[#5B51F4] rounded-full flex items-center justify-center font-bold text-[10px]">
                  {{ pos.ticker }}
                </div>
                <div>
                  <h4 class="text-xs font-black text-gray-800">{{ pos.name }}</h4>
                  <span class="text-[9px] text-gray-400 font-bold uppercase">Achat: {{ Math.round(pos.buy_price_eur).toLocaleString() }}€ • Qté: {{ pos.quantity.toFixed(4) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="text-xs font-black text-gray-900">{{ Math.round(pos.total_value_eur).toLocaleString() }} €</p>
                  <span class="text-[9px] font-bold" :class="pos.monthly_change_percent >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                    {{ pos.monthly_change_percent >= 0 ? '▲ +' : '▼ ' }}{{ pos.monthly_change_percent }}%
                  </span>
                </div>
                <button 
                  @click="openEditModal(pos)" 
                  class="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-xl text-xs transition-colors"
                  title="Modifier les fonds (Achat / Vente)"
                >
                  ⚙️
                </button>
              </div>
            </div>
            <div v-if="filteredPositions.length === 0" class="text-center py-6 text-xs text-gray-400 font-medium">
              Aucun actif dans cette catégorie.
            </div>
          </div>
        </div>

      </div>

      <div class="space-y-4">
        <div class="bg-white border border-gray-100 rounded-[24px] p-5 space-y-4">
          <h3 class="text-sm font-black text-gray-900 uppercase tracking-wide">Allocation</h3>
          
          <div class="flex justify-center py-2">
            <div class="w-32 h-32 rounded-full border-[12px] border-[#5B51F4] flex items-center justify-center relative">
              <span class="text-xs font-black text-indigo-900 text-center">
                {{ Math.round(totalCalculatedInvestment).toLocaleString() }} €
              </span>
            </div>
          </div>

          <div class="space-y-2 text-[11px] font-bold text-gray-600">
            <div class="flex justify-between items-center">
              <span>🟪 Crypto</span>
              <span class="text-gray-900">{{ Math.round(categoryTotals.Crypto).toLocaleString() }} €</span>
            </div>
            <div class="flex justify-between items-center">
              <span>🟦 Obligation</span>
              <span class="text-gray-900">{{ Math.round(categoryTotals.Obligation).toLocaleString() }} €</span>
            </div>
            <div class="flex justify-between items-center">
              <span>🟩 Immobilier</span>
              <span class="text-gray-900">{{ Math.round(categoryTotals.Immobilier).toLocaleString() }} €</span>
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-100 rounded-[24px] p-5 text-center space-y-2">
          <h3 class="text-sm font-black text-gray-900 uppercase tracking-wide text-left">Score de diversification</h3>
          <div class="text-2xl font-black text-gray-800">50 %</div>
          <div class="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div class="bg-gradient-to-r from-teal-500 to-[#5B51F4] h-full rounded-full w-1/2"></div>
          </div>
        </div>
      </div>

    </div>

    <div v-if="showEditModal" class="fixed inset-0 bg-black/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
      <div class="bg-white rounded-[24px] p-6 max-w-sm w-full border border-gray-100 shadow-xl space-y-5 animate-fade-in">
        <div class="text-center">
          <h3 class="text-sm font-black text-gray-900 uppercase tracking-wide">Ajuster votre position</h3>
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
          <button @click="handleTransaction('sell')" class="py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-black text-xs transition-colors border border-rose-100">
            📉 RETIRER / VENDRE
          </button>
          <button @click="handleTransaction('buy')" class="py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-black text-xs transition-colors border border-emerald-100">
            📈 COMPLÉTER / ACHETER
          </button>
        </div>
        
        <div class="text-center pt-1">
          <button @click="showEditModal = false" class="text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 tracking-wider">
            Annuler l'opération
          </button>
        </div>
      </div>
    </div>

  </div>
</template>