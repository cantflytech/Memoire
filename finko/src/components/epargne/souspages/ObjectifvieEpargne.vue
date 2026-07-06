<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../../../firebase/config'; // Ajuste le chemin selon ton projet
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { 
  ArrowLeft, 
  Target, 
  Calendar, 
  Hourglass, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRightLeft, 
  Info 
} from 'lucide-vue-next';

const router = useRouter();
const userProjects = ref([]);
const userAssets = ref([]);
const allProducts = ref([]);
const loading = ref(true);

onMounted(async () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // 1. Récupérer le profil financier de l'utilisateur (Placements + Projets)
      const profileRef = doc(db, "user_financial_profile", user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const profileData = profileSnap.data().user_financial_profile || profileSnap.data();
        userProjects.value = profileData.life_projects || [];
        userAssets.value = profileData.assets || [];
      }

      // 2. Récupérer le catalogue de tous les produits d'épargne pour connaître la disponibilité (Instant / Bloqué)
      const productsSnapshot = await getDocs(collection(db, "savings_products"));
      allProducts.value = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (e) {
      console.error("Erreur de chargement des détails des projets :", e);
    } finally {
      loading.value = false;
    }
  });
});

// --- LOGIQUE FINANCIÈRE DE CALCUL DES PROJETS ---

// Calcul du patrimoine total disponible dans les livrets
const totalAvailableSavings = computed(() => {
  return userAssets.value.reduce((sum, asset) => sum + (asset.amount || 0), 0);
});

// Algorithme de calcul d'avancement et plan de retrait
const processedProjects = computed(() => {
  let simulatedSavingsLeft = totalAvailableSavings.value;

  return userProjects.value.map(project => {
    const target = project.target_amount || 0;
    
    // Calcul du montant alloué dynamiquement par rapport à l'épargne globale
    const allocatedAmount = Math.min(simulatedSavingsLeft, target);
    simulatedSavingsLeft -= allocatedAmount;

    // Pourcentage d'avancement
    const progressPercentage = target > 0 ? Math.min(Math.round((allocatedAmount / target) * 100), 100) : 0;

    // Calcul du temps restant avant la deadline (Format YYYY-MM)
    let monthsRemaining = null;
    let deadlineText = "Date non définie";
    
    if (project.deadline) {
      const [year, month] = project.deadline.split('-');
      const deadlineDate = new Date(year, month - 1, 1);
      const today = new Date();
      
      monthsRemaining = (deadlineDate.getFullYear() - today.getFullYear()) * 12 + (deadlineDate.getMonth() - today.getMonth());
      deadlineText = deadlineDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }

    // --- ALGORITHME DE PLAN DE RETRAIT INTELLIGENT ---
    // Il analyse où est ton argent pour te dire d'où le retirer le moment venu
    const withdrawalPlan = [];
    let requiredFromAssets = target;

    // On trie les livrets possédés : instantanés d'abord, bloqués à la fin
    const sortedUserAssets = [...userAssets.value].map(asset => {
      const prodInfo = allProducts.value.find(p => p.id === asset.product_id) || {};
      return { ...asset, ...prodInfo };
    }).sort((a, b) => (a.lock_duration_months || 0) - (b.lock_duration_months || 0));

    sortedUserAssets.forEach(asset => {
      if (requiredFromAssets <= 0 || asset.amount <= 0) return;

      const takeAmount = Math.min(requiredFromAssets, asset.amount);
      withdrawalPlan.push({
        assetName: asset.name,
        amountToTake: takeAmount,
        isInstant: asset.lock_duration_months === 0
      });
      requiredFromAssets -= takeAmount;
    });

    return {
      ...project,
      allocatedAmount,
      progressPercentage,
      monthsRemaining,
      deadlineText,
      withdrawalPlan,
      isFullyFunded: allocatedAmount >= target,
      missingAmount: target - allocatedAmount
    };
  });
});
</script>

<template>
  <main class="min-h-screen bg-[#F8FAFC] p-6 font-['Inter'] heading">
    <div class="max-w-4xl mx-auto space-y-8">
      
      <header class="flex items-center gap-4 border-b border-gray-100 pb-5">
        <button 
          @click="router.back()" 
          class="p-2 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-[#00AA90] hover:border-[#00AA90] transition-all"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-3">
          <div class="bg-[#E6F6F4] p-2.5 rounded-xl text-[#00AA90]">
            <Target class="w-6 h-6" />
          </div>
          <div>
            <h1 class="text-xl font-black text-gray-900 tracking-tight">Suivi de mes objectifs de vie</h1>
            <p class="text-xs text-gray-400 font-semibold">Analyse d'avancement, échéances et plans de retrait de vos projets</p>
          </div>
        </div>
      </header>

      <div v-if="loading" class="flex justify-center items-center py-20">
        <svg class="animate-spin h-6 w-6 text-[#00AA90]" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div v-else-if="processedProjects.length > 0" class="space-y-6">
        
        <div 
          v-for="(project, index) in processedProjects" 
          :key="index"
          class="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-6 transition-all"
        >
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div class="flex items-center gap-4">
              <span class="text-3xl p-3 bg-[#E6F6F4] rounded-2xl flex items-center justify-center shadow-xs">
                {{ project.icon }}
              </span>
              <div>
                <h2 class="text-lg font-black text-gray-900 capitalize tracking-tight">{{ project.name }}</h2>
                <p class="text-xs text-gray-400 font-semibold flex items-center gap-1.5 mt-0.5">
                  <Calendar class="w-3.5 h-3.5" /> Prévu pour : <span class="text-gray-700 font-bold">{{ project.deadlineText }}</span>
                </p>
              </div>
            </div>

            <div class="self-start sm:self-center">
              <span 
                v-if="project.monthsRemaining !== null && project.monthsRemaining > 0"
                class="bg-amber-50 text-amber-700 text-[10px] font-black px-3 py-1.5 rounded-full border border-amber-100 uppercase tracking-wider flex items-center gap-1"
              >
                <Hourglass class="w-3 h-3" /> Dans {{ project.monthsRemaining }} mois
              </span>
              <span 
                v-else-if="project.monthsRemaining !== null && project.monthsRemaining <= 0"
                class="bg-red-50 text-red-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-red-100 uppercase tracking-wider flex items-center gap-1"
              >
                <AlertTriangle class="w-3 h-3" /> Échéance atteinte
              </span>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-baseline">
              <span class="text-2xl font-black text-gray-900">
                {{ project.allocatedAmount.toLocaleString() }} €
                <span class="text-xs font-bold text-gray-400"> sécurisés / {{ project.target_amount.toLocaleString() }} €</span>
              </span>
              <span 
                :class="project.isFullyFunded ? 'text-teal-600 bg-teal-50 border-teal-100' : 'text-orange-600 bg-orange-50 border-orange-100'"
                class="text-xs font-black px-3 py-1 rounded-xl border"
              >
                {{ project.progressPercentage }}% financé
              </span>
            </div>

            <div class="w-full bg-gray-100 h-3 rounded-full overflow-hidden relative">
              <div 
                :class="project.isFullyFunded ? 'bg-[#00AA90]' : 'bg-orange-400'"
                class="h-full rounded-full transition-all duration-500"
                :style="{ width: `${project.progressPercentage}%` }"
              />
            </div>
          </div>

          <div class="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 space-y-3">
            <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRightLeft class="w-3.5 h-3.5 text-[#00AA90]" />
              Plan de financement & retrait recommandé :
            </h3>

            <div v-if="project.isFullyFunded" class="space-y-2">
              <p class="text-[11px] text-gray-500 font-medium leading-relaxed">
                🎯 Ton épargne couvre entièrement ce projet ! Le jour J, voici l'ordre de retrait idéal pour ne pas bloquer ton argent :
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div 
                  v-for="(step, idx) in project.withdrawalPlan" 
                  :key="idx"
                  class="bg-white px-3 py-2.5 rounded-xl border border-gray-100 flex justify-between items-center text-xs"
                >
                  <div class="space-y-0.5">
                    <div class="font-bold text-gray-800">{{ step.assetName }}</div>
                    <span class="text-[9px] font-bold uppercase" :class="step.isInstant ? 'text-teal-600' : 'text-blue-500'">
                      {{ step.isInstant ? 'Retrait libre' : 'Compte Bloqué' }}
                    </span>
                  </div>
                  <span class="font-black text-gray-900">- {{ step.amountToTake.toLocaleString() }} €</span>
                </div>
              </div>
            </div>

            <div v-else class="space-y-2">
              <div class="text-[11px] text-gray-500 font-medium flex gap-2 items-start bg-orange-50/30 p-2.5 border border-orange-100 rounded-xl">
                <Info class="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <span>
                  Il te manque encore <strong class="text-gray-900">{{ project.missingAmount.toLocaleString() }} €</strong> pour boucler ce projet. En prenant en compte toute ton épargne disponible actuelle, voici d'où proviendront tes fonds :
                </span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 opacity-75">
                <div 
                  v-for="(step, idx) in project.withdrawalPlan" 
                  :key="idx"
                  class="bg-white px-3 py-2.5 rounded-xl border border-gray-100 flex justify-between items-center text-xs"
                >
                  <div>
                    <div class="font-bold text-gray-800">{{ step.assetName }}</div>
                    <span class="text-[9px] font-bold text-teal-600 uppercase">Sécurisé</span>
                  </div>
                  <span class="font-black text-gray-900">{{ step.amountToTake.toLocaleString() }} €</span>
                </div>
                <div class="bg-dashed border-2 border-dashed border-gray-200 px-3 py-2.5 rounded-xl flex justify-between items-center text-xs">
                  <span class="font-bold text-gray-400 italic">À capitaliser encore</span>
                  <span class="font-black text-orange-500">+ {{ project.missingAmount.toLocaleString() }} €</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      <div v-else class="text-center py-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
        <Target class="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 class="text-base font-black text-gray-800">Aucun projet de vie enregistré</h3>
        <p class="text-xs font-semibold text-gray-400 max-w-sm mx-auto leading-relaxed mt-1">
          Vous n'avez pas encore configuré d'objectifs de vie. Cliquez sur le bouton ci-dessous pour créer votre premier projet !
        </p>
      </div>

    </div>
  </main>
</template>