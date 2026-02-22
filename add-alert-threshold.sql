-- Script pour ajouter la colonne alert_threshold à la table budgets
-- Exécutez ce script dans l'éditeur SQL de Supabase

ALTER TABLE budgets 
ADD COLUMN alert_threshold INTEGER DEFAULT 80 
CHECK (alert_threshold >= 1 AND alert_threshold <= 100);

-- Message de confirmation
SELECT 'Colonne alert_threshold ajoutée avec succès à la table budgets' as message;
