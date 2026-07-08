<script setup>
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="border-t border-gray-200 bg-white/95 backdrop-blur-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p class="text-[11px] font-bold text-gray-500">
          © {{ currentYear }} Finko Labs SAS. Tous droits reserves.
        </p>

        <nav class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-black text-gray-600 uppercase tracking-wider">
          <RouterLink to="/legal" class="hover:text-[#0D9488] transition-colors">Mentions legales</RouterLink>
          <RouterLink to="/legal#confidentialite" class="hover:text-[#0D9488] transition-colors">Politique de confidentialite</RouterLink>
          <RouterLink to="/legal#cookies" class="hover:text-[#0D9488] transition-colors">Cookies</RouterLink>
          <RouterLink to="/legal#cgu" class="hover:text-[#0D9488] transition-colors">CGU</RouterLink>
          <a href="mailto:privacy@finko.fr" class="hover:text-[#0D9488] transition-colors">Contact DPO</a>
        </nav>
      </div>

      <p class="mt-3 text-[10px] text-gray-400 leading-relaxed">
        Finko Labs SAS - 42 rue du Sentier, 75002 Paris - contact@finko.fr.
        Informations legales et RGPD presentes en mode demonstration professionnelle (donnees societaires fictives).
      </p>
    </div>
  </footer>
</template>