<script setup>
import { ref, computed } from 'vue';

// Gestion de la leçon active (1 à 6)
const activeLesson = ref(1);

// Modèles réactifs pour l'exercice de calcul (Leçon 6)
const essentialExpenses = ref(1500);
const monthlyContribution = ref(200);
const targetMonths = ref(3); // Choix entre 3 et 6 mois

// Calcul dynamique du plan d'action
const totalGoal = computed(() => essentialExpenses.value * targetMonths.value);
const monthsNeeded = computed(() => {
  if (monthlyContribution.value <= 0) return 0;
  return Math.ceil(totalGoal.value / monthlyContribution.value);
});
</script>

<template>
  <main class="min-h-screen bg-[#F8FAFB] p-4 md:p-8 font-['Inter'] flex items-center justify-center">
    <div class="max-w-3xl w-full bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mt-12">
      
      <header class="bg-gradient-to-r from-[#00AA90] to-[#008F7A] p-6 text-white relative">
        <div class="flex justify-between items-start">
          <div class="space-y-1">
            <div class="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5">
              <span class="text-xs">🛡️</span>
              <span class="text-[9px] font-black uppercase tracking-wider">Chapitre 1 : Les Fondations</span>
            </div>
            <h1 class="text-2xl font-black tracking-tight">Le fonds d'urgence</h1>
          </div>
          <span class="text-3xl">⚓</span>
        </div>

        <p class="text-xs text-teal-50 font-medium italic mt-4 border-l-2 border-white/30 pl-3 max-w-xl leading-relaxed">
          "Avant de chercher un trésor, un aventurier prépare ses réserves. Quand la tempête arrive, ce n'est pas le moment de courir acheter une bouée."
        </p>

        <div class="mt-6 space-y-1.5">
          <div class="flex justify-between text-[10px] font-bold text-teal-100">
            <span>Progression de la leçon</span>
            <span>{{ Math.round((activeLesson / 6) * 100) }}%</span>
          </div>
          <div class="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div 
              class="bg-white h-full rounded-full transition-all duration-500" 
              :style="{ width: `${(activeLesson / 6) * 100}%` }"
            ></div>
          </div>
        </div>
      </header>

      <nav class="flex border-b border-gray-100 overflow-x-auto bg-gray-50/50 scrollbar-none">
        <button 
          v-for="i in 6" :key="i"
          @click="activeLesson = i"
          :class="[
            activeLesson === i ? 'border-[#00AA90] text-[#00AA90] bg-white font-black' : 'border-transparent text-gray-400 font-bold hover:text-gray-600',
            'flex-1 text-center py-3.5 px-4 text-xs border-b-2 whitespace-nowrap transition-all'
          ]"
        >
          Léçon {{ i }}
        </button>
      </nav>

      <div class="p-6 md:p-8 min-h-[360px]">
        
        <div v-if="activeLesson === 1" class="space-y-5 animate-fade-in">
          <h2 class="text-lg font-black text-gray-900">Leçon 1 : Qu'est-ce qu'un fonds d'urgence ?</h2>
          <p class="text-sm text-gray-600 leading-relaxed font-medium">
            Le fonds d'urgence est une réserve d'argent dont le seul rôle est de <strong class="text-gray-900">te protéger des imprévus.</strong>
          </p>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div v-for="item in [{i:'🚗',t:'Panne de voiture'}, {i:'🏥',t:'Santé'}, {i:'🛠️',t:'Réparation'}, {i:'💼',t:'Perte d\'emploi'}, {i:'📦',t:'Déménagement'}, {i:'🧾',t:'Facture'}]" :key="item.t" class="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
              <span class="text-xl block mb-1">{{ item.i }}</span>
              <p class="text-[10px] font-black text-gray-800 uppercase tracking-tight">{{ item.t }}</p>
            </div>
          </div>

          <div class="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
            <span class="text-lg">🚫</span>
            <p class="text-xs font-bold text-red-800">Cet argent n'est pas là pour les vacances, ni pour le dernier téléphone à la mode. Il est là pour les coups durs.</p>
          </div>
        </div>

        <div v-if="activeLesson === 2" class="space-y-5">
          <h2 class="text-lg font-black text-gray-900">Leçon 2 : Combien faut-il avoir ?</h2>
          <p class="text-sm text-gray-600 font-medium">La règle classique : <strong class="text-[#00AA90]">3 à 6 mois de dépenses essentielles.</strong></p>
          
          <div class="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="text-gray-400 font-bold border-b border-gray-200"><th class="pb-2">Poste</th><th class="pb-2 text-right">Montant</th></tr>
              </thead>
              <tbody class="font-bold text-gray-700">
                <tr class="border-b border-gray-100"><td class="py-2 text-gray-500 italic">Logement / Nourriture / Factures</td><td class="py-2 text-right">1 500 €</td></tr>
                <tr class="text-[#00AA90] font-black">
                  <td class="pt-3">Objectif 3 mois</td><td class="pt-3 text-right">4 500 €</td>
                </tr>
                <tr class="text-[#00AA90] font-black">
                  <td class="pt-1">Objectif 6 mois</td><td class="pt-1 text-right">9 000 €</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-gray-400 font-bold text-center">Voilà votre coffre de sécurité. 🛡️</p>
        </div>

        <div v-if="activeLesson === 3" class="space-y-5">
          <h2 class="text-lg font-black text-gray-900">Leçon 3 : Où garder cet argent ?</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-teal-50 border border-teal-100 p-4 rounded-2xl space-y-3">
              <h4 class="text-xs font-black text-[#00AA90] uppercase tracking-wider">✅ Bonnes options</h4>
              <ul class="text-xs font-bold text-gray-700 space-y-2">
                <li>• Livret A</li>
                <li>• LDDS</li>
                <li>• Compte épargne disponible</li>
              </ul>
              <p class="text-[10px] text-[#00AA90] italic font-medium">Accessible rapidement.</p>
            </div>
            <div class="bg-red-50 border border-red-100 p-4 rounded-2xl space-y-3">
              <h4 class="text-xs font-black text-red-800 uppercase tracking-wider">❌ Mauvaises options</h4>
              <ul class="text-xs font-bold text-gray-700 space-y-2">
                <li>• Actions</li>
                <li>• Cryptomonnaies</li>
                <li>• Placements bloqués</li>
              </ul>
              <p class="text-[10px] text-red-800 italic font-medium">Risqué ou trop long à retirer.</p>
            </div>
          </div>
        </div>

        <div v-if="activeLesson === 4" class="space-y-5">
          <h2 class="text-lg font-black text-gray-900">Leçon 4 : Construire progressivement</h2>
          <p class="text-sm text-gray-600 font-medium leading-relaxed">
            Par les moustaches de Scrooge ! Peu de gens mettent 5 000 € de côté d'un coup. <strong class="text-gray-900">On avance pièce par pièce.</strong>
          </p>
          
          <div class="space-y-3">
            <div v-for="step in [{a:'100€ / mois', t:'Rythme tranquille'}, {a:'200€ / mois', t:'Rythme modéré'}, {a:'300€ / mois', t:'Rythme rapide'}]" :key="step.a" class="bg-white border border-gray-100 p-4 rounded-xl flex justify-between items-center shadow-xs">
              <span class="text-xs font-black text-gray-800">{{ step.a }}</span>
              <span class="text-[10px] font-bold text-gray-400 uppercase">{{ step.t }}</span>
            </div>
          </div>

          <div class="bg-[#FFF9E6] border border-[#FFE4A3] p-4 rounded-xl text-center">
            <p class="text-xs font-black text-gray-800 italic">"Un euro épargné chaque semaine vaut mieux qu'un grand plan abandonné après quinze jours."</p>
          </div>
        </div>

        <div v-if="activeLesson === 5" class="space-y-5">
          <h2 class="text-lg font-black text-gray-900">Leçon 5 : Les étapes du fonds</h2>
          <div class="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            <div v-for="(level, idx) in [{t:'Niveau 1 : 500 €', d:'Première protection pour les petits accidents.'}, {t:'Niveau 2 : 1 000 €', d:'Tu respires. Les urgences courantes sont couvertes.'}, {t:'Niveau 3 : 3 mois', d:'Tu es solide. Une perte de revenus devient gérable.'}, {t:'Niveau 4 : 6 mois', d:'Forteresse. Les tempêtes se traversent sans panique.'}]" :key="idx" class="relative">
              <div class="absolute -left-[25px] top-1 w-3 h-3 bg-[#00AA90] rounded-full border-2 border-white"></div>
              <h4 class="text-xs font-black text-gray-900">{{ level.t }}</h4>
              <p class="text-[11px] text-gray-500 font-medium">{{ level.d }}</p>
            </div>
          </div>
        </div>

        <div v-if="activeLesson === 6" class="space-y-5">
          <h2 class="text-lg font-black text-gray-900">Exercice : Calcule ton plan</h2>
          
          <div class="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dépenses essentielles / mois</label>
                <div class="flex items-center gap-2 border-b border-gray-200 pb-1">
                  <input v-model.number="essentialExpenses" type="number" class="bg-transparent font-black text-sm w-full outline-none" />
                  <span class="font-bold">€</span>
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Épargne mensuelle possible</label>
                <div class="flex items-center gap-2 border-b border-gray-200 pb-1">
                  <input v-model.number="monthlyContribution" type="number" class="bg-transparent font-black text-sm w-full outline-none" />
                  <span class="font-bold">€</span>
                </div>
              </div>
            </div>

            <div class="flex justify-center gap-4">
              <button @click="targetMonths = 3" :class="targetMonths === 3 ? 'bg-[#00AA90] text-white' : 'bg-white text-gray-500 border border-gray-100'" class="px-4 py-2 rounded-xl text-[10px] font-black transition-all">OBJECTIF 3 MOIS</button>
              <button @click="targetMonths = 6" :class="targetMonths === 6 ? 'bg-[#00AA90] text-white' : 'bg-white text-gray-500 border border-gray-100'" class="px-4 py-2 rounded-xl text-[10px] font-black transition-all">OBJECTIF 6 MOIS</button>
            </div>

            <div class="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
              <div class="space-y-1">
                <span class="text-[10px] font-bold text-gray-400 uppercase">Cible à atteindre</span>
                <p class="text-lg font-black text-gray-900">{{ totalGoal.toLocaleString() }} €</p>
              </div>
              <div class="text-right space-y-1">
                <span class="text-[10px] font-bold text-gray-400 uppercase">Durée estimée</span>
                <p class="text-lg font-black text-[#00AA90]">{{ monthsNeeded }} mois</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <footer class="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <button 
          @click="activeLesson > 1 ? activeLesson-- : null"
          :disabled="activeLesson === 1"
          class="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 transition-all"
        >
          Précédent
        </button>

        <div class="text-center text-[10px] font-bold text-gray-400 hidden sm:block uppercase tracking-widest">
          Finko • Sécurité Financière
        </div>

        <button 
          @click="activeLesson < 6 ? activeLesson++ : alert('Félicitations ! Votre forteresse est en route.')"
          class="px-5 py-2.5 rounded-xl bg-[#00AA90] hover:bg-[#008F7A] text-white text-xs font-black shadow-xs transition-all"
        >
          {{ activeLesson === 6 ? 'Terminer le cours ✓' : 'Continuer →' }}
        </button>
      </footer>

    </div>
  </main>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
</style>