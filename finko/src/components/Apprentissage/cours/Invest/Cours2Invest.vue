<script setup>
import { ref, computed } from 'vue';

// Gestion de la leçon active (1 à 6)
const activeLesson = ref(1);

// Variables réactives pour le simulateur interactif (Leçon 2 / Image descriptive)
const pvInput = ref(1000);   // Capital initial (PV)
const rInput = ref(7);       // Taux d'intérêt annuel (r)
const nInput = ref(10);      // Nombre d'années (n)

// Formule financière des intérêts composés : FV = PV * (1 + r)^n
const fvResult = computed(() => {
  const rateDecimal = rInput.value / 100;
  const result = pvInput.value * Math.pow(1 + rateDecimal, nInput.value);
  return Math.round(result * 100) / 100; // Arrondi à 2 décimales
});

// Calcul de la part d'intérêts gagnés seuls
const totalInterestsEarned = computed(() => {
  const diff = fvResult.value - pvInput.value;
  return Math.round(diff * 100) / 100;
});
</script>

<template>
  <main class="heading min-h-screen bg-[#F8FAFB] font-['Inter'] flex items-center justify-center">
    <div class="max-w-7xl w-full bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mt-12">
      
      <header class="bg-gradient-to-r from-[#5B51F4] to-[#473EE0] p-6 text-white">
        <div class="flex justify-between items-start">
          <div class="space-y-1">
            <div class="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5">
              <span class="text-xs">📈</span>
              <span class="text-[9px] font-black uppercase tracking-wider">Chapitre 1 : Les Fondations</span>
            </div>
            <h1 class="text-2xl font-black tracking-tight">Les Intérêts Composés</h1>
          </div>
          <span class="text-3xl">🎋</span>
        </div>

        <p class="text-xs text-indigo-50 font-medium italic mt-4 border-l-2 border-white/30 pl-3 max-w-xl leading-relaxed">
          "Nom d'un sou percé… Voilà le secret que la plupart des gens découvrent trop tard. Les intérêts composés sont un employé qui travaille jour et nuit, sans pause, sans salaire."
        </p>

        <div class="mt-6 space-y-1.5">
          <div class="flex justify-between text-[10px] font-bold text-indigo-100">
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
            activeLesson === i ? 'border-[#5B51F4] text-[#5B51F4] bg-white font-black' : 'border-transparent text-gray-400 font-bold hover:text-gray-600',
            'flex-1 text-center py-3.5 px-4 text-xs border-b-2 whitespace-nowrap transition-all'
          ]"
        >
          Leçon {{ i }}
        </button>
      </nav>

      <div class="p-6 md:p-8 min-h-[360px]">
        
        <div v-if="activeLesson === 1" class="space-y-4 animate-fade-in">
          <h2 class="text-base font-black text-gray-900">Leçon 1 : Qu'est-ce qu'un intérêt ?</h2>
          <p class="text-xs text-gray-600 leading-relaxed font-medium">
            Un intérêt est tout simplement <strong class="text-gray-900">l'argent que ton argent génère</strong> lorsqu'il est placé. 
          </p>

          <div class="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-wide block">Exemple linéaire de base :</span>
            <p class="text-xs font-bold text-gray-700">Tu places 1 000 € à un taux de 5 % par an.</p>
            <div class="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div class="bg-white p-2.5 rounded-xl border border-gray-100">
                <span class="text-[9px] text-gray-400 block font-medium">CAPITAL</span>
                <span class="font-black text-gray-800">1 000 €</span>
              </div>
              <div class="bg-white p-2.5 rounded-xl border border-gray-100">
                <span class="text-[9px] text-gray-400 block font-medium">INTÉRÊTS (5%)</span>
                <span class="font-black text-[#00AA90]">+ 50 €</span>
              </div>
              <div class="bg-white p-2.5 rounded-xl border border-gray-100">
                <span class="text-[9px] text-gray-400 block font-medium">TOTAL AN 1</span>
                <span class="font-black text-indigo-600">1 050 €</span>
              </div>
            </div>
          </div>
          <p class="text-[11px] text-gray-400 font-bold italic text-center">Jusqu'ici, rien de magique. Attends de voir la suite... 👀</p>
        </div>

        <div v-if="activeLesson === 2" class="space-y-4">
          <h2 class="text-base font-black text-gray-900">Leçon 2 : Où apparaît la magie ? (La Capitalisation)</h2>
          <p class="text-xs text-gray-600 leading-relaxed font-medium">
            La deuxième année, tu ne gagnes plus des intérêts seulement sur ton capital de départ. Tu en gagnes sur <span class="font-bold">1 050 €</span>. <strong class="text-gray-900">Les intérêts produisent leurs propres intérêts.</strong>
          </p>

          <div class="bg-gray-900 text-white rounded-2xl p-5 space-y-4 font-mono shadow-sm">
            <div class="text-center text-sm font-bold text-indigo-400 border-b border-white/10 pb-2">
              $$FV = PV \times (1 + r)^n$$
            </div>

            <div class="space-y-3 text-xs">
              <div class="space-y-1">
                <div class="flex justify-between opacity-80"><span>PV (Montant Initial) :</span><span class="text-indigo-300 font-bold">{{ pvInput }} $</span></div>
                <input v-model.number="pvInput" type="range" min="100" max="10000" step="100" class="w-full accent-[#5B51F4]" />
              </div>

              <div class="space-y-1">
                <div class="flex justify-between opacity-80"><span>r (Taux d'intérêt) :</span><span class="text-indigo-300 font-bold">{{ rInput }} %</span></div>
                <input v-model.number="rInput" type="range" min="1" max="20" step="0.1" class="w-full accent-[#5B51F4]" />
              </div>

              <div class="space-y-1">
                <div class="flex justify-between opacity-80"><span>n (Nombre d'années) :</span><span class="text-indigo-300 font-bold">{{ nInput }} ans</span></div>
                <input v-model.number="nInput" type="range" min="1" max="40" step="1" class="w-full accent-[#5B51F4]" />
              </div>
            </div>

            <div class="pt-3 border-t border-white/10 text-center space-y-1">
              <p class="text-[10px] text-gray-400 font-sans">Calcul final automatisé :</p>
              <p class="text-xs md:text-sm text-emerald-400 font-bold tracking-wide">
                $$FV = {{ pvInput }} \times (1 + {{ rInput / 100 }})^{{ nInput }} = {{ fvResult.toLocaleString() }} \text{ €}$$
              </p>
            </div>
          </div>
        </div>

        <div v-if="activeLesson === 3" class="space-y-4">
          <h2 class="text-base font-black text-gray-900">Leçon 3 : L'effet boule de neige étalé</h2>
          <p class="text-xs text-gray-600 font-medium">Regardons la vitesse à laquelle évoluent <span class="font-bold">1 000 €</span> placés à un rendement de <span class="font-bold text-indigo-600">10 % par an</span> sans jamais rien rajouter :</p>
          
          <div class="grid grid-cols-2 gap-2 text-xs font-bold text-gray-700">
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between"><span>Année 1 :</span><span class="text-gray-900">1 100 €</span></div>
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between"><span>Année 2 :</span><span class="text-gray-900">1 210 €</span></div>
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between"><span>Année 3 :</span><span class="text-gray-900">1 331 €</span></div>
            <div class="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex justify-between text-indigo-900 font-black"><span>Année 10 :</span><span>≈ 2 594 €</span></div>
          </div>
          <p class="text-[11px] text-gray-400 font-medium italic text-center">Tu n'as pas injecté un seul centime de plus. Ton argent a simplement fait des petits. ⛄</p>
        </div>

        <div v-if="activeLesson === 4" class="space-y-4">
          <h2 class="text-base font-black text-gray-900">Leçon 4 : Le temps bat le montant</h2>
          <p class="text-xs text-gray-600 leading-relaxed font-medium">
            Beaucoup pensent à tort : <span class="italic">"J'investirai quand je serai riche."</span> Erreur critique. Le temps est le vrai carburant du moteur.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
            <div class="bg-white border border-gray-100 p-4 rounded-xl space-y-1.5 shadow-xs">
              <span class="font-black text-[#00AA90] uppercase text-[10px] tracking-wide block">🏃‍♂️ Investisseur A (Prévoyant)</span>
              <p class="font-bold text-gray-800">Met <span class="text-gray-900">100 € / mois</span> de côté en commençant à <span class="underline">20 ans</span>.</p>
            </div>
            <div class="bg-white border border-gray-100 p-4 rounded-xl space-y-1.5 shadow-xs">
              <span class="font-black text-amber-600 uppercase text-[10px] tracking-wide block">🐢 Investisseur B (Tardif)</span>
              <p class="font-bold text-gray-800">Met <span class="text-gray-900">300 € / mois</span> (3x plus !) en commençant à <span class="underline">35 ans</span>.</p>
            </div>
          </div>
          <div class="bg-indigo-50 border border-indigo-100 text-indigo-900 p-3.5 rounded-xl text-xs font-bold text-center">
            🔥 À l'arrivée, l'Investisseur A finit presque toujours avec un patrimoine supérieur car il a donné plus d'années d'action à la capitalisation.
          </div>
        </div>

        <div v-if="activeLesson === 5" class="space-y-4">
          <h2 class="text-base font-black text-gray-900">Leçon 5 : Les trois leviers d'accélération</h2>
          <p class="text-xs text-gray-600 font-medium">Pour faire grossir ton armée d'euros le plus vite possible, tu as 3 leviers :</p>
          
          <div class="space-y-2 text-xs font-bold">
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-3">
              <span class="text-lg">⏳</span><div><p class="text-gray-900">1. Plus de temps</p><p class="text-[11px] text-gray-400 font-medium">Le levier de loin le plus dévastateur et puissant.</p></div>
            </div>
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-3">
              <span class="text-lg">🪙</span><div><p class="text-gray-900">2. Plus d'argent investi</p><p class="text-[11px] text-gray-400 font-medium">Chaque euro injecté se transforme en un nouvel ouvrier à ton service.</p></div>
            </div>
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-3">
              <span class="text-lg">⚡</span><div><p class="text-gray-900">3. Un meilleur rendement annuel</p><p class="text-[11px] text-gray-400 font-medium">Optimiser tes choix d'enveloppes sans prendre de risques stupides.</p></div>
            </div>
          </div>
        </div>

        <div v-if="activeLesson === 6" class="space-y-4">
          <h2 class="text-base font-black text-gray-900">Leçon 6 : La courbe du bambou</h2>
          <p class="text-xs text-gray-600 leading-relaxed font-medium">
            Les intérêts composés fonctionnent exactement comme un arbre de bambou : au début, la croissance souterraine est <strong class="text-gray-900">lente, frustrante et presque invisible</strong>. Puis, soudainement, elle jaillit de façon spectaculaire.
          </p>

          <div class="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-xl text-xs font-medium leading-relaxed">
            ⚠️ <strong class="text-amber-900">Le piège de l'abandon :</strong> Beaucoup d'investisseurs abandonnent après 2 ou 3 ans car ils ne voient pas de gros changements. Ils quittent le chantier juste avant que le pic de croissance de la mine d'or n'apparaisse.
          </div>

          <div class="bg-teal-50 border border-teal-100 text-teal-900 p-4 rounded-xl text-xs font-bold">
            👑 <strong class="text-teal-950">La règle de Picsou :</strong> L'argent que tu gagnes par ton travail est utile. L'argent qui apprend à faire des petits tout seul à l'infini devient une véritable armée invincible.
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
        
        <span class="text-[10px] text-gray-400 font-bold italic hidden sm:inline">Finko • L'argent qui travaille seul</span>
        
        <button 
          @click="activeLesson < 6 ? activeLesson++ : alert('Félicitations ! Tu as percé le secret des intérêts composés.')" 
          class="px-4 py-2 rounded-xl bg-[#5B51F4] hover:bg-[#473EE0] text-white text-xs font-black shadow-xs transition-all"
        >
          {{ activeLesson === 6 ? 'Terminer ✓' : 'Continuer →' }}
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