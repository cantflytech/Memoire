<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../../firebase/config';
// CORRECTION : On importe setDoc à la place de updateDoc
import { doc, getDoc, setDoc } from 'firebase/firestore';

const editIncome = ref(1500);
const editExpenses = ref(500);
const loading = ref(true);

// Calculs dynamiques pour l'affichage
const annualIncome = computed(() => editIncome.value * 12);
const annualExpenses = computed(() => editExpenses.value * 12);

// On définit le multiplicateur (ici 3 mois comme sur ton image)
const monthsTarget = ref(3);
const emergencyFundTarget = computed(() => editExpenses.value * monthsTarget.value);

const fetchData = () => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const docRef = doc(db, "user_financial_profile", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data().user_financial_profile || docSnap.data();
        editIncome.value = data.monthly_income || 1500;
        editExpenses.value = data.monthly_expenses || 500;
      }
    }
    loading.value = false;
  });
};

const saveStep = async () => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const profileRef = doc(db, "user_financial_profile", user.uid);
    
    // CORRECTION : setDoc + merge: true gère la création ET la mise à jour sans crash
    await setDoc(profileRef, {
      user_financial_profile: {
        monthly_income: editIncome.value,
        monthly_expenses: editExpenses.value,
        emergency_fund_target: emergencyFundTarget.value
      }
    }, { merge: true });
    
    alert("Étape enregistrée !");
  } catch (e) {
    console.error("Erreur lors de la sauvegarde :", e);
  }
};

onMounted(fetchData);
</script>

<template>
  <main class="min-h-screen bg-[#F8FAFB] p-6 font-['Inter']">
    <div class="max-w-4xl mx-auto">
      
      <header class="flex justify-between items-center mb-8">
        <div class="flex items-center gap-4">
          <button class="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-400">
            <span class="text-xl">←</span>
          </button>
          <div>
            <h1 class="text-xl font-black text-gray-900">Création de ton profil Financier</h1>
            <p class="text-sm text-gray-500 font-medium">étape 2/4 : Calcul de ton fond d'urgence</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <div class="flex gap-1">
            <div class="w-6 h-2 rounded-full bg-[#00AA90]"></div>
            <div class="w-6 h-2 rounded-full bg-[#00AA90]"></div>
            <div class="w-6 h-2 rounded-full bg-gray-200"></div>
            <div class="w-6 h-2 rounded-full bg-gray-200"></div>
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <div class="bg-[#E6F6F4] p-1.5 rounded-md">🛡️</div>
            <h3 class="text-[#00AA90] font-bold text-sm uppercase">Revenu mensuel Net</h3>
          </div>
          <div class="flex items-center gap-3 bg-gray-100 p-3 rounded-xl mb-4">
            <input v-model.number="editIncome" type="number" class="bg-transparent font-black text-xl w-24 outline-none" />
            <span class="font-bold text-gray-900">€ / mois</span>
          </div>
          <p class="text-right text-[#00AA90] text-xs font-bold italic">
            Ton Revenu moyen : ~{{ annualIncome.toLocaleString() }}€ / an
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <div class="bg-[#E6F6F4] p-1.5 rounded-md">🛡️</div>
            <h3 class="text-[#00AA90] font-bold text-sm uppercase">Dépense mensuel fixe</h3>
          </div>
          <div class="flex items-center gap-3 bg-gray-100 p-3 rounded-xl mb-4">
            <input v-model.number="editExpenses" type="number" class="bg-transparent font-black text-xl w-24 outline-none" />
            <span class="font-bold text-gray-900">€ / mois</span>
          </div>
          <p class="text-right text-[#00AA90] text-xs font-bold italic">
            Tes frais fixes : ~{{ annualExpenses.toLocaleString() }}€ / an
          </p>
        </div>
      </div>

      <div class="bg-[#FFF9E6] border border-[#FFE4A3] rounded-3xl p-8 relative overflow-hidden mb-8">
        <h2 class="text-[#D97706] font-bold text-center mb-6">
          D'après ta situation, voici ton fond d'urgence idéal à atteindre :
        </h2>
        
        <div class="flex flex-col items-center justify-center space-y-2 mb-6">
          <div class="flex items-center gap-4">
            <span class="text-3xl text-[#D97706]">↪</span>
            <span class="text-5xl font-black text-[#D97706]">{{ emergencyFundTarget.toLocaleString() }}€</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-600 font-medium italic">Soit environ</span>
            <span class="bg-[#FFE4A3] px-3 py-1 rounded-lg font-black text-[#D97706]">{{ monthsTarget }} mois</span>
            <span class="text-gray-600 font-medium italic">dépenses fixes</span>
          </div>
        </div>

        <div class="max-w-xl">
          <p class="font-bold text-gray-900 text-sm mb-1">Pourquoi ?</p>
          <p class="text-[#D97706] text-xs leading-relaxed font-medium italic">
            Cela te permet de faire face aux imprévus (panne de voiture, perte d'emploi...) sans piocher dans tes investissements.
          </p>
        </div>

        <div class="absolute right-10 top-1/2 -translate-y-1/2 hidden md:block opacity-80">
           <div class="relative w-32 h-20 bg-pink-300 rounded-xl rotate-12 shadow-lg flex items-center justify-center text-white font-bold">
             💳
             <div class="absolute -top-4 -right-2 text-3xl">🪙</div>
             <div class="absolute -bottom-4 -left-2 text-3xl">🪙</div>
           </div>
        </div>
      </div>

      <button 
        @click="saveStep"
        class="w-full bg-[#00AA90] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#008F7A] transition-all shadow-lg"
      >
        <span class="text-xl">→</span> Enregistrer cette étape
      </button>

    </div>
  </main>
</template>