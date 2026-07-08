<script setup>
import { ref, computed } from 'vue';
import { db, auth } from '../../../../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';

const router = useRouter();

// Gestion de la leçon active (1 à 5)
const activeLesson = ref(1);

// Variables réactives pour l'exercice visuel de la Leçon 5 (Simulateur d'équilibre)
const totalAmount = ref(10000);
const savingsPercent = ref(40); // 40% en épargne par défaut

// Calculs dynamiques de répartition
const savingsAmount = computed(() => (totalAmount.value * savingsPercent.value) / 100);
const investAmount = computed(() => totalAmount.value - savingsAmount.value);

const profileStatus = computed(() => {
  if (savingsPercent.value >= 80) return { label: '🛡️ Sommeil Profond (Sécuritaire)', color: 'text-teal-600', desc: 'Votre argent est très bien protégé, mais il ne combat pas l\'inflation.' };
  if (savingsPercent.value <= 20) return { label: '🔥 Nuits Agitées (Agressif)', color: 'text-red-500', desc: 'Votre potentiel est maximal, mais attention à la moindre tempête !' };
  return { label: '⚖️ Équilibre Stratégique', color: 'text-indigo-600', desc: 'Une partie vous protège (le toit), une partie vous enrichit (l\'arbre).' };
});

const finishingLoading = ref(false);

const handleFinishLesson = async () => {
  const user = auth.currentUser;
  if (!user) {
    router.push('/learning');
    return;
  }

  try {
    finishingLoading.value = true;

    const profileRef = doc(db, 'user_financial_profile', user.uid);
    const profileSnap = await getDoc(profileRef);

    let currentXp = 0;
    let currentLevel = 1;

    if (profileSnap.exists()) {
      const profileData = profileSnap.data().user_financial_profile || profileSnap.data();
      currentXp = profileData.xp || 0;
      currentLevel = profileData.level || 1;
    }

    const xpGained = 50;
    let newXp = currentXp + xpGained;
    let newLevel = currentLevel;

    const xpPerLevel = 3000;
    if (newXp >= xpPerLevel) {
      newLevel += Math.floor(newXp / xpPerLevel);
      newXp = newXp % xpPerLevel;
      alert(`Félicitations ! Tu passes au Niveau ${newLevel} ! 🎉`);
    }

    await setDoc(profileRef, {
      user_financial_profile: {
        xp: newXp,
        level: newLevel
      }
    }, { merge: true });

    alert('Cours validé ! +50 XP obtenus.');
    window.dispatchEvent(new CustomEvent('learning-course-completed'));
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'XP :", error);
    alert('Une erreur est survenue lors de la validation du cours.');
  } finally {
    finishingLoading.value = false;
  }
};
</script>

<template>
  <main class="heading min-h-screen bg-[#F8FAFB] font-['Inter'] flex items-center justify-center">
    <div class="max-w-7xl w-full bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mt-12">
      
      <header class="bg-gradient-to-r from-[#00AA90] to-[#008F7A] p-6 text-white">
        <div class="flex justify-between items-start">
          <div class="space-y-1">
            <div class="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5">
              <span class="text-xs">⚔️</span>
              <span class="text-[9px] font-black uppercase tracking-wider">Chapitre 1 : Les Fondations</span>
            </div>
            <h1 class="text-2xl font-black tracking-tight">Épargner vs Investir</h1>
          </div>
          <span class="text-3xl">🏺</span>
        </div>

        <p class="text-xs text-teal-50 font-medium italic mt-4 border-l-2 border-white/30 pl-3 max-w-xl leading-relaxed">
          "Confondre les deux, c'est comme confondre un coffre-fort avec une mine d'or. Les deux contiennent de la richesse, mais ils ne servent pas au même usage."
        </p>

        <div class="mt-6 space-y-1.5">
          <div class="flex justify-between text-[10px] font-bold text-teal-100">
            <span>Progression de la leçon</span>
            <span>{{ Math.round((activeLesson / 5) * 100) }}%</span>
          </div>
          <div class="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div 
              class="bg-white h-full rounded-full transition-all duration-500" 
              :style="{ width: `${(activeLesson / 5) * 100}%` }"
            ></div>
          </div>
        </div>
      </header>

      <nav class="flex border-b border-gray-100 overflow-x-auto bg-gray-50/50 scrollbar-none">
        <button 
          v-for="i in 5" :key="i"
          @click="activeLesson = i"
          :class="[
            activeLesson === i ? 'border-[#00AA90] text-[#00AA90] bg-white font-black' : 'border-transparent text-gray-400 font-bold hover:text-gray-600',
            'flex-1 text-center py-3.5 px-4 text-xs border-b-2 whitespace-nowrap transition-all'
          ]"
        >
          Leçon {{ i }}
        </button>
      </nav>

      <div class="p-6 md:p-8 min-h-[360px]">
        
        <div v-if="activeLesson === 1" class="space-y-4 animate-fade-in">
          <h2 class="text-base font-black text-gray-900">Leçon 1 : Épargner (Le Coffre-Fort)</h2>
          <p class="text-xs text-gray-600 leading-relaxed font-medium">
            Épargner consiste à mettre de l'argent de côté pour le <strong class="text-gray-900">protéger</strong>. L'objectif principal est la <strong class="text-[#00AA90]">sécurité</strong>.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div class="bg-teal-50/50 border border-teal-100 p-4 rounded-xl space-y-2">
              <h4 class="text-[10px] font-black text-[#00AA90] uppercase tracking-wider">🎯 Enveloppes types</h4>
              <p class="text-xs font-bold text-gray-700">Livret A, LDDS, Compte épargne</p>
              <h4 class="text-[10px] font-black text-[#00AA90] uppercase tracking-wider pt-1">✅ Avantages</h4>
              <p class="text-xs text-gray-600 font-medium">Argent disponible rapidement, risque quasi nul, capital protégé.</p>
            </div>

            <div class="bg-amber-50/60 border border-amber-200 p-4 rounded-xl space-y-2">
              <h4 class="text-[10px] font-black text-amber-700 uppercase tracking-wider">❌ Les Inconvénients</h4>
              <p class="text-xs text-gray-600 font-medium leading-relaxed">
                Le rendement est faible. À cause de <strong class="text-amber-900">l'inflation</strong>, laisser trop d'argent ici grignote lentement votre pouvoir d'achat au fil des années.
              </p>
            </div>
          </div>

          <div class="bg-gray-50 border border-gray-100 p-3.5 rounded-xl text-xs font-medium text-gray-700">
            <span class="font-black text-gray-900 block mb-1">📝 Exemple concret :</span>
            Tu places <span class="font-bold">1 000 €</span> sur un livret sécurisé. Dans un an, tu récupères tes 1 000 € + les petits intérêts. Ton argent n'a pas beaucoup travaillé, mais il est resté intact.
          </div>
        </div>

        <div v-if="activeLesson === 2" class="space-y-4">
          <h2 class="text-base font-black text-gray-900">Leçon 2 : Investir (La Mine d'Or)</h2>
          <p class="text-xs text-gray-600 leading-relaxed font-medium">
            Investir consiste à injecter son argent dans l'économie pour tenter de le <strong class="text-gray-900">faire grandir</strong>. L'objectif principal est la <strong class="text-indigo-600">croissance</strong>.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div class="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl space-y-2">
              <h4 class="text-[10px] font-black text-indigo-600 uppercase tracking-wider">🎯 Actifs types</h4>
              <p class="text-xs font-bold text-gray-700">Actions, ETF, Obligations, Immobilier</p>
              <h4 class="text-[10px] font-black text-indigo-600 uppercase tracking-wider pt-1">✅ Avantages</h4>
              <p class="text-xs text-gray-600 font-medium">Potentiel de gains bien plus élevé, création d'un vrai patrimoine à long terme.</p>
            </div>

            <div class="bg-red-50/40 border border-red-100 p-4 rounded-xl space-y-2">
              <h4 class="text-[10px] font-black text-red-700 uppercase tracking-wider">❌ Les Inconvénients</h4>
              <p class="text-xs text-gray-600 font-medium leading-relaxed">
                Présence de <strong class="text-red-900">fluctuations</strong> (la bourse monte et descend) et risque réel de perte en capital à court terme.
              </p>
            </div>
          </div>

          <div class="bg-gray-50 border border-gray-100 p-3.5 rounded-xl text-xs font-medium text-gray-700">
            <span class="font-black text-gray-900 block mb-1">📝 Exemple concret :</span>
            Tu investis <span class="font-bold">1 000 €</span> dans un ETF. Après un an, tu as peut-être 1 100 €, ou peut-être 950 € : personne ne peut prédire le court terme. C'est le temps (le long terme) qui valide l'augmentation.
          </div>
        </div>

        <div v-if="activeLesson === 3" class="space-y-4">
          <h2 class="text-base font-black text-gray-900">Leçon 3 : La comparaison simple</h2>
          
          <div class="border border-gray-100 rounded-2xl overflow-hidden shadow-xs bg-white">
            <table class="w-full text-xs text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-gray-500 font-black uppercase text-[10px] tracking-wider border-b border-gray-100">
                  <th class="p-3">Caractéristique</th>
                  <th class="p-3 text-[#00AA90]">🛡️ Épargner</th>
                  <th class="p-3 text-indigo-600">📈 Investir</th>
                </tr>
              </thead>
              <tbody class="font-bold text-gray-700 divide-y divide-gray-50 text-[11px]">
                <tr><td class="p-3 text-gray-400 font-semibold">Objectif</td><td class="p-3 text-[#00AA90]">Sécurité</td><td class="p-3 text-indigo-600">Croissance</td></tr>
                <tr><td class="p-3 text-gray-400 font-semibold">Niveau de Risque</td><td class="p-3">Faible / Nul</td><td class="p-3 text-amber-600">Plus élevé</td></tr>
                <tr><td class="p-3 text-gray-400 font-semibold">Disponibilité</td><td class="p-3">Immédiate</td><td class="p-3">Argent immobilisé</td></tr>
                <tr><td class="p-3 text-gray-400 font-semibold">Rendement</td><td class="p-3">Modéré / Faible</td><td class="p-3 text-emerald-600">Supérieur à long terme</td></tr>
                <tr><td class="p-3 text-gray-400 font-semibold">Horizon Temps</td><td class="p-3 font-medium text-gray-500">Court terme (&lt; 2 ans)</td><td class="p-3 font-medium text-gray-500">Long terme (5 ans +)</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeLesson === 4" class="space-y-5">
          <h2 class="text-base font-black text-gray-900">Leçon 4 : L'ordre intelligent</h2>
          <p class="text-xs text-gray-600 font-medium">
            Erreur classique de débutant : vouloir investir immédiatement sans arrières solides. Voici la chronologie logique :
          </p>

          <div class="space-y-3 relative pl-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-100">
            <div class="bg-white border border-gray-100 p-3 rounded-xl shadow-xs">
              <span class="text-[10px] font-black text-[#00AA90] block uppercase tracking-wide">Étape 1 • Urgences</span>
              <p class="text-xs font-bold text-gray-800">Construire un fonds de précaution (3 à 6 mois de dépenses).</p>
            </div>
            <div class="bg-white border border-gray-100 p-3 rounded-xl shadow-xs">
              <span class="text-[10px] font-black text-[#00AA90] block uppercase tracking-wide">Étape 2 • Projets proches</span>
              <p class="text-xs font-bold text-gray-800">Épargner sur livret pour le court terme (Vacances, auto, déménagement).</p>
            </div>
            <div class="bg-white border border-gray-100 p-3 rounded-xl shadow-xs">
              <span class="text-[10px] font-black text-indigo-500 block uppercase tracking-wide">Étape 3 • Avenir</span>
              <p class="text-xs font-bold text-gray-800">Investir le surplus pour le long terme (Retraite, indépendance, patrimoine).</p>
            </div>
          </div>
        </div>

        <div v-if="activeLesson === 5" class="space-y-4">
          <h2 class="text-base font-black text-gray-900">Leçon 5 : Trouver le bon équilibre</h2>
          <p class="text-xs text-gray-600 font-medium">
            Ajustez le curseur pour simuler la répartition de vos <span class="font-bold">10 000 €</span> et observer l'effet sur votre stratégie :
          </p>

          <div class="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-4">
            <div class="space-y-1">
              <div class="flex justify-between text-[11px] font-black text-gray-500">
                <span>🛡️ Épargne : {{ savingsPercent }}%</span>
                <span>📈 Investissement : {{ 100 - savingsPercent }}%</span>
              </div>
              <input 
                v-model.number="savingsPercent" 
                type="range" min="0" max="100" step="5" 
                class="w-full accent-[#00AA90] h-2 bg-gray-200 rounded-lg cursor-pointer"
              />
            </div>

            <div class="w-full h-4 rounded-xl overflow-hidden flex">
              <div class="bg-[#00AA90] h-full transition-all duration-300" :style="{ width: `${savingsPercent}%` }"></div>
              <div class="bg-[#5B51F4] h-full transition-all duration-300" :style="{ width: `${100 - savingsPercent}%` }"></div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-center text-xs font-black">
              <div class="bg-white p-2.5 rounded-xl border border-teal-50">
                <span class="text-[10px] text-gray-400 block font-bold">MON COFFRE (LIVRET)</span>
                <span class="text-[#00AA90] text-sm">{{ savingsAmount.toLocaleString() }} €</span>
              </div>
              <div class="bg-white p-2.5 rounded-xl border border-indigo-50">
                <span class="text-[10px] text-gray-400 block font-bold">MA MINE (BOURSE/ETF)</span>
                <span class="text-indigo-600 text-sm">{{ investAmount.toLocaleString() }} €</span>
              </div>
            </div>

            <div class="bg-white p-3 rounded-xl border border-gray-100 text-xs">
              <span class="font-black block text-[11px] uppercase tracking-wide" :class="profileStatus.color">
                {{ profileStatus.label }}
              </span>
              <p class="text-gray-500 font-medium mt-0.5 leading-relaxed">{{ profileStatus.desc }}</p>
            </div>
          </div>

          <div class="bg-emerald-50 border border-emerald-100 text-emerald-900 p-3.5 rounded-xl text-[11px] font-medium leading-relaxed">
            🌿 <strong class="text-emerald-950">La règle d'or :</strong> Avant de chercher à faire pousser un arbre, assure-toi d'avoir un toit qui ne fuit pas. L'épargne protège, l'investissement enrichit.
          </div>
        </div>

      </div>

      <footer class="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <button 
          @click="activeLesson > 1 ? activeLesson-- : null" 
          :disabled="activeLesson === 1" 
          class="px-4 py-2 border rounded-xl text-xs font-bold bg-white text-gray-600 disabled:opacity-40 transition-all"
        >
          Précédent
        </button>
        
        <span class="text-[10px] text-gray-400 font-bold italic hidden sm:inline">Construisez d'abord le coffre, puis partez chercher l'or.</span>
        
        <button 
          @click="activeLesson < 5 ? activeLesson++ : handleFinishLesson()"
          :disabled="finishingLoading"
          class="px-4 py-2 rounded-xl bg-[#00AA90] hover:bg-[#008F7A] text-white text-xs font-black shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ finishingLoading ? 'Validation...' : (activeLesson === 5 ? 'Terminer le cours ✓' : 'Continuer →') }}
        </button>
      </footer>

    </div>
  </main>
</template>

<style scoped>
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
.animate-fade-in { animation: fadeIn 0.25s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
</style>