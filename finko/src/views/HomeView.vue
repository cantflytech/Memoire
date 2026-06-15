<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../firebase/config';
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

// Nettoie ton onMounted pour qu'il n'appelle QUE fetchData
onMounted(() => {
  fetchData();
});

const submitMonthlyStats = async (newIncome, newExpenses) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    // 1. PUSH dans l'historique (monthly_financial_stats)
    // On crée un nouveau document à chaque fois
    await addDoc(collection(db, "monthly_financial_stats"), {
      userId: user.uid, // On lie le log à l'utilisateur
      total_income: newIncome,
      total_expenses: newExpenses,
      datetime: serverTimestamp() // Utilise l'heure du serveur Firebase
    });

    // 2. UPDATE le profil global (user_financial_profile)
    const profileRef = doc(db, "user_financial_profile", user.uid);
    await updateDoc(profileRef, {
      "user_financial_profile.monthly_income": newIncome,
      "user_financial_profile.monthly_expenses": newExpenses
    });

    // 3. Optionnel : Rafraîchir les données localement
    financialData.value.monthly_income = newIncome;
    financialData.value.monthly_expenses = newExpenses;

    alert("Données mises à jour et archivées !");
  } catch (e) {
    console.error("Erreur lors du push :", e);
  }
};
const editIncome = ref(0);
const editExpenses = ref(0);

</script>

<template>
  <main>
    

    <div class="bg-white border p-6 rounded-xl shadow-sm">
      <h2 class="text-xl font-bold mb-4">Ajouter les flux du mois</h2>
      
      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Revenus de ce mois</label>
          <input 
            v-model.number="editIncome" 
            type="number" 
            class="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Dépenses de ce mois</label>
          <input 
            v-model.number="editExpenses" 
            type="number" 
            class="w-full p-2 border rounded-md"
          />
        </div>

        <button 
          @click="submitMonthlyStats(editIncome, editExpenses)"
          class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
        >
          Valider et Archiver
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-10">
      <p>Chargement de vos finances...</p>
    </div>
  </main>
</template>