<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
const financialData = ref(null);
const loading = ref(true); // Optionnel : pour afficher un état de chargement

const fetchData = () => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // 1. Récupère le profil
      const docRef = doc(db, "user_financial_profile", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data().user_financial_profile;
        financialData.value = data;
        editIncome.value = data.monthly_income;
        editExpenses.value = data.monthly_expenses;
      }

      // 2. Récupère l'historique (APPEL ICI)
      await fetchPreviousMonth(user.uid);
    }
    loading.value = false;
  });
};

onMounted(() => {
  fetchData();
});

const bilanEpargne = computed(() => {
  if (!financialData.value) return 0;
  return financialData.value.monthly_income - financialData.value.monthly_expenses;
});

const editIncome = ref(0);
const editExpenses = ref(0);
import { query, where, orderBy, limit, getDocs } from 'firebase/firestore';

const previousMonthData = ref(null);

const fetchPreviousMonth = async (userId) => {
  try {
    const statsRef = collection(db, "monthly_financial_stats");
    const q = query(
      statsRef,
      where("userId", "==", userId),
      orderBy("datetime", "desc"),
      limit(2) 
    );

    const querySnapshot = await getDocs(q);
    const docs = [];
    querySnapshot.forEach((doc) => {
      docs.push(doc.data());
    });

    console.log("Documents trouvés dans l'historique :", docs.length);

    if (docs.length >= 2) {
      previousMonthData.value = docs[1];
      console.log("Données du mois précédent chargées :", previousMonthData.value);
    } else {
      console.log("Pas assez d'historique pour comparer (besoin de 2 docs minimum)");
    }
  } catch (error) {
    console.error("Erreur fetchPreviousMonth:", error);
  }
};
const diffIncome = computed(() => {
  if (!financialData.value || !previousMonthData.value) return null;
  return financialData.value.monthly_income - previousMonthData.value.total_income;
});

const diffExpenses = computed(() => {
  if (!financialData.value || !previousMonthData.value) return null;
  return financialData.value.monthly_expenses - previousMonthData.value.total_expenses;
});

const diffBilan = computed(() => {
  if (!previousMonthData.value) return null;
  const currentBilan = financialData.value.monthly_income - financialData.value.monthly_expenses;
  const prevBilan = previousMonthData.value.total_income - previousMonthData.value.total_expenses;
  return currentBilan - prevBilan;
});

const lastInputMonth = computed(() => {
  // On regarde la date du document le plus récent (docs[0] dans fetchPreviousMonth)
  // Si tu n'as pas encore stocké le tout premier doc, on peut utiliser previousMonthData ou financialData
  if (!previousMonthData.value?.datetime) return "---";

  // Conversion du Timestamp Firebase en Date JS
  const date = previousMonthData.value.datetime.toDate(); 
  
  // Récupérer le nom du mois en français
  return date.toLocaleDateString('fr-FR', { month: 'long' });
});

const nextMonthToClose = computed(() => {
  if (!previousMonthData.value?.datetime) return "---";

  const date = previousMonthData.value.datetime.toDate();
  // On ajoute 1 mois
  date.setMonth(date.getMonth() + 1);
  
  return date.toLocaleDateString('fr-FR', { month: 'long' });
});
</script>
<template>
  <div class=" bg-[#F8FAFB]"> 
    <div v-if="financialData" class="max-w-7xl mx-auto">
      
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div class="lg:col-span-6 bg-white p-7 rounded-[24px] shadow-sm border border-gray-100 flex flex-col h-full">
          <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-3">
              <div class="bg-[#E6F6F4] p-2.5 rounded-xl">
                <svg class="w-6 h-6 text-[#00AA90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 class="heading text-xl green">Bilan épargne</h3>
            </div>
            <span class="bg-[#E6F6F4] text-[#00AA90] text-[11px] font-black px-3 py-1 rounded-full uppercase">
              {{ lastInputMonth }}
            </span>
          </div>

          <div class="flex-grow">
            <div class="flex items-baseline gap-1 ">
              <span class="text-4xl font-black text-gray-900">{{ bilanEpargne }} €</span>
              <span class="text-xl font-bold text-gray-400"> / {{ financialData.monthly_savings_target }} €</span>
            </div>
            <div v-if="diffBilan !== null" class="flex items-center gap-1.5 text-[#00AA90] font-bold text-sm">
              <span class="text-lg">↗</span>
              <span>{{ diffBilan >= 0 ? '+' : '' }}{{ diffBilan }}€ vs mois précédent</span>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button class="flex items-center gap-2 text-gray-900 font-black text-sm hover:translate-x-1 transition-transform border-b-2 border-gray-900 pb-0.5">
              Clôturer {{ nextMonthToClose }} <span>→</span>
            </button>
          </div>
        </div>

        <div class="lg:col-span-3 bg-white p-7 rounded-[24px] shadow-sm border border-gray-100 flex flex-col h-full">
          <div class="flex items-center gap-3 ">
            <div class="bg-[#E6F6F4] p-2.5 rounded-xl">
               <svg class="w-6 h-6 text-[#00AA90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
               </svg>
            </div>
            <h3 class="heading text-xl green">Dépense moyenne</h3>
          </div>
          <div class="flex-grow flex flex-col justify-center">
            <div class="text-3xl font-black text-gray-900 mb-2">{{ financialData.monthly_expenses }} €</div>
            <div v-if="diffExpenses !== null" :class="diffExpenses <= 0 ? 'text-[#00AA90]' : 'text-red-500'" class="flex items-center gap-1 font-bold text-sm tracking-tight">
              <span>{{ diffExpenses <= 0 ? '↘' : '↗' }}</span>
              <span>{{ Math.abs(diffExpenses) }}€ vs mois précédent</span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-3 bg-white p-7 rounded-[24px] shadow-sm border border-gray-100 flex flex-col h-full relative overflow-hidden">
          <div class="flex items-center gap-3 ">
            <div class="bg-[#E6F6F4] p-2.5 rounded-xl">
               <svg class="w-6 h-6 text-[#00AA90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
               </svg>
            </div>
            <h3 class="heading text-xl green">Revenu moyen</h3>
          </div>
          <div class="flex-grow flex flex-col justify-center">
            <div class="text-3xl font-black text-gray-900 mb-6">{{ financialData.monthly_income }} €</div>
          </div>
          <div class="absolute bottom-6 right-6 flex -space-x-3">
            <div class="w-9 h-9 rounded-full bg-[#00AA90] border-2 border-white flex items-center justify-center text-white font-black text-[10px]">IR</div>
            <div class="w-9 h-9 rounded-full bg-orange-400 border-2 border-white shadow-sm"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.text2 {
  color: #00AA90 !important;
  font-family: 'Inter', sans-serif;
  font-weight: 800; 
}
</style>