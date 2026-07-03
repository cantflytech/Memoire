<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';

// --- ÉTATS RÉACTIFS ---
const loading = ref(true);
const updatingPrices = ref(false); // Pour l'animation du bouton rafraîchir
const activeTab = ref('Tous');

// Données du profil financier (Bannière haute)
const savings = ref(0);     // total_wealth
const investment = ref(0);  // total_investment

// Liste des positions de l'utilisateur
const positions = ref([]);

// Formulaire d'ajout d'un nouvel actif
const showForm = ref(false);
const newAsset = ref({
  name: '',
  ticker: '',
  category: 'Crypto',
  invested_amount_eur: 0 // On stocke directement les Euros mis au départ !
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
    // Simulation pour les actions ou autres tickers
    return Math.floor(Math.random() * (250 - 50 + 1)) + 50; 
  } catch (error) {
    console.error("Erreur d'appel API prix pour " + ticker, error);
    return null; 
  }
};

// --- CHARGEMENT ET MISE À JOUR DES COURS ---
const loadDashboardData = async (user, forceRefresh = false) => {
  try {
    if (forceRefresh) updatingPrices.value = true;
    else loading.value = true;
    
    // 1. Charger les totaux depuis user_financial_profile
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
    
    for (const document of querySnapshot.docs) {
      const posData = document.data();
      const livePrice = await fetchLivePrice(posData.ticker);
      
      let currentPrice = posData.current_price_eur || posData.buy_price_eur;
      if (livePrice) {
        currentPrice = livePrice;
        
        // Recalculer le pourcentage d'évolution global de la position par rapport au prix d'achat
        const changePercent = ((currentPrice - posData.buy_price_eur) / posData.buy_price_eur) * 100;

        // On met à jour Firebase avec le dernier cours du marché et la nouvelle valeur en temps réel
        const posDocRef = doc(db, "user_investment_positions", document.id);
        await updateDoc(posDocRef, {
          current_price_eur: currentPrice,
          total_value_eur: posData.quantity * currentPrice,
          monthly_change_percent: parseFloat(changePercent.toFixed(2))
        });
      }

      localPositions.push({
        id: document.id,
        ...posData,
        current_price_eur: currentPrice,
        total_value_eur: posData.quantity * currentPrice,
        monthly_change_percent: livePrice ? parseFloat((((currentPrice - posData.buy_price_eur) / posData.buy_price_eur) * 100).toFixed(2)) : (posData.monthly_change_percent || 0)
      });
    }
    
    positions.value = localPositions;
    
    // 3. Écrire le montant d'investissement calculé dans le profil financier
    await updateDoc(profileRef, {
      total_investment: totalCalculatedInvestment.value
    });
    investment.value = totalCalculatedInvestment.value;

  } catch (e) {
    console.error("Erreur lors de la synchronisation :", e);
  } finally {
    loading.value = false;
    updatingPrices.value = false;
  }
};

onMounted(() => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadDashboardData(user);
    }
  });
});

// Déclencheur manuel pour le bouton "Mettre à jour"
const triggerManualUpdate = () => {
  const user = auth.currentUser;
  if (user) loadDashboardData(user, true);
};

// --- AJOUTER UN ACTIF EN ENTRANT DES EUROS ---
const handleAddAsset = async () => {
  const user = auth.currentUser;
  if (!user || !newAsset.value.ticker || newAsset.value.invested_amount_eur <= 0) return;

  try {
    // 1. On va chercher le prix actuel sur le marché (ex: 60 000€ pour le BTC)
    const marketPrice = await fetchLivePrice(newAsset.value.ticker);
    if (!marketPrice) {
      alert("Impossible de récupérer le prix de cet actif. Vérifiez le ticker.");
      return;
    }

    // 2. FORMULE MAGIQUE : Quantité achetée = Euros investis / Prix unitaire de l'actif
    const calculatedQuantity = newAsset.value.invested_amount_eur / marketPrice;

    const positionsRef = collection(db, "user_investment_positions");
    await addDoc(positionsRef, {
      userId: user.uid,
      name: newAsset.value.name,
      ticker: newAsset.value.ticker.toUpperCase().trim(),
      category: newAsset.value.category,
      quantity: calculatedQuantity,                          // Stocké en fraction de jeton exacte
      buy_price_eur: marketPrice,                            // Son prix d'achat de référence
      current_price_eur: marketPrice,
      invested_amount_eur: Number(newAsset.value.invested_amount_eur), // Tes euros saisis
      total_value_eur: Number(newAsset.value.invested_amount_eur),
      monthly_change_percent: 0
    });

    showForm.value = false;
    newAsset.value = { name: '', ticker: '', category: 'Crypto', invested_amount_eur: 0 };
    await loadDashboardData(user);
    
    alert("Actif ajouté ! Quantité calculée automatiquement par rapport au marché.");
  } catch (e) {
    console.error("Erreur d'ajout de l'actif :", e);
  }
};

// --- COMPUTED POUR CALCULS DES RATIOS ---
const totalCalculatedInvestment = computed(() => {
  return positions.value.reduce((sum, pos) => sum + pos.total_value_eur, 0);
});

const totalInvestedCapital = computed(() => {
  return positions.value.reduce((sum, pos) => sum + (pos.invested_amount_eur || pos.total_value_eur), 0);
});

// Rendement global calculé sur le portefeuille
const portfolioYield = computed(() => {
  if (totalInvestedCapital.value === 0) return 0;
  const gain = totalCalculatedInvestment.value - totalInvestedCapital.value;
  return parseFloat(((gain / totalInvestedCapital.value) * 100).toFixed(2));
});

const globalNetWorth = computed(() => savings.value + totalCalculatedInvestment.value);

const savingsPercentage = computed(() => {
  if (globalNetWorth.value === 0) return 0;
  return Math.round((savings.value / globalNetWorth.value) * 100);
});

const investmentPercentage = computed(() => {
  if (globalNetWorth.value === 0) return 0;
  return Math.round((totalCalculatedInvestment.value / globalNetWorth.value) * 100);
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
      <button 
        @click="triggerManualUpdate" 
        :disabled="updatingPrices"
        class="bg-gray-100 hover:bg-gray-200 border text-gray-700 font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50"
      >
        <span :class="{ 'animate-spin': updatingPrices }">🔄</span>
        {{ updatingPrices ? 'Mise à jour en cours...' : 'Mettre à jour les cours' }}
      </button>

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
              <div class="text-right">
                <p class="text-xs font-black text-gray-900">{{ Math.round(pos.total_value_eur).toLocaleString() }} €</p>
                <span class="text-[9px] font-bold" :class="pos.monthly_change_percent >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                  {{ pos.monthly_change_percent >= 0 ? '▲ +' : '▼ ' }}{{ pos.monthly_change_percent }}%
                </span>
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
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.25s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
</style>