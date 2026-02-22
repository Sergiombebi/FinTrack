"use client";
import { useState, useEffect } from "react";
import { getMonthlyStats, getMonthlyTrends } from "@/lib/database";

export default function SmartAlerts({ userId }) {
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  useEffect(() => {
    if (userId) {
      generateSmartAlerts();
    }
  }, [userId]);

  const generateSmartAlerts = async () => {
    try {
      const stats = await getMonthlyStats(userId);
      const trends = await getMonthlyTrends(userId, 2);
      
      const newAlerts = [];

      // Alerte de milieu de mois (vers le 15)
      const currentDay = new Date().getDate();
      if (currentDay >= 14 && currentDay <= 16) {
        const daysRemaining = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - currentDay;
        const dailyBudget = (stats.totalExpenses || 0) / currentDay;
        
        newAlerts.push({
          id: 'mid-month',
          type: 'info',
          title: '📅 Point de milieu de mois',
          message: `Nous sommes le ${currentDay} du mois. Vous avez dépensé en moyenne ${dailyBudget.toFixed(2)} FCFA par jour. Il vous reste ${daysRemaining} jours pour finir le mois.`,
          icon: '📊',
          color: 'bg-blue-500/20 border-blue-500/30 text-blue-400'
        });
      }

      // Alerte de tendance inquiétante
      if (trends.length >= 2) {
        const currentMonth = trends[trends.length - 1];
        const previousMonth = trends[trends.length - 2];
        const increase = ((currentMonth.totalExpenses - previousMonth.totalExpenses) / previousMonth.totalExpenses) * 100;
        
        if (increase > 20) {
          newAlerts.push({
            id: 'worrying-trend',
            type: 'warning',
            title: '📈 Tendance préoccupante',
            message: `Vos dépenses ont augmenté de ${increase.toFixed(1)}% par rapport au mois dernier. C'est peut-être le moment de revoir votre budget !`,
            icon: '⚠️',
            color: 'bg-orange-500/20 border-orange-500/30 text-orange-400'
          });
        }
      }

      // Alerte de dépenses élevées
      if (stats.transactionCount > 0) {
        const avgTransaction = stats.totalExpenses / stats.transactionCount;
        if (avgTransaction > 10000) {
          newAlerts.push({
            id: 'high-transactions',
            type: 'warning',
            title: '💸 Dépenses élevées détectées',
            message: `Votre moyenne par transaction est de ${avgTransaction.toFixed(2)} FCFA. Essayez de faire des achats plus petits et plus fréquents pour mieux contrôler votre budget.`,
            icon: '💳',
            color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
          });
        }
      }

      // Alerte de fin de mois approche
      const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      if (currentDay >= lastDayOfMonth - 3) {
        newAlerts.push({
          id: 'month-end',
          type: 'info',
          title: '🗓️ Fin de mois approche',
          message: `Il ne reste que ${lastDayOfMonth - currentDay} jours ce mois-ci. C'est le moment de vérifier si vous allez respecter votre budget !`,
          icon: '🎯',
          color: 'bg-purple-500/20 border-purple-500/30 text-purple-400'
        });
      }

      // Alerte de weekend (vendredi/samedi)
      const dayOfWeek = new Date().getDay();
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        newAlerts.push({
          id: 'weekend',
          type: 'info',
          title: '🎉 Week-end arrive !',
          message: 'Attention aux dépenses du week-end ! C est souvent là qu on dépense le plus. Fixez-vous une limite pour ces deux jours.',
          icon: '🛍️',
          color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
        });
      }

      setAlerts(newAlerts.filter(alert => !dismissedAlerts.includes(alert.id)));
    } catch (error) {
      console.error("Erreur lors de la génération des alertes:", error);
    }
  };

  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => [...prev, alertId]);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="mb-8 space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`${alert.color} border rounded-xl p-4 flex items-start gap-3`}
        >
          <div className="text-2xl">{alert.icon}</div>
          <div className="flex-1">
            <div className="font-semibold mb-1">{alert.title}</div>
            <div className="text-sm opacity-90">{alert.message}</div>
          </div>
          <button
            onClick={() => dismissAlert(alert.id)}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
