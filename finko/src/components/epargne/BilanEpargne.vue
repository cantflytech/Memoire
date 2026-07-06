<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { db, auth } from '../../firebase/config';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { PlusCircle, History, Calendar, ArrowRight, X, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet, ChevronDown, ChevronUp } from 'lucide-vue-next';

const router = useRouter();
const financialData = ref(null);
const loading = ref(true);

const editIncome = ref(0);
const editExpenses = ref(0);
const previousMonthData = ref(null);

// Historique brut de Firebase
const rawHistoryDocs = ref([]); 

// État pour savoir si l'historique est déplié ou non
const isHistoryExpanded = ref(false);

// États pour la modale d'ajout d'historique
const showHistoryModal = ref(false);
const historyForm = reactive({
  month: new Date().getMonth(), 
  year: new Date().getFullYear(),
  total_income: 0,
  total_expenses: 0
});

const monthsList = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const fetchData = () => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const docRef = doc(db, "user_financial_profile", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data().user_financial_profile || docSnap.data();
        financialData.value = data;
        editIncome.value = data.monthly_income;
        editExpenses.value = data.monthly_expenses;
      }

      await fetchPreviousMonth(user.uid);
    }
    loading.value = false;
  });
};

onMounted(() => {
  fetchData();
});
// --- MODIFICATION DES COMPUTED POUR RENDRE LES CARTES DYNAMIQUES ---

// 1. Revenu affiché sur la carte
const displayedIncome = computed(() => {
  // S'il y a un mois clôturé/saisi, on prend son revenu réel, sinon la valeur de l'inscription
  if (uniqueHistoryDocs.value.length > 0) {
    return uniqueHistoryDocs.value[0].total_income;
  }
  return financialData.value?.monthly_income || 0;
});

// 2. Dépense affichée sur la carte
const displayedExpenses = computed(() => {
  // S'il y a un mois clôturé/saisi, on prend ses dépenses réelles, sinon l'inscription
  if (uniqueHistoryDocs.value.length > 0) {
    return uniqueHistoryDocs.value[0].total_expenses;
  }
  return financialData.value?.monthly_expenses || 0;
});

// 3. Bilan épargne calculé en conséquence
const bilanEpargne = computed(() => {
  return displayedIncome.value - displayedExpenses.value;
});
const fetchPreviousMonth = async (userId) => {
  try {
    const statsRef = collection(db, "monthly_financial_stats");
    const q = query(
      statsRef,
      where("userId", "==", userId),
      orderBy("datetime", "desc") // Plus récent en premier
    );

    const querySnapshot = await getDocs(q);
    const docs = [];
    querySnapshot.forEach((doc) => {
      docs.push({ id: doc.id, ...doc.data() });
    });

    rawHistoryDocs.value = docs;

    // Utilise le deuxième mois unique pour la comparaison si disponible
    if (uniqueHistoryDocs.value.length >= 2) {
      previousMonthData.value = uniqueHistoryDocs.value[1];
    } else {
      previousMonthData.value = null;
    }
  } catch (error) {
    console.error("Erreur fetchPreviousMonth:", error);
  }
};

// Traitement anti-doublon : Ne garde qu'une entrée max par mois (la plus récente écrase la précédente)
const uniqueHistoryDocs = computed(() => {
  const seenMonths = new Set();
  const filtered = [];

  for (const doc of rawHistoryDocs.value) {
    if (!doc.datetime) continue;
    const date = doc.datetime.toDate();
    // Clé unique par mois/année (ex: "5-2026" pour Juin 2026)
    const monthKey = `${date.getMonth()}-${date.getFullYear()}`;

    // Si on n'a pas encore vu ce mois, comme le tableau est trié du plus récent au plus ancien,
    // c'est la version la plus fraîche qu'on garde. Les doublons plus anciens sont ignorés (écrasés).
    if (!seenMonths.has(monthKey)) {
      seenMonths.add(monthKey);
      filtered.push(doc);
    }
  }
  return filtered;
});

const formatHistoryDate = (firestoreTimestamp) => {
  if (!firestoreTimestamp) return "---";
  const date = firestoreTimestamp.toDate();
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

const diffBilan = computed(() => {
  if (!previousMonthData.value || !financialData.value) return null;
  const currentBilan = financialData.value.monthly_income - financialData.value.monthly_expenses;
  const prevBilan = previousMonthData.value.total_income - previousMonthData.value.total_expenses;
  return currentBilan - prevBilan;
});

const diffExpenses = computed(() => {
  if (!financialData.value || !previousMonthData.value) return null;
  return financialData.value.monthly_expenses - previousMonthData.value.total_expenses;
});

const lastInputMonth = computed(() => {
  if (!uniqueHistoryDocs.value[0]?.datetime) return "Mois en cours";
  const date = uniqueHistoryDocs.value[0].datetime.toDate(); 
  return date.toLocaleDateString('fr-FR', { month: 'long' });
});

const nextMonthToClose = computed(() => {
  if (!uniqueHistoryDocs.value[0]?.datetime) {
    return new Date().toLocaleDateString('fr-FR', { month: 'long' });
  }
  const date = uniqueHistoryDocs.value[0].datetime.toDate();
  date.setMonth(date.getMonth());
  return date.toLocaleDateString('fr-FR', { month: 'long' });
});

const submitHistory = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const customDate = new Date(historyForm.year, historyForm.month, 1, 12, 0, 0);

    await addDoc(collection(db, "monthly_financial_stats"), {
      userId: user.uid,
      total_income: historyForm.total_income,
      total_expenses: historyForm.total_expenses,
      datetime: customDate,
      createdAt: serverTimestamp()
    });

    alert("Données historiques enregistrées !");
    showHistoryModal.value = false;
    await fetchPreviousMonth(user.uid);
  } catch (e) {
    console.error("Erreur ajout historique :", e);
  }
};
</script>
<template>
  <div class="bg-[#F8FAFC] font-['Inter']"> 
    <div v-if="financialData" class="max-w-7xl mx-auto space-y-8">
      
      <!-- ================= ENCART COMPOSANTS PRINCIPAUX ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch heading">
        
        <!-- Bilan Épargne -->
        <div class="lg:col-span-6 bg-white p-7 rounded-[24px] shadow-sm border border-gray-100 flex flex-col h-full">
          <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-3">
              <div class="bg-[#E6F6F4] p-2.5 rounded-xl text-[#00AA90]">
                <History class="w-6 h-6" />
              </div>
              <h3 class="heading text-xl text-[#00AA90] font-black">Bilan épargne</h3>
            </div>
            <span class="bg-[#E6F6F4] text-[#00AA90] text-[11px] font-black px-3 py-1 rounded-full uppercase">
              {{ uniqueHistoryDocs.length > 0 ? lastInputMonth : 'Estimation' }}
            </span>
          </div>

          <div class="flex-grow">
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-black text-gray-900">{{ bilanEpargne }} €</span>
              <span class="text-xl font-bold text-gray-400"> / {{ financialData.monthly_savings_target || '—' }} €</span>
            </div>
            
            <div v-if="uniqueHistoryDocs.length === 0" class="text-xs font-semibold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg mt-2 inline-block">
              💡 Chiffre théorique basé sur ton profil d'inscription
            </div>
            <div v-else-if="diffBilan !== null" class="flex items-center gap-1.5 text-[#00AA90] font-bold text-sm mt-1">
              <span class="text-lg">↗</span>
              <span>{{ diffBilan >= 0 ? '+' : '' }}{{ diffBilan }}€ vs mois précédent</span>
            </div>
          </div>

          <div class="mt-6 flex justify-between items-center border-t border-gray-50 pt-4">
            <button @click="showHistoryModal = true" class="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#00AA90] transition-colors">
              <PlusCircle class="w-4 h-4" /> Renseigner un mois passé
            </button>

            <button 
              v-if="uniqueHistoryDocs.length === 0"
              @click="showHistoryModal = true"
              class="flex items-center gap-2 text-white bg-[#00AA90] px-4 py-2 rounded-xl font-black text-xs hover:bg-[#008f7a] transition-all shadow-sm animate-pulse"
            >
              Remplir mon premier mois <span>→</span>
            </button>
            <button v-else class="flex items-center gap-2 text-gray-900 font-black text-sm hover:translate-x-1 transition-transform border-b-2 border-gray-900 pb-0.5">
              Clôturer {{ nextMonthToClose }} <span>→</span>
            </button>
          </div>
        </div>

        <!-- Dépense Moyenne -->
        <div class="lg:col-span-3 bg-white p-7 rounded-[24px] heading shadow-sm border border-gray-100 flex flex-col h-full">
          <div class="flex items-center gap-3">
            <div class="bg-[#E6F6F4] p-2.5 rounded-xl text-[#00AA90]">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
               </svg>
            </div>
            <h3 class="heading text-xl text-[#00AA90] font-black">Dépense du mois clôturé</h3>
          </div>
          <div class="flex-grow flex flex-col justify-center mt-4">
            <div class="text-3xl font-black text-gray-900 mb-2">{{ displayedExpenses }} €</div>
            <div v-if="diffExpenses !== null" :class="diffExpenses <= 0 ? 'text-[#00AA90]' : 'text-red-500'" class="flex items-center gap-1 font-bold text-sm tracking-tight">
              <span>{{ diffExpenses <= 0 ? '↘' : '↗' }}</span>
              <span>{{ Math.abs(diffExpenses) }}€ vs mois précédent</span>
            </div>
          </div>
        </div>

        <!-- Revenu Moyen -->
        <div class="lg:col-span-3 bg-white p-7 rounded-[24px] shadow-sm border border-gray-100 flex flex-col h-full relative overflow-hidden">
          <div class="flex items-center gap-3">
            <div class="bg-[#E6F6F4] p-2.5 rounded-xl text-[#00AA90] heading">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
               </svg>
            </div>
            <h3 class="heading text-xl text-[#00AA90] font-black">Revenu du mois clôturé</h3>
          </div>
          <div class="flex-grow flex flex-col justify-center mt-4">
            <div class="text-3xl font-black text-gray-900 mb-6">{{ displayedIncome }} €</div>
          </div>
          <div class="absolute bottom-6 right-6 flex -space-x-3">
            <div class="w-9 h-9 rounded-full bg-[#00AA90] border-2 border-white flex items-center justify-center text-white font-black text-[10px]">IR</div>
            <div class="w-9 h-9 rounded-full bg-orange-400 border-2 border-white shadow-sm"></div>
          </div>
        </div>
      </div>

      <!-- ================= HISTORIQUE DÉPLIABLE ET SANS DOUBLONS (image_dca8e5.png) ================= -->
      <div class="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 transition-all duration-300">
        
        <!-- En-tête cliquable pour déplier -->
        <div class="flex heading justify-between items-center cursor-pointer select-none" @click="isHistoryExpanded = !isHistoryExpanded">
          <div class="flex items-center gap-3">
            <div class="bg-[#E6F6F4] p-2 rounded-xl text-[#00AA90]">
              <Wallet class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-black text-gray-900 flex items-center gap-2">
                <span>Historique des bilans mensuels</span>
                <component :is="isHistoryExpanded ? ChevronUp : ChevronDown" class="w-4 h-4 text-gray-400" />
              </h3>
              <p class="text-xs text-gray-400 font-medium">Suivi global de vos revenus et dépenses réels (1 entrée max / mois)</p>
            </div>
          </div>
          
          <button @click.stop="showHistoryModal = true" class="text-xs font-black text-[#00AA90] bg-[#E6F6F4] px-3 py-1.5 rounded-xl hover:bg-[#008f7a] hover:text-white transition-all">
            + Ajouter un mois
          </button>
        </div>

        <!-- Zone dépliable -->
        <div v-show="isHistoryExpanded" class="heading mt-6 pt-4 border-t border-gray-50 transition-all duration-300">
          <!-- Tableau s'il y a des données filtrées -->
          <div v-if="uniqueHistoryDocs.length > 0" class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th class="pb-3">Mois / Période</th>
                  <th class="pb-3">Revenus reçus</th>
                  <th class="pb-3">Dépenses totales</th>
                  <th class="pb-3 text-right">Épargne générée</th>
                </tr>
              </thead>
              <tbody class="text-xs font-bold text-gray-700 divide-y divide-gray-50">
                <tr v-for="doc in uniqueHistoryDocs" :key="doc.id" class="hover:bg-gray-50/50 transition-colors">
                  <td class="py-3.5 capitalize text-gray-900 font-black flex items-center gap-2">
                    <Calendar class="w-4 h-4 text-gray-400" />
                    {{ formatHistoryDate(doc.datetime) }}
                  </td>
                  <td class="py-3.5 text-gray-600">
                    <span class="inline-flex items-center gap-1 text-emerald-600">
                      <ArrowUpRight class="w-3.5 h-3.5" /> {{ doc.total_income.toLocaleString() }} €
                    </span>
                  </td>
                  <td class="py-3.5 text-gray-600">
                    <span class="inline-flex items-center gap-1 text-red-500">
                      <ArrowDownRight class="w-3.5 h-3.5" /> {{ doc.total_expenses.toLocaleString() }} €
                    </span>
                  </td>
                  <td class="py-3.5 text-right font-black text-sm" :class="(doc.total_income - doc.total_expenses) >= 0 ? 'text-[#00AA90]' : 'text-red-500'">
                    {{ (doc.total_income - doc.total_expenses).toLocaleString() }} €
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- État vide -->
          <div v-else class="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
            <p class="text-xs font-semibold text-gray-400">Aucun mois n'a encore été enregistré dans votre historique financier.</p>
          </div>
        </div>
      </div>

    </div>

    <!-- ================= MODALE D'AJOUT ================= -->
    <div v-if="showHistoryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div class="bg-white rounded-[2rem] max-w-md w-full p-6 shadow-2xl relative border border-gray-100">
        
        <button @click="showHistoryModal = false" class="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors">
          <X class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-[#E6F6F4] text-[#00AA90] rounded-xl flex items-center justify-center">
            <Calendar class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-black text-gray-900">Ajouter un historique</h3>
            <p class="text-xs text-gray-400 font-medium">Renseignez vos flux passés (Écrase l'ancien si doublon)</p>
          </div>
        </div>

        <form @submit.prevent="submitHistory" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Mois</label>
              <select v-model="historyForm.month" class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-800 outline-none focus:border-[#00AA90]">
                <option v-for="(m, i) in monthsList" :key="i" :value="i">{{ m }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Année</label>
              <select v-model="historyForm.year" class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-800 outline-none focus:border-[#00AA90]">
                <option :value="2026">2026</option>
                <option :value="2025">2025</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Total Revenus reçus (€)</label>
            <input v-model.number="historyForm.total_income" type="number" required class="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-sm text-gray-900 outline-none focus:bg-white focus:border-[#00AA90]" placeholder="Ex: 1800" />
          </div>

          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Total Dépenses effectuées (€)</label>
            <input v-model.number="historyForm.total_expenses" type="number" required class="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-sm text-gray-900 outline-none focus:bg-white focus:border-[#00AA90]" placeholder="Ex: 1200" />
          </div>

          <div class="pt-2 flex gap-3">
            <button type="button" @click="showHistoryModal = false" class="w-1/2 px-4 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold text-xs hover:bg-gray-100 transition-colors">Annuler</button>
            <button type="submit" class="w-1/2 px-4 py-3 bg-[#00AA90] hover:bg-[#008f7a] text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all">
              <span>Enregistrer</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>