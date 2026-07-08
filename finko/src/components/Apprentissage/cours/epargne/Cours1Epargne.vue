<script setup>
import { ref } from 'vue';
import { db, auth } from '../../../../firebase/config'; // Ajuste le chemin selon ton projet
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { 
  ArrowLeft, 
  BookOpen, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  XCircle 
} from 'lucide-vue-next';

const router = useRouter();

// Gestion de la leçon active (1 à 6)
const activeLesson = ref(1);

// Modèles réactifs pour l'exercice interactif rapide de la leçon 6
const userIncomeInput = ref(2100);
const userFixedInput = ref(860);
const userVariableInput = ref(600);

// Calcul automatique du reste pour l'utilisateur dans la leçon 6
const userSavingsPotential = ref(640);
const calculateUserSavings = () => {
  userSavingsPotential.value = userIncomeInput.value - userFixedInput.value - userVariableInput.value;
};

// État de chargement Firebase lors de la clôture
const finishingLoading = ref(false);

// Fonction déclenchée à la fin de la leçon 6 (Terminer le cours)
const handleFinishLesson = async () => {
  const user = auth.currentUser;
  if (!user) {
    router.push('/learning');
    return;
  }

  try {
    finishingLoading.value = true;

    // 1. Récupérer le profil utilisateur actuel
    const profileRef = doc(db, "user_financial_profile", user.uid);
    const profileSnap = await getDoc(profileRef);
    
    let currentXp = 0;
    let currentLevel = 1;

    if (profileSnap.exists()) {
      const profileData = profileSnap.data().user_financial_profile || profileSnap.data();
      currentXp = profileData.xp || 0;
      currentLevel = profileData.level || 1;
    }

    // 2. Calculer le gain d'XP (+50 XP pour la validation de ce cours)
    const xpGained = 50; 
    let newXp = currentXp + xpGained;
    let newLevel = currentLevel;

    // 3. Logique de montée de niveau (Palier de 3 000 XP requis par niveau)
    const xpPerLevel = 3000;
    if (newXp >= xpPerLevel) {
      newLevel += Math.floor(newXp / xpPerLevel);
      newXp = newXp % xpPerLevel; // Conserve le reste d'XP pour le niveau suivant
      alert(`Félicitations ! Tu passes au Niveau ${newLevel} ! 🎉`);
    }

    // 4. Enregistrer les modifications de progression dans Firestore
    await setDoc(profileRef, {
      user_financial_profile: {
        xp: newXp,
        level: newLevel
      }
    }, { merge: true });

    alert("Cours validé ! +50 XP obtenus.");
    window.dispatchEvent(new CustomEvent('learning-course-completed'));
   
    

  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'XP :", error);
    alert("Une erreur est survenue lors de l'enregistrement de tes points.");
  } finally {
    finishingLoading.value = false;
  }
};

// Gestion centralisée du bouton d'avancement principal
const handleNextStep = () => {
  if (activeLesson.value < 6) {
    activeLesson.value++;
  } else {
    handleFinishLesson();
  }
};
</script>
<template class="heading">
  <main class="max-w-7xl mx-auto bg-[#F8FAFB] font-['Inter'] flex justify-center">
    <div class="max-w-7xl w-full bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
      
      <header class="bg-gradient-to-r from-[#00AA90] to-[#008F7A] p-6 text-white relative">
        <div class="flex justify-between items-start">
          <div class="space-y-1">
            <div class="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5">
              <span class="text-xs">📖</span>
              <span class="text-[9px] heading font-black uppercase tracking-wider">Chapitre 1 : Les Fondations</span>
            </div>
            <h1 class="text-2xl heading font-black tracking-tight">Comprendre son budget</h1>
          </div>
          <span class="text-3xl">💰</span>
        </div>

        <p class="text-xs heading text-teal-50 font-medium italic mt-4 border-l-2 border-white/30 pl-3 max-w-xl">
          "Beaucoup rêvent d'investir. Peu savent où part leur argent. Un capitaine qui ne connaît pas sa cargaison finit sur les récifs."
        </p>

        <div class="mt-6 space-y-1.5">
          <div class="flex heading justify-between text-[10px] font-bold text-teal-100">
            <span>Progression de la leçon</span>
            <span>{{ Math.round((activeLesson / 6) * 100) }}%</span>
          </div>
          <div class="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div 
              class="bg-white h-full rounded-full transition-all duration-300" 
              :style="{ width: `${(activeLesson / 6) * 100}%` }"
            ></div>
          </div>
        </div>
      </header>

      <nav class="flex heading border-b border-gray-100 overflow-x-auto bg-gray-50/50 scrollbar-none">
        <button 
          v-for="i in 6" 
          :key="i"
          @click="activeLesson = i"
          :class="[
            activeLesson === i 
              ? 'border-[#00AA90] text-[#00AA90] bg-white font-black' 
              : 'border-transparent text-gray-400 font-bold hover:text-gray-600',
            'flex-1 text-center py-3.5 px-4 text-xs border-b-2 whitespace-nowrap transition-all'
          ]"
        >
          Leçon {{ i }}
        </button>
      </nav>

      <div class="p-6 md:p-8 min-h-[350px] heading">
        
        <div v-if="activeLesson === 1" class="space-y-5 animate-fade-in">
          <h2 class="text-lg font-black text-gray-900">Leçon 1 : Pourquoi faire un budget ?</h2>
          <p class="text-sm text-gray-600 leading-relaxed font-medium">
            Un budget n'est pas une punition. <strong class="text-gray-900">C'est une carte au trésor.</strong><br>
            Son but est extrêmement simple :
          </p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center space-y-1">
              <span class="text-xl">📥</span>
              <p class="text-xs font-black text-gray-800">Savoir combien entre</p>
            </div>
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center space-y-1">
              <span class="text-xl">📤</span>
              <p class="text-xs font-black text-gray-800">Savoir combien sort</p>
            </div>
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center space-y-1">
              <span class="text-xl">🎯</span>
              <p class="text-xs font-black text-gray-800">Décider où va chaque euro</p>
            </div>
          </div>
          <div class="bg-orange-50 border border-orange-100 text-orange-800 p-4 rounded-xl text-xs font-medium flex items-center gap-3">
            <span class="text-xl">🏴‍☠️</span>
            <p>Sans budget, l'argent disparaît comme un coffre laissé ouvert devant les Rapetou.</p>
          </div>
        </div>

        <div v-if="activeLesson === 2" class="space-y-5">
          <h2 class="text-lg font-black text-gray-900">Leçon 2 : Les revenus</h2>
          <p class="text-sm text-gray-600 leading-relaxed font-medium">
            Les revenus représentent tout l'argent qui entre dans tes comptes.
          </p>
          <div class="flex flex-wrap gap-2">
            <span v-for="item in ['Salaire', 'Primes', 'Pension', 'Revenus locatifs', 'Activités indépendantes', 'Aides']" :key="item" class="bg-teal-50 text-[#00AA90] border border-teal-100 px-3 py-1.5 rounded-lg text-xs font-bold">
              💰 {{ item }}
            </span>
          </div>

          <div class="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
            <h4 class="text-xs font-black text-gray-800 uppercase tracking-wider">📝 Exercice d'exemple</h4>
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="text-gray-400 font-bold border-b border-gray-200">
                  <th class="pb-2">Source</th>
                  <th class="pb-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody class="font-bold text-gray-700">
                <tr class="border-b border-gray-100"><td class="py-2 text-gray-500">Salaire</td><td class="py-2 text-right">2 000 €</td></tr>
                <tr class="border-b border-gray-100"><td class="py-2 text-gray-500">Prime moyenne</td><td class="py-2 text-right">100 €</td></tr>
                <tr class="text-[#00AA90] font-black"><td class="pt-2">Total</td><td class="pt-2 text-right">2 100 €</td></tr>
              </tbody>
            </table>
            <p class="text-[11px] text-gray-400 font-medium italic pt-1">Ton revenu total est la somme de tout ce qui entre.</p>
          </div>
        </div>

        <div v-if="activeLesson === 3" class="space-y-5">
          <h2 class="text-lg font-black text-gray-900">Leçon 3 : Les dépenses fixes</h2>
          <p class="text-sm text-gray-600 leading-relaxed font-medium">
            Les dépenses fixes reviennent chaque mois et changent très peu. Elles représentent tes obligations de base.
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div v-for="item in ['Loyer', 'Crédit immo', 'Assurances', 'Téléphone', 'Internet', 'Transports', 'Électricité', 'Mutuelle']" :key="item" class="bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-center text-xs font-bold text-gray-700">
              📌 {{ item }}
            </div>
          </div>

          <div class="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
            <h4 class="text-xs font-black text-gray-800 uppercase tracking-wider">📊 Calcul du coût de vie minimum</h4>
            <table class="w-full text-xs text-left">
              <tbody class="font-bold text-gray-700">
                <tr class="border-b border-gray-100"><td class="py-1.5 text-gray-500">Loyer</td><td class="py-1.5 text-right">700 €</td></tr>
                <tr class="border-b border-gray-100"><td class="py-1.5 text-gray-500">Internet</td><td class="py-1.5 text-right">30 €</td></tr>
                <tr class="border-b border-gray-100"><td class="py-1.5 text-gray-500">Assurance</td><td class="py-1.5 text-right">50 €</td></tr>
                <tr class="border-b border-gray-100"><td class="py-1.5 text-gray-500">Électricité</td><td class="py-1.5 text-right">80 €</td></tr>
                <tr class="text-red-500 font-black"><td class="pt-2">Total</td><td class="pt-2 text-right">860 €</td></tr>
              </tbody>
            </table>
            <p class="text-[11px] text-gray-400 font-medium italic pt-1">En additionnant tout, tu obtiens ton coût de vie minimum.</p>
          </div>
        </div>

        <div v-if="activeLesson === 4" class="space-y-5">
          <h2 class="text-lg font-black text-gray-900">Leçon 4 : Les dépenses variables</h2>
          <p class="text-sm text-gray-600 leading-relaxed font-medium">
            Elles changent chaque mois selon tes habitudes et tes activités. C'est ici que tu as le plus de marge de manœuvre.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="item in [{n:'Courses', m:'300 €'}, {n:'Essence', m:'120 €'}, {n:'Loisirs', m:'100 €'}, {n:'Restaurants', m:'80 €'}]" :key="item.n" class="bg-white border border-gray-100 p-3.5 rounded-xl flex justify-between items-center shadow-xs">
              <span class="text-xs font-bold text-gray-800">🛒 {{ item.n }}</span>
              <span class="text-xs font-black text-gray-900">{{ item.m }}</span>
            </div>
          </div>
          <div class="bg-teal-50/50 border border-teal-100 p-3 text-center text-xs font-bold text-[#00AA90] rounded-xl">
            Total dépenses variables estimé : 600 €
          </div>
        </div>

        <div v-if="activeLesson === 5" class="space-y-5">
          <h2 class="text-lg font-black text-gray-900">Leçon 5 : Les dépenses inutiles</h2>
          <p class="text-sm text-gray-600 leading-relaxed font-medium">
            Voilà les petites fuites cachées du coffre-fort. Une dépense inutile n'est pas forcément bête, c'est simplement <strong class="text-gray-900">quelque chose qui ne t'apporte pas assez de valeur par rapport à son coût.</strong>
          </p>
          <div class="space-y-2">
            <div v-for="item in ['Abonnement oublié', 'Livraison quotidienne', 'Achats impulsifs', 'Jeux/applications jamais utilisés', 'Vêtements jamais portés']" :key="item" class="bg-red-50/40 text-red-800 border border-red-100/60 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              ❌ {{ item }}
            </div>
          </div>

          <div class="bg-[#FFF9E6] border border-[#FFE4A3] p-5 rounded-2xl text-center space-y-2">
            <h4 class="text-xs font-black text-[#D97706] uppercase tracking-wide">💡 La règle des 30 jours</h4>
            <p class="text-xs font-medium text-gray-700 italic">Avant d'acheter, pose-toi la question :</p>
            <p class="text-sm font-black text-gray-900">"Dans 30 jours, serai-je vraiment content d'avoir acheté ça ?"</p>
            <p class="text-[11px] text-[#D97706] font-bold">Si la réponse est non... Garde les pièces dans le coffre.</p>
          </div>
        </div>

        <div v-if="activeLesson === 6" class="space-y-5">
          <h2 class="text-lg font-black text-gray-900">Leçon 6 : Le calcul final</h2>
          
          <div class="bg-[#E6F6F4] border border-[#00AA90]/20 p-4 rounded-xl text-center">
            <span class="text-[10px] font-bold text-[#00AA90] uppercase tracking-wider block mb-1">La formule magique</span>
            <span class="text-lg font-black text-gray-900">Revenus - Dépenses = Épargne potentielle</span>
          </div>

          <p class="text-sm text-gray-600 leading-relaxed font-medium">
            Ces économies restantes sont tes <strong class="text-gray-900">soldats</strong>. Tu as le contrôle absolu sur leur mission : les épargner, les investir ou rembourser une dette.
          </p>

          <div class="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4">
            <h4 class="text-xs font-black text-gray-800 uppercase tracking-wider">🧮 Teste la formule avec tes chiffres :</h4>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Revenus</label>
                <input v-model.number="userIncomeInput" @input="calculateUserSavings" type="number" class="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#00AA90]" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dép. Fixes</label>
                <input v-model.number="userFixedInput" @input="calculateUserSavings" type="number" class="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#00AA90]" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dép. Variables</label>
                <input v-model.number="userVariableInput" @input="calculateUserSavings" type="number" class="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#00AA90]" />
              </div>
            </div>
            <div class="text-right pt-2 border-t border-gray-200">
              <span class="text-xs font-bold text-gray-500">Épargne potentielle : </span>
              <span class="text-base font-black text-[#00AA90] ml-1">{{ userSavingsPotential }} €</span>
            </div>
          </div>
        </div>

      </div>

   <footer class="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <button 
          @click="activeLesson > 1 ? activeLesson-- : null"
          :disabled="activeLesson === 1"
          class="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 transition-all cursor-pointer"
        >
          Précédent
        </button>

        <div class="text-center text-[11px] font-bold text-gray-400 hidden sm:block">
          Celui qui contrôle son budget contrôle son avenir.
        </div>

        <button 
          @click="handleNextStep"
          :disabled="finishingLoading"
          class="px-5 py-2.5 rounded-xl bg-[#00AA90] hover:bg-[#008F7A] text-white text-xs font-black shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span v-if="finishingLoading" class="flex items-center gap-1">
            <svg class="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Validation...</span>
          </span>
          <span v-else>
            {{ activeLesson === 6 ? 'Terminer le cours ✓' : 'Continuer →' }}
          </span>
        </button>
      </footer>

    </div>
  </main>
</template>

<style scoped>
/* Animation d'apparition fluide des leçons */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Masquer la scrollbar de la navigation sur mobile */
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>