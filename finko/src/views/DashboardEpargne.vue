<script setup> 
import BilanEpargne from '@/components/epargne/BilanEpargne.vue';
import PyramideEpargne from '@/components/epargne/PyramideEpargne.vue';
import ObjectifEpargne from '@/components/epargne/ObjectifEpargne.vue';
import GraphEpargne from '@/components/epargne/GraphEpargne.vue';
import InvestEpargne from '@/components/epargne/InvestEpargne.vue';
</script>

<template>
  <div class="p-8 bg-[#F8FAFB] min-h-screen flex flex-col gap-10">
    
    <section>
      <InvestEpargne />
    </section>
    <section>
      <BilanEpargne />
    </section>
    <section>
      <GraphEpargne />
    </section>
    <section>
      <ObjectifEpargne />
    </section>
    <section>
      <PyramideEpargne />
    </section>

  </div>
</template>

<style scoped>
/* Retire tout ce qui contient "align-items: center" ou "justify-content: center" sur .about */
</style>