<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db, auth } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  X, 
  Activity, 
  PieChart, 
  DollarSign, 
  RefreshCw 
} from 'lucide-vue-next';

// --- ÉTATS RÉACTIFS ---
const loading = ref(true);
const updatingPrices = ref(false); 
const activeTab = ref('Tous');
const currentUser = ref(null);
const router = useRouter();

// Auto-Refresh (15 minutes)
const refreshIntervalInstance = ref(null);
const nextAutoUpdateTime = ref(900);

// États des modales
const showForm = ref(false); // Gère le Pop-up d'ajout d'actif
const showEditModal = ref(false);
const selectedPosition = ref(null);
const transactionAmountEur = ref(0);

// Données du profil financier
const savings = ref(0);     
const investment = ref(0);  
const positions = ref([]);

// Formulaire nouvel actif
const newAsset = ref({
  name: '',
  ticker: '',
  category: 'Crypto',
  invested_amount_eur: 0 
});

const selectedPresetTicker = ref('');
const presetAssets = {
  Crypto: [
    { name: 'Bitcoin', ticker: 'BTC' },
    { name: 'Ethereum', ticker: 'ETH' },
    { name: 'Solana', ticker: 'SOL' },
    { name: 'BNB', ticker: 'BNB' },
    { name: 'XRP', ticker: 'XRP' }
  ],
  ETF: [
    { name: 'Amundi MSCI World (CW8)', ticker: 'CW8' },
    { name: 'Amundi MSCI World UCITS ETF (EWLD)', ticker: 'EWLD' },
    { name: 'iShares Core S&P 500 UCITS ETF (CSPX)', ticker: 'CSPX' },
    { name: 'Lyxor PEA Nasdaq-100 UCITS ETF (PUST)', ticker: 'PUST' },
    { name: 'Vanguard FTSE All-World UCITS ETF (VWCE)', ticker: 'VWCE' }
  ]
};

const isNonMarketPricedCategory = computed(() => {
  return ['Immobilier', 'ETF'].includes(newAsset.value.category);
});

const shouldShowPresets = computed(() => {
  return ['Crypto', 'ETF'].includes(newAsset.value.category);
});

const currentPresetOptions = computed(() => {
  return presetAssets[newAsset.value.category] || [];
});

const broadcastPortfolioUpdate = () => {
  window.dispatchEvent(new CustomEvent('investment-updated'));
};

const openPortfolioSimulation = () => {
  router.push({ name: 'portfolio-simulation' });
};

const refreshFromExternalUpdate = () => {
  if (currentUser.value) loadDashboardData(currentUser.value);
};

const logActivity = async (userId, type, assetName, ticker, amount) => {
  try {
    const activityRef = collection(db, 'user_financial_profile', userId, 'activities');
    await addDoc(activityRef, {
      type,
      assetName,
      ticker: (ticker || 'N/A').toUpperCase(),
      amount: Number(amount),
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error("Erreur lors du log de l'activité :", e);
  }
};

// --- API LIVE PRICES (BINANCE) ---
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
    // On refuse les tickers inconnus pour éviter les montants incohérents.
    return null;
  } catch (error) {
    console.error("Erreur d'appel API prix pour " + ticker, error);
    return null; 
  }
};

// --- CHARGEMENT ET SYNCHRONISATION (FIRESTORE) ---
const loadDashboardData = async (user, forceRefresh = false) => {
  try {
    if (forceRefresh) updatingPrices.value = true;
    else loading.value = true;
    
    // 1. Récupérer l'épargne de sécurité
    const profileRef = doc(db, "user_financial_profile", user.uid);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const data = profileSnap.data().user_financial_profile || profileSnap.data();
      savings.value = data.total_wealth || 0;
    }

    // 2. Récupérer les lignes d'investissements
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
    
    // 3. Sauvegarder la valorisation globale du portefeuille
    await updateDoc(profileRef, {
      total_investment: calculatedTotal
    });
    investment.value = calculatedTotal;
    nextAutoUpdateTime.value = 900;
  } catch (e) {
    console.error("Erreur lors de la synchronisation :", e);
  } finally {
    loading.value = false;
    updatingPrices.value = false;
  }
};

const handleAddAsset = async () => {
  const user = auth.currentUser;
  if (!user || !newAsset.value.name || newAsset.value.invested_amount_eur <= 0) return;
  if (!isNonMarketPricedCategory.value && !newAsset.value.ticker) return;

  try {
    const isStaticPriced = isNonMarketPricedCategory.value;
    const normalizedTicker = isStaticPriced
      ? (newAsset.value.category === 'Immobilier' ? 'IMMO' : newAsset.value.ticker.toUpperCase().trim())
      : newAsset.value.ticker.toUpperCase().trim();

    let marketPrice = Number(newAsset.value.invested_amount_eur);
    let calculatedQuantity = 1;

    if (!isStaticPriced) {
      marketPrice = await fetchLivePrice(newAsset.value.ticker);
      if (!marketPrice) {
        alert("Impossible de récupérer le prix du marché.");
        return;
      }
      calculatedQuantity = newAsset.value.invested_amount_eur / marketPrice;
    }

    const positionsRef = collection(db, "user_investment_positions");
    
    await addDoc(positionsRef, {
      userId: user.uid,
      name: newAsset.value.name,
      ticker: normalizedTicker,
      category: newAsset.value.category,
      quantity: calculatedQuantity,                          
      buy_price_eur: marketPrice,                            
      current_price_eur: marketPrice,
      invested_amount_eur: Number(newAsset.value.invested_amount_eur), 
      total_value_eur: Number(newAsset.value.invested_amount_eur),
      monthly_change_percent: 0
    });

    await logActivity(user.uid, 'initial', newAsset.value.name, normalizedTicker, newAsset.value.invested_amount_eur);

    showForm.value = false;
    newAsset.value = { name: '', ticker: '', category: 'Crypto', invested_amount_eur: 0 };
    selectedPresetTicker.value = '';
    await loadDashboardData(user);
    broadcastPortfolioUpdate();
    alert("Placement enregistré avec succès !");
  } catch (e) {
    console.error("Erreur d'ajout de l'actif :", e);
  }
};

const triggerManualUpdate = () => {
  const user = auth.currentUser;
  if (user) loadDashboardData(user, true);
};

// --- CALCULS ET PROPRIÉTÉS FINANCIÈRES ---
const totalCalculatedInvestment = computed(() => {
  return positions.value.reduce((sum, pos) => sum + pos.total_value_eur, 0);
});

const totalInvestedCapital = computed(() => {
  return positions.value.reduce((sum, pos) => sum + (pos.invested_amount_eur || pos.total_value_eur), 0);
});

// VRAI RENDEMENT DU PORTEFEUILLE COMPLET
const portfolioYield = computed(() => {
  if (totalInvestedCapital.value === 0) return 0;
  const gain = totalCalculatedInvestment.value - totalInvestedCapital.value;
  return parseFloat(((gain / totalInvestedCapital.value) * 100).toFixed(2));
});

// VRAIE VOLATILITÉ CALCULÉE (Écart-type pondéré des performances des actifs actifs)
const portfolioVolatility = computed(() => {
  if (positions.value.length === 0 || totalCalculatedInvestment.value === 0) return 0;
  const meanYield = portfolioYield.value;
  
  const varianceSum = positions.value.reduce((sum, pos) => {
    const assetYield = pos.invested_amount_eur > 0 
      ? ((pos.total_value_eur - pos.invested_amount_eur) / pos.invested_amount_eur) * 100 
      : pos.monthly_change_percent;
    const weight = pos.total_value_eur / totalCalculatedInvestment.value;
    return sum + weight * Math.pow(assetYield - meanYield, 2);
  }, 0);

  const deviation = Math.sqrt(varianceSum);
  return parseFloat(Math.min(Math.max(deviation, 1.2), 28.5).toFixed(2)); // Normalisé sur les échelles Crypto/Immo
});

const categoryTotals = computed(() => {
  const totals = { Crypto: 0, ETF: 0, Obligation: 0, Immobilier: 0 };
  positions.value.forEach(p => {
    if (totals[p.category] !== undefined) totals[p.category] += p.total_value_eur;
  });
  return totals;
});

const allocationRingStyle = computed(() => {
  const total = totalCalculatedInvestment.value;
  if (total <= 0) {
    return {
      background: 'conic-gradient(#E5E7EB 0deg 360deg)'
    };
  }

  const cryptoPct = (categoryTotals.value.Crypto / total) * 360;
  const etfPct = (categoryTotals.value.ETF / total) * 360;
  const obligationPct = (categoryTotals.value.Obligation / total) * 360;
  const immoPct = (categoryTotals.value.Immobilier / total) * 360;

  const cryptoEnd = cryptoPct;
  const etfEnd = cryptoEnd + etfPct;
  const obligationEnd = etfEnd + obligationPct;
  const immoEnd = obligationEnd + immoPct;

  return {
    background: `conic-gradient(
      #6366F1 0deg ${cryptoEnd}deg,
      #F59E0B ${cryptoEnd}deg ${etfEnd}deg,
      #00AA90 ${etfEnd}deg ${obligationEnd}deg,
      #F43F5E ${obligationEnd}deg ${immoEnd}deg,
      #E5E7EB ${immoEnd}deg 360deg
    )`
  };
});

const applyPresetAsset = () => {
  const selected = currentPresetOptions.value.find((item) => item.ticker === selectedPresetTicker.value);
  if (!selected) return;
  newAsset.value.name = selected.name;
  newAsset.value.ticker = selected.ticker;
};

watch(
  () => newAsset.value.category,
  (category) => {
    selectedPresetTicker.value = '';
    if (category === 'Immobilier') {
      newAsset.value.ticker = 'IMMO';
      if (!newAsset.value.name) newAsset.value.name = 'Immobilier';
      return;
    }
    if (newAsset.value.ticker === 'IMMO') newAsset.value.ticker = '';
    if (newAsset.value.name === 'Immobilier') newAsset.value.name = '';
  }
);

// --- TIMERS ---
onMounted(() => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser.value = user;
      loadDashboardData(user);
      setInterval(() => {
        if (nextAutoUpdateTime.value > 0) nextAutoUpdateTime.value--;
      }, 1000);
      refreshIntervalInstance.value = setInterval(() => {
        loadDashboardData(user, true);
      }, 15 * 60 * 1000);
    }
  });
  window.addEventListener('investment-updated', refreshFromExternalUpdate);
});

onUnmounted(() => {
  if (refreshIntervalInstance.value) clearInterval(refreshIntervalInstance.value);
  window.removeEventListener('investment-updated', refreshFromExternalUpdate);
});
</script>

<template>
  <main class="bg-[#F8FAFC] heading flex items-center justify-center p-6 font-['Inter']">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full max-w-7xl">
      
      <div class="lg:col-span-2 space-y-4 flex flex-col justify-between">
        
        <div class="flex justify-between items-center bg-white border border-gray-100 rounded-[24px] p-4 shadow-sm">
          <div class="flex items-center gap-3">
            <button 
              @click="triggerManualUpdate" 
              :disabled="updatingPrices"
              class="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw :class="{ 'animate-spin': updatingPrices }" class="w-3.5 h-3.5" />
              {{ updatingPrices ? 'Synchronisation...' : 'Mettre à jour les cours' }}
            </button>

            <span class="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-wider bg-gray-50 border border-gray-100 px-3 py-2.5 rounded-xl">
              ⏱️ ACTU DANS {{ Math.floor(nextAutoUpdateTime / 60) }}M {{ nextAutoUpdateTime % 60 }}S
            </span>
          </div>

          <button 
            @click="showForm = true" 
            class="bg-[#6366F1]  text-white py-2.5 px-4 rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle class="w-4 h-4" /> AJOUTER UN INVESTISSEMENT
          </button>
        </div>

        <div v-if="loading" class="h-44 bg-gray-100 animate-pulse rounded-[24px] w-full"></div>

        <div v-else class="grid grid-cols-2 gap-4 flex-grow">
          
          <div class="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm flex flex-col justify-between">
            <div>
              <span class="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1">Volatilité réelle</span>
              <div class="text-3xl font-black text-gray-900 flex items-center gap-1.5">
                <Activity class="w-6 h-6 text-orange-500" /> {{ portfolioVolatility }} %
              </div>
            </div>
            <p class="text-[11px] text-gray-400 font-medium mt-4">
              Niveau de risque calculé sur l'écart de dispersion de vos actifs.
            </p>
          </div>

          <div class="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm flex flex-col justify-between">
            <div>
              <span class="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1">Rendement global</span>
              <div :class="portfolioYield >= 0 ? 'text-[#00AA90]' : 'text-red-500'" class="text-3xl font-black flex items-center gap-1">
                <component :is="portfolioYield >= 0 ? TrendingUp : TrendingDown" class="w-7 h-7" />
                {{ portfolioYield >= 0 ? '+' : '' }}{{ portfolioYield }} %
              </div>
            </div>
            <p class="text-[11px] text-gray-400 font-medium mt-4">
              Performance totale par rapport au capital injecté ({{ totalInvestedCapital.toLocaleString() }} €).
            </p>
          </div>

          <div class="bg-[#FFF9E6] border border-[#FFE4A3] p-6 rounded-[24px] shadow-sm col-span-2 flex justify-between items-center">
            <div>
              <h4 class="text-sm font-black text-amber-900 uppercase tracking-wide">Créer une simulation de portefeuille</h4>
              <p class="text-xs text-amber-800/80 font-medium mt-0.5">Testez des allocations théoriques sans impacter votre capital.</p>
            </div>
            <button @click="openPortfolioSimulation" class="bg-[#F49F12] hover:bg-[#d98504] text-white font-black py-2.5 px-4 rounded-xl text-xs transition-all shadow-[0px_4px_0px_#C67E0A] active:translate-y-[2px] active:shadow-[0px_2px_0px_#C67E0A] cursor-pointer">
              🚀 Activer le Boost
            </button>
          </div>

        </div>
      </div>

      <div class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm h-full flex flex-col justify-between">
        <div>
          <h3 class="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-wider mb-6">
            <span class="p-1.5 bg-teal-50 text-[#00AA90] rounded-lg inline-flex items-center justify-center">
              <PieChart class="w-4 h-4" />
            </span>
            Allocation des Actifs
          </h3>
          
          <div class="flex justify-center relative py-4">
            <div class="w-44 h-44 rounded-full relative" :style="allocationRingStyle">
              <div class="absolute inset-[16px] bg-white rounded-full flex items-center justify-center">
                <div class="text-center flex flex-col">
                <span class="text-2xl font-black text-gray-900 tracking-tighter">
                  {{ totalCalculatedInvestment >= 1000 ? Math.round(totalCalculatedInvestment / 1000) + ' K' : Math.round(totalCalculatedInvestment) + ' €' }}
                </span>
                <span class="text-[9px] text-gray-400 font-black uppercase tracking-wider">Valorisation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4 text-xs pt-4 border-t border-gray-50">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-indigo-500"></div>
              <span class="text-gray-700 font-bold">Crypto-actifs</span>
            </div>
            <span class="text-gray-900 font-black">{{ Math.round(categoryTotals.Crypto).toLocaleString() }} €</span>
          </div>
          
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-[#00AA90]"></div>
              <span class="text-gray-700 font-bold">Obligations & Livrets</span>
            </div>
            <span class="text-gray-900 font-black">{{ Math.round(categoryTotals.Obligation).toLocaleString() }} €</span>
          </div>

          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-amber-500"></div>
              <span class="text-gray-700 font-bold">ETF</span>
            </div>
            <span class="text-gray-900 font-black">{{ Math.round(categoryTotals.ETF).toLocaleString() }} €</span>
          </div>

          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-rose-500"></div>
              <span class="text-gray-700 font-bold">Immobilier (SCPI/Direct)</span>
            </div>
            <span class="text-gray-900 font-black">{{ Math.round(categoryTotals.Immobilier).toLocaleString() }} €</span>
          </div>
        </div>
      </div>

    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div class="bg-white rounded-[2rem] max-w-md w-full p-6 shadow-2xl relative border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        <button @click="showForm = false" class="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
          <X class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-teal-50 text-[#00AA90] rounded-xl flex items-center justify-center">
            <DollarSign class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-black text-gray-900">Ajouter un placement</h3>
            <p class="text-xs text-gray-400 font-medium">Renseignez le montant investi sur le marché</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Nom de l'actif</label>
              <input v-model="newAsset.name" type="text" placeholder="Ex: Bitcoin" class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-800 outline-none focus:bg-white focus:border-[#6366F1]" />
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Ticker de marché</label>
              <input
                v-model="newAsset.ticker"
                type="text"
                :disabled="newAsset.category === 'Immobilier'"
                :placeholder="newAsset.category === 'Immobilier' ? 'Non requis pour l\'immobilier' : 'Ex: BTC'"
                class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-800 outline-none focus:bg-white focus:border-[#6366F1] disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Catégorie d'allocation</label>
            <select v-model="newAsset.category" class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-800 outline-none bg-white focus:border-[#6366F1]">
              <option value="Crypto">Crypto</option>
              <option value="ETF">ETF</option>
              <option value="Obligation">Obligation</option>
              <option value="Immobilier">Immobilier</option>
            </select>
          </div>

          <div v-if="shouldShowPresets">
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Liste préconstruite {{ newAsset.category }}</label>
            <select
              v-model="selectedPresetTicker"
              @change="applyPresetAsset"
              class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-800 outline-none bg-white focus:border-[#6366F1]"
            >
              <option value="">Sélectionner un actif</option>
              <option v-for="asset in currentPresetOptions" :key="asset.ticker" :value="asset.ticker">
                {{ asset.name }} - {{ asset.ticker }}
              </option>
            </select>
          </div>

          <p v-if="isNonMarketPricedCategory" class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {{ newAsset.category === 'Immobilier' ? "Immobilier : aucun ticker requis." : "ETF : valorisé sur le montant saisi à l'ajout." }}
          </p>

          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Montant placé en Euros (€)</label>
            <input v-model.number="newAsset.invested_amount_eur" type="number" required class="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-sm text-gray-900 outline-none focus:bg-white focus:border-[#6366F1]" placeholder="Ex: 1000" />
          </div>

          <div class="pt-2 flex gap-3">
            <button type="button" @click="showForm = false" class="w-1/2 px-4 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold text-xs hover:bg-gray-100 transition-colors cursor-pointer">Annuler</button>
            <button type="button" @click="handleAddAsset" class="w-1/2 px-4 py-3 bg-[#6366F1] text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer">
              Enregistrer le placement
            </button>
          </div>
        </div>

      </div>
    </div>

  </main>
</template>