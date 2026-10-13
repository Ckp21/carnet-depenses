// Configuration Supabase.
// Renseigne l'URL du projet et la clé publique (anon / publishable), visibles dans
// Supabase > Project Settings > API. La clé publique peut être publiée : tes données
// restent protégées par ton mot de passe et les règles de sécurité de la base.
// Ne mets JAMAIS la clé service_role ici.
window.CARNET_CONFIG = {
  SUPABASE_URL: "https://btadceaowokrvubaaiui.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YWRjZWFvd29rcnZ1YmFhaXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTQ5MzIsImV4cCI6MjEwNzQ3MDkzMn0.MEaNp1DQ6zTXm6BmFAvPXvulSYk_knYzMMlkPeZJveE",
  // Clé publique des rappels (Web Push). Elle peut être publiée ; la clé privée correspondante reste dans les secrets Supabase.
  VAPID_PUBLIC_KEY: "BAfMXrGQbd1E5B6Q7GDwS8aH66oVeE3-7O7nV_3M66HM8aSrTcRbP2lKlJtcFbHaQfaalg2DN4V8JTjU3cGEB2Y"
};
