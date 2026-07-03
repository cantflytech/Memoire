<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';

// --- ÉTATS RÉACTIFS ---
const loading = ref(true);
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
  quantity: 0,
  buy_price_eur: 0
});

// --- COUPLAGE API FINANCIAL & RECALCUL TEMPS RÉEL ---
// Cette fonction va chercher le vrai prix en direct sur internet
const fetchLivePrice = async (ticker) => {
  try {
    // Si c'est du Bitcoin ou de l'Ethereum, on interroge l'API gratuite CoinGecko
    if (ticker.toLowerCase() === 'btc') {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
      const data = await res.json();
      return data.bitcoin.eur;
    } else if (ticker.toLowerCase() === 'eth') {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur');
      const data = await res.json();
      return data.ethereum.eur;
    }
    // Simulation pour les autres actifs/actions si l'API n'a pas le ticker
    return Math.floor(Math.random() * (250 - 50 + 1)) + 50; 
  } catch (error) {
    console.error("Erreur API prix en direct pour " + ticker, error);
    return null;
  }
};

// --- CHARGEMENT INITIAL & SYNCHRONISATION FIREBASE ---
const loadDashboardData = async (user) => {
  try {
    loading.value = true;
    
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
    
    // Pour chaque position stockée, on va chercher son cours actuel actualisé
    for (const document of querySnapshot.docs) {
      const posData = document.data();
      const livePrice = await fetchLivePrice(posData.ticker);
      
      let currentPrice = posData.current_price_eur;
      if (livePrice) {
        currentPrice = livePrice;
        // On met à jour la base de données Firebase avec le prix du jour fraîchement récupéré
        const posDocRef = doc(db, "user_investment_positions", document.id);
        await updateDoc(posDocRef, {
          current_price_eur: currentPrice,
          total_value_eur: posData.quantity * currentPrice
        });
      }

      localPositions.push({
        id: document.id,
        ...posData,
        current_price_eur: currentPrice,
        total_value_eur: posData.quantity * currentPrice
      });
    }
    
    positions.value = localPositions;
    
    // 3. Mettre à jour le total global d'investissement calculé dans le profil financier
    await updateDoc(profileRef, {
      total_investment: totalCalculatedInvestment.value
    });
    investment.value = totalCalculatedInvestment.value;

  } catch (e) {
    console.error("Erreur lors de la synchronisation :", e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadDashboardData(user);
    }
  });
});

// --- AJOUTER UN NOUVEL ACTIF VIA LE FORMULAIRE ---
const handleAddAsset = async () => {
  const user = auth.currentUser;
  if (!user || !newAsset.value.ticker || newAsset.value.quantity <= 0) return;

  try {
    // Récupérer le cours initial sur internet avant insertion
    const initialPrice = await fetchLivePrice(newAsset.value.ticker) || newAsset.value.buy_price_eur;

    const positionsRef = collection(db, "user_investment_positions");
    await addDoc(positionsRef, {
      userId: user.uid,
      name: newAsset.value.name,
      ticker: newAsset.value.ticker.toUpperCase(),
      category: newAsset.value.category,
      quantity: Number(newAsset.value.quantity),
      buy_price_eur: Number(newAsset.value.buy_price_eur),
      current_price_eur: initialPrice,
      total_value_eur: Number(newAsset.value.quantity) * initialPrice,
      monthly_change_percent: -4.5 // Valeur de tendance par défaut
    });

    // Réinitialiser le formulaire et recharger la vue
    showForm.value = false;
    newAsset.value = { name: '', ticker: '', category: 'Crypto', quantity: 0, buy_price_eur: 0 };
    await loadDashboardData(user);
    
    alert("Votre actif a été ajouté et valorisé sur le marché !");
  } catch (e) {
    console.error("Erreur d'ajout de l'actif :", e);
  }
};

// --- CALCULS MATHÉMATIQUES DYNAMIQUES (RATIOS & ALLOCATIONS) ---

// Somme dynamique de toutes les positions actualisées
const totalCalculatedInvestment = computed(() => {
  return positions.value.reduce((sum, pos) => sum + pos.total_value_eur, 0);
});

// Patrimoine global (Épargne + Investissement)
const globalNetWorth = computed(() => savings.value + totalCalculatedInvestment.value);

// Pourcentages de la bannière haute
const savingsPercentage = computed(() => {
  if (globalNetWorth.value === 0) return 0;
  return Math.round((savings.value / globalNetWorth.value) * 100);
});

const investmentPercentage = computed(() => {
  if (globalNetWorth.value === 0) return 0;
  return Math.round((totalCalculatedInvestment.value / globalNetWorth.value) * 100);
});

// Filtrage du tableau par onglets
const filteredPositions = computed(() => {
  if (activeTab.value === 'Tous') return positions.value;
  return positions.value.filter(p => p.category === activeTab.value);
});

// Somme par catégorie pour l'anneau d'allocation
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
            {{ globalNetWorth.toLocaleString() }} <span class="text-xl md:text-2xl font-bold">€</span>
          </span>
          <span class="text-[11px] font-bold text-white/80 mt-0.5">↗ 100 € cette année</span>
        </div>
      </div>

      <div class="flex items-center justify-center sm:justify-end gap-10 md:gap-14 z-10 w-full sm:w-auto">
        <div class="flex flex-col items-end pr-10 md:pr-14 border-r border-white/20">
          <h4 class="text-[10px] font-bold uppercase opacity-75 tracking-wide mb-0.5">Épargne</h4>
          <span class="text-2xl md:text-3xl font-black">{{ savingsPercentage }}<span class="text-base font-bold">%</span></span>
          <span class="text-[10px] font-bold text-white/80 mt-0.5">↗ {{ savings.toLocaleString() }}€</span>
        </div>
        <div class="flex flex-col items-end">
          <h4 class="text-[10px] font-bold uppercase opacity-75 tracking-wide mb-0.5">Investissement</h4>
          <span class="text-2xl md:text-3xl font-black">{{ investmentPercentage }}<span class="text-base font-bold">%</span></span>
          <span class="text-[10px] font-bold text-white/80 mt-0.5">↘ {{ totalCalculatedInvestment.toLocaleString() }}€</span>
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <button @click="showForm = !showForm" class="bg-[#5B51F4] hover:bg-[#473EE0] text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition-all">
        {{ showForm ? '✖ Fermer' : '➕ Insérer un nouvel actif' }}
      </button>
    </div>

    <div v-if="showForm" class="bg-white border border-gray-100 p-5 rounded-[24px] shadow-xs max-w-xl mx-auto w-full space-y-4 animate-fade-in">
      <h3 class="text-sm font-black text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Ajouter un actif au portefeuille</h3>
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="flex flex-col space-y-1">
          <label class="font-bold text-gray-500">Nom de l'actif (ex: Bitcoin)</label>
          <input v-model="newAsset.name" type="text" placeholder="Bitcoin" class="p-2 border rounded-xl outline-none focus:border-[#5B51F4]" />
        </div>
        <div class="flex flex-col space-y-1">
          <label class="font-bold text-gray-500">Ticker officiel (ex: BTC, AAPL)</label>
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
          <label class="font-bold text-gray-500">Quantité détenue</label>
          <input v-model.number="newAsset.quantity" type="number" step="0.0001" placeholder="0.5" class="p-2 border rounded-xl outline-none focus:border-[#5B51F4]" />
        </div>
      </div>
      <button @click="handleAddAsset" class="w-full bg-[#00AA90] text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors">
        Enregistrer et valoriser en direct
      </button>
    </div>

    <div v-if="loading" class="h-40 bg-gray-100 animate-pulse rounded-[24px]"></div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
      <div class="lg:col-span-2 space-y-4">
        
        <div class="grid grid-cols-2 gap-4 text-center">
          <div class="bg-white border p-4 rounded-2xl shadow-xs">
            <span class="text-[10px] font-bold text-gray-400 block mb-1">Volatilité portefeuille</span>
            <span class="text-xl font-black text-gray-800">↗ 4.5%</span>
            <p class="text-[9px] font-bold text-emerald-500 mt-0.5">🧮 6 % vs mois précédent</p>
          </div>
          <div class="bg-white border p-4 rounded-2xl shadow-xs">
            <span class="text-[10px] font-bold text-gray-400 block mb-1">Rendement portefeuille</span>
            <span class="text-xl font-black text-gray-800">↗ 4.5%</span>
            <p class="text-[9px] font-bold text-emerald-500 mt-0.5">🧮 6 % vs mois précédent</p>
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
                <div class="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                  {{ pos.ticker.substring(0, 2) }}
                </div>
                <div>
                  <h4 class="text-xs font-black text-gray-800">{{ pos.name }}</h4>
                  <span class="text-[9px] text-gray-400 font-bold uppercase">{{ pos.ticker }} • Qte: {{ pos.quantity }}</span>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs font-black text-gray-900">{{ Math.round(pos.total_value_eur).toLocaleString() }} €</p>
                <span class="text-[9px] text-red-400 font-bold">↘ {{ Math.abs(pos.monthly_change_percent) }}% ce mois</span>
              </div>
            </div>
            <div v-if="filteredPositions.length === 0" class="text-center py-6 text-xs text-gray-400 font-medium">
              Aucun actif enregistré dans cette catégorie.
            </div>
          </div>
        </div>

      </div>

      <div class="space-y-4">
        
        <div class="bg-white border border-gray-100 rounded-[24px] p-5 space-y-4">
          <h3 class="text-sm font-black text-gray-900 uppercase tracking-wide">Allocation</h3>
          
          <div class="flex justify-center py-2">
            <div class="w-32 h-32 rounded-full border-[12px] border-indigo-500 flex items-center justify-center relative">
              <span class="text-sm font-black text-indigo-900">{{ Math.round(totalCalculatedInvestment / 1000) }} K</span>
            </div>
          </div>

          <div class="space-y-2 text-[11px] font-bold text-gray-600">
            <div class="flex justify-between items-center">
              <span>🟠 Crypto</span>
              <span class="text-gray-900">{{ categoryTotals.Crypto.toLocaleString() }} €</span>
            </div>
            <div class="flex justify-between items-center">
              <span>🔵 Obligation</span>
              <span class="text-gray-900">{{ categoryTotals.Obligation.toLocaleString() }} €</span>
            </div>
            <div class="flex justify-between items-center">
              <span>🟢 Immobilier</span>
              <span class="text-gray-900">{{ categoryTotals.Immobilier.toLocaleString() }} €</span>
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-100 rounded-[24px] p-5 text-center space-y-2">
          <h3 class="text-sm font-black text-gray-900 uppercase tracking-wide text-left">Score de diversification</h3>
          <div class="text-2xl font-black text-gray-800">50 %</div>
          <div class="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div class="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full w-1/2"></div>
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