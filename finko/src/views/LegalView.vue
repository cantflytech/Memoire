<template>
  <main class="bg-[#F8FAFC] min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-['Inter'] heading">
    <div class="max-w-4xl mx-auto bg-white border border-gray-100 rounded-[24px] p-6 sm:p-8 shadow-sm space-y-8">
      <header class="space-y-3">
        <p class="text-[10px] font-black uppercase tracking-wider text-[#0D9488]">Conformite et transparence</p>
        <h1 class="text-2xl sm:text-3xl font-black text-gray-900">Informations legales et RGPD</h1>
        <p class="text-sm text-gray-600 leading-relaxed">
          Cette page presente les informations essentielles relatives au traitement des donnees personnelles.
          Les informations ci-dessous sont des donnees fictives de demonstration, redigees dans un format professionnel.
        </p>
      </header>

      <section id="mentions-legales" class="space-y-2">
        <h2 class="text-lg font-black text-gray-900">Mentions legales</h2>
        <div class="text-sm text-gray-700 leading-relaxed space-y-1">
          <p><strong>Editeur:</strong> Finko Labs</p>
          <p><strong>Forme:</strong> SAS au capital de 120 000 EUR</p>
          <p><strong>SIREN:</strong> 912 345 678 (RCS Paris)</p>
          <p><strong>TVA intracommunautaire:</strong> FR89 912345678</p>
          <p><strong>Adresse:</strong> 42 rue du Sentier, 75002 Paris, France</p>
          <p><strong>Email:</strong> contact@finko.fr</p>
          <p><strong>Directeur de publication:</strong> Camille Morel, President</p>
          <p><strong>Hebergeur:</strong> Google Firebase Hosting, Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande.</p>
        </div>
      </section>

      <section id="confidentialite" class="space-y-2">
        <h2 class="text-lg font-black text-gray-900">Politique de confidentialite (RGPD)</h2>
        <div class="text-sm text-gray-700 leading-relaxed space-y-2">
          <p><strong>Responsable du traitement:</strong> Finko Labs, SAS immatriculee a Paris, joignable a privacy@finko.fr</p>
          <p><strong>Donnees collectees:</strong> email, informations de profil financier saisies par l utilisateur, donnees d activite dans l application.</p>
          <p><strong>Finalites:</strong> creation du compte, acces aux services Finko, suivi pedagogique, pilotage epargne/investissement, securisation de la plateforme.</p>
          <p><strong>Base legale:</strong> execution du contrat (fourniture du service), interet legitime (securite et amelioration produit), consentement lorsque requis.</p>
          <p><strong>Duree de conservation:</strong> donnees de compte conservees pendant la duree d activite du compte, puis 36 mois en archivage intermediaire avant suppression/anonymisation.</p>
          <p><strong>Destinataires:</strong> equipes internes autorisees et sous-traitants techniques necessaires (ex: Firebase/Google Cloud).</p>
          <p><strong>Transferts hors UE:</strong> certains traitements peuvent impliquer des transferts hors UE, encadres par les Clauses Contractuelles Types de la Commission europeenne.</p>
        </div>
      </section>

      <section id="droits-rgpd" class="space-y-2">
        <h2 class="text-lg font-black text-gray-900">Vos droits RGPD</h2>
        <div class="text-sm text-gray-700 leading-relaxed space-y-2">
          <p>Vous disposez des droits suivants: acces, rectification, effacement, limitation, opposition, portabilite, retrait du consentement.</p>
          <p>Pour exercer vos droits: contactez <a href="mailto:privacy@finko.fr" class="text-[#0D9488] font-black hover:underline">privacy@finko.fr</a> ou ecrivez a DPO - Finko Labs, 42 rue du Sentier, 75002 Paris.</p>
          <p>Delai de reponse: 30 jours maximum a compter de la reception d une demande complete.</p>
          <p>En cas de litige, vous pouvez egalement introduire une reclamation aupres de la CNIL.</p>
        </div>
      </section>

      <section id="cookies" class="space-y-2">
        <h2 class="text-lg font-black text-gray-900">Politique cookies</h2>
        <div class="text-sm text-gray-700 leading-relaxed space-y-2">
          <p><strong>Cookies strictement necessaires:</strong> gestion de session, securite de connexion, preferences techniques (duree maximale 13 mois).</p>
          <p><strong>Mesure d audience:</strong> deposee uniquement apres consentement, avec conservation des consentements pendant 6 mois.</p>
          <p><strong>Gestion des choix:</strong> l utilisateur peut accepter, refuser ou modifier ses preferences cookies a tout moment depuis le bandeau de consentement.</p>
        </div>
      </section>

      <section id="cgu" class="space-y-2">
        <h2 class="text-lg font-black text-gray-900">Conditions generales d utilisation (CGU)</h2>
        <div class="text-sm text-gray-700 leading-relaxed space-y-2">
          <p>Finko fournit des outils d education et d aide au pilotage financier. Les contenus ne constituent pas un conseil en investissement personnalise.</p>
          <p>L utilisateur reste responsable de ses decisions financieres et de la sincerite des donnees saisies.</p>
          <p>Les contenus, marques et elements graphiques de Finko sont proteges par le droit de la propriete intellectuelle. Toute reproduction non autorisee est interdite.</p>
          <p>Droit applicable: droit francais. Juridiction competente: tribunaux du ressort de la Cour d appel de Paris, sauf disposition legale imperative contraire.</p>
        </div>
      </section>

      <section class="rounded-xl bg-amber-50 border border-amber-200 p-4">
        <p class="text-xs font-bold text-amber-800 leading-relaxed">
          Note: les informations d identite de societe ci-dessus sont fictives (mode demo). 
        </p>
      </section>
    </div>
  </main>
</template>