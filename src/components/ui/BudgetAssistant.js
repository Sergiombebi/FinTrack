"use client";
import { useState, useEffect, useRef } from "react";
import { getMonthlyStats, getMonthlyTrends, getBudgets } from "@/lib/database";

export default function BudgetAssistant({ userId, currentMonthExpenses, currentBudget, categories }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Bonjour ! Je suis votre assistant budgétaire. Je peux vous aider à analyser vos dépenses et vous donner des conseils personnalisés. Posez-moi vos questions !",
      sender: "assistant",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [suggestions, setSuggestions] = useState([
    "Comment puis-je réduire mes dépenses ?",
    "Quelle est ma catégorie la plus chère ?",
    "Ai-je dépassé mon budget ce mois-ci ?",
    "Donne-moi des conseils d'économie",
    "Simule une dépense de 5000 FCFA"
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (userId) {
      loadUserStats();
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadUserStats = async () => {
    try {
      const stats = await getMonthlyStats(userId);
      const trends = await getMonthlyTrends(userId, 3);
      const budgets = await getBudgets(userId);
      
      setUserStats({
        currentMonth: stats,
        trends,
        budgets,
        budgetUtilization: currentBudget > 0 ? (currentMonthExpenses / currentBudget) * 100 : 0
      });
    } catch (error) {
      console.error("Erreur lors du chargement des stats:", error);
    }
  };

  const generateResponse = async (userMessage) => {
    const message = userMessage.toLowerCase();
    let response = "";

    // Analyse des dépenses
    if (message.includes("réduire") || message.includes("économiser") || message.includes("diminuer")) {
      response = generateSavingsAdvice();
    }
    // Catégorie la plus chère
    else if (message.includes("catégorie") || message.includes("plus cher") || message.includes("dépense")) {
      response = analyzeMostExpensiveCategory();
    }
    // Budget dépassé
    else if (message.includes("budget") || message.includes("dépassé") || message.includes("dépasse")) {
      response = checkBudgetStatus();
    }
    // Conseils généraux
    else if (message.includes("conseil") || message.includes("astuce") || message.includes("aide")) {
      response = generateGeneralAdvice();
    }
    // Simulation
    else if (message.includes("simule") || message.includes("simulation") || message.includes("si")) {
      response = simulateExpense(userMessage);
    }
    // Analyse globale
    else if (message.includes("analyse") || message.includes("bilan") || message.includes("résumé")) {
      response = generateMonthlyAnalysis();
    }
    else {
      response = generateDefaultResponse();
    }

    return response;
  };

  const generateSavingsAdvice = () => {
    if (!userStats?.currentMonth?.expensesByCategory) {
      return "J'ai besoin de plus de données pour vous donner des conseils personnalisés. Continuez à ajouter vos dépenses et revenez me voir !";
    }

    const expenses = userStats.currentMonth.expensesByCategory;
    const mostExpensive = expenses.reduce((max, cat) => cat.total > max.total ? cat : max, expenses[0]);
    const totalExpenses = userStats.currentMonth.totalExpenses;

    let advice = `💡 **Conseils personnalisés pour économiser :**\n\n`;
    advice += `🎯 **Votre catégorie la plus chère** : ${mostExpensive.name} (${mostExpensive.total.toFixed(2)} FCFA)\n\n`;
    
    if (mostExpensive.name.toLowerCase().includes('transport')) {
      advice += `🚗 **Transport** : Essayez le covoiturage, les transports en commun ou le vélo pour réduire vos coûts de 30-40%.\n`;
    } else if (mostExpensive.name.toLowerCase().includes('alimentation')) {
      advice += `🍔 **Alimentation** : Planifiez vos repas, achetez en vrac et évitez les restaurants pour économiser 20-30%.\n`;
    } else if (mostExpensive.name.toLowerCase().includes('loisir')) {
      advice += `🎮 **Loisirs** : Cherchez des activités gratuites, parcs, ou réductions de groupe pour économiser 50%.\n`;
    } else {
      advice += `💰 **Général** : Fixez une limite mensuelle pour cette catégorie et suivez-la attentivement.\n`;
    }

    advice += `\n📊 **Économie potentielle** : En réduisant cette catégorie de 25%, vous économiserait ${(mostExpensive.total * 0.25).toFixed(2)} FCFA par mois.`;

    return advice;
  };

  const analyzeMostExpensiveCategory = () => {
    if (!userStats?.currentMonth?.expensesByCategory) {
      return "Je n'ai pas encore assez de données pour analyser vos catégories de dépenses.";
    }

    const expenses = userStats.currentMonth.expensesByCategory.sort((a, b) => b.total - a.total);
    const top3 = expenses.slice(0, 3);

    let analysis = `📊 **Vos 3 catégories les plus chères ce mois-ci :**\n\n`;
    
    top3.forEach((cat, index) => {
      const percentage = (cat.total / userStats.currentMonth.totalExpenses * 100).toFixed(1);
      analysis += `${index + 1}. **${cat.name}** : ${cat.total.toFixed(2)} FCFA (${percentage}% du total)\n`;
    });

    analysis += `\n💡 **Conseil** : Concentrez-vous sur la catégorie n°1 pour avoir le plus grand impact sur votre budget.`;

    return analysis;
  };

  const checkBudgetStatus = () => {
    const utilization = userStats?.budgetUtilization || 0;
    
    let status = "";
    if (utilization > 100) {
      status = `⚠️ **ALERTES BUDGET**\n\n`;
      status += `❌ Vous avez dépassé votre budget de ${(utilization - 100).toFixed(1)}% !\n`;
      status += `💸 Dépensé : ${userStats?.currentMonth?.totalExpenses?.toFixed(2) || 0} FCFA\n`;
      status += `🎯 Budget : ${currentBudget.toFixed(2)} FCFA\n`;
      status += `📉 Dépassement : ${((userStats?.currentMonth?.totalExpenses || 0) - currentBudget).toFixed(2)} FCFA\n\n`;
      status += `🚨 **Action immédiate requise** : Arrêtez les dépenses non essentielles ce mois-ci !`;
    } else if (utilization > 80) {
      status = `⚠️ **ATTENTION BUDGET**\n\n`;
      status += `📊 Vous avez utilisé ${utilization.toFixed(1)}% de votre budget\n`;
      status += `💰 Restant : ${(currentBudget - (userStats?.currentMonth?.totalExpenses || 0)).toFixed(2)} FCFA\n`;
      status += `📅 Jours restants : ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()} jours\n\n`;
      status += `💡 **Conseil** : Limitez vos dépenses quotidiennes à ${((currentBudget - (userStats?.currentMonth?.totalExpenses || 0)) / (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate())).toFixed(2)} FCFA par jour.`;
    } else {
      status = `✅ **BONNE NOUVELLE**\n\n`;
      status += `🎉 Vous respectez bien votre budget !\n`;
      status += `📊 Utilisation : ${utilization.toFixed(1)}%\n`;
      status += `💰 Restant : ${(currentBudget - (userStats?.currentMonth?.totalExpenses || 0)).toFixed(2)} FCFA\n\n`;
      status += `🌟 **Excellent travail !** Continuez comme ça !`;
    }

    return status;
  };

  const generateGeneralAdvice = () => {
    let advice = `💡 **CONSEILS D'ÉCONOMIE INTELLIGENTS**\n\n`;
    advice += `🎯 **Règle 50/30/20** :\n`;
    advice += `• 50% pour les besoins essentiels\n`;
    advice += `• 30% pour les envies/personnel\n`;
    advice += `• 20% pour l'épargne\n\n`;
    
    advice += `📱 **Applications utiles** :\n`;
    advice += `• Suivez vos dépenses quotidiennement\n`;
    advice += `• Fixez des alertes de budget\n`;
    advice += `• Comparez vos prix avant d'acheter\n\n`;
    
    advice += `🛒 **Astuces shopping** :\n`;
    advice += `• Faites une liste et respectez-la\n`;
    advice += `• Comparez les prix en ligne\n`;
    advice += `• Achetez en promotion quand possible\n\n`;
    
    advice += `💳 **Gestion carte bancaire** :\n`;
    advice += `• Utilisez le liquide pour les petits achats\n`;
    advice += `• Payez votre carte en fin de mois\n`;
    advice += `• Évitez les découverts`;

    return advice;
  };

  const simulateExpense = (message) => {
    const match = message.match(/(\d+)/);
    const amount = match ? parseInt(match[1]) : 5000;
    
    const newTotal = (userStats?.currentMonth?.totalExpenses || 0) + amount;
    const newUtilization = currentBudget > 0 ? (newTotal / currentBudget) * 100 : 0;
    
    let simulation = `🔮 **SIMULATION DE DÉPENSE**\n\n`;
    simulation += `💰 Montant simulé : ${amount} FCFA\n`;
    simulation += `📊 Total actuel : ${(userStats?.currentMonth?.totalExpenses || 0).toFixed(2)} FCFA\n`;
    simulation += `➕ Nouveau total : ${newTotal.toFixed(2)} FCFA\n\n`;
    
    if (newUtilization > 100) {
      simulation += `⚠️ **ATTENTION** : Cette dépense vous ferait dépasser votre budget de ${(newUtilization - 100).toFixed(1)}% !\n`;
      simulation += `📉 Dépassement : ${(newTotal - currentBudget).toFixed(2)} FCFA\n\n`;
      simulation += `💡 **Suggestion** : Attendez le mois prochain ou réduisez une autre dépense.`;
    } else if (newUtilization > 90) {
      simulation += `⚡ **ALERTE** : Vous utiliseriez ${newUtilization.toFixed(1)}% de votre budget\n`;
      simulation += `💰 Restant : ${(currentBudget - newTotal).toFixed(2)} FCFA\n\n`;
      simulation += `💡 **Conseil** : C'est risqué, assurez-vous d'avoir assez pour le reste du mois.`;
    } else {
      simulation += `✅ **VALIDÉ** : Cette dépense est raisonnable\n`;
      simulation += `📊 Utilisation budget : ${newUtilization.toFixed(1)}%\n`;
      simulation += `💰 Restant après dépense : ${(currentBudget - newTotal).toFixed(2)} FCFA\n\n`;
      simulation += `🌟 **C'est bon !** Vous pouvez faire cette dépense en toute sécurité.`;
    }

    return simulation;
  };

  const generateMonthlyAnalysis = () => {
    if (!userStats?.currentMonth) {
      return "J'ai besoin de plus de données pour faire une analyse complète. Continuez à ajouter vos dépenses !";
    }

    const trends = userStats.trends;
    const currentMonth = userStats.currentMonth;
    const previousMonth = trends.length > 1 ? trends[trends.length - 2] : null;

    let analysis = `📊 **ANALYSE COMPLÈTE DU MOIS**\n\n`;
    
    // Statistiques actuelles
    analysis += `💰 **Dépenses totales** : ${currentMonth.totalExpenses.toFixed(2)} FCFA\n`;
    analysis += `🔢 **Transactions** : ${currentMonth.transactionCount}\n`;
    analysis += `📈 **Moyenne par transaction** : ${(currentMonth.totalExpenses / currentMonth.transactionCount).toFixed(2)} FCFA\n\n`;
    
    // Comparaison avec mois précédent
    if (previousMonth) {
      const expenseDiff = ((currentMonth.totalExpenses - previousMonth.totalExpenses) / previousMonth.totalExpenses * 100);
      const transactionDiff = ((currentMonth.transactionCount - previousMonth.transactionCount) / previousMonth.transactionCount * 100);
      
      analysis += `📅 **COMPARAISON AVEC LE MOIS DERNIER** :\n`;
      analysis += `${expenseDiff > 0 ? '📈' : '📉'} Dépenses : ${Math.abs(expenseDiff).toFixed(1)}% ${expenseDiff > 0 ? 'd\'augmentation' : 'de baisse'}\n`;
      analysis += `${transactionDiff > 0 ? '📈' : '📉'} Transactions : ${Math.abs(transactionDiff).toFixed(1)}% ${transactionDiff > 0 ? 'd\'augmentation' : 'de baisse'}\n\n`;
    }
    
    // Top catégories
    if (currentMonth.expensesByCategory && currentMonth.expensesByCategory.length > 0) {
      const topCategory = currentMonth.expensesByCategory.reduce((max, cat) => cat.total > max.total ? cat : max, currentMonth.expensesByCategory[0]);
      analysis += `🏆 **Catégorie principale** : ${topCategory.name} (${topCategory.total.toFixed(2)} FCFA)\n\n`;
    }
    
    // Recommandations
    analysis += `💡 **RECOMMANDATIONS PERSONNALISÉES** :\n`;
    
    if (userStats.budgetUtilization > 80) {
      analysis += `⚠️ Soyez prudent, votre budget est presque épuisé !\n`;
    } else if (userStats.budgetUtilization < 50) {
      analysis += `✅ Excellente gestion ! Vous pourriez augmenter votre épargne.\n`;
    } else {
      analysis += `👍 Bon équilibre entre dépenses et économies.\n`;
    }

    return analysis;
  };

  const generateDefaultResponse = () => {
    return `🤖 Je peux vous aider avec :\n\n` +
      `💰 **Analyse de vos dépenses**\n` +
      `📊 **Conseils d'économie personnalisés**\n` +
      `🎯 **Suivi de votre budget**\n` +
      `🔮 **Simulations de dépenses**\n` +
      `📈 **Tendances et comparaisons**\n\n` +
      `Essayez de me demander : "Comment puis-je économiser ?" ou "Ai-je dépassé mon budget ?"`;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simuler un temps de réflexion
    await new Promise(resolve => setTimeout(resolve, 1000));

    const responseText = await generateResponse(inputText);
    
    const assistantMessage = {
      id: messages.length + 2,
      text: responseText,
      sender: "assistant",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputText(suggestion);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Bouton flottant */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 flex items-center gap-2"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="font-semibold">Assistant</span>
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="bg-[#080808] border border-white/10 rounded-2xl shadow-2xl w-96 h-[600px] flex flex-col">
          {/* Header */}
          <div className="bg-emerald-500 text-black p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="font-semibold">Assistant Budgétaire</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-black hover:bg-black/10 p-1 rounded"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-xl ${
                    message.sender === 'user'
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <div className="whitespace-pre-line text-sm">{message.text}</div>
                  <div className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-black/60' : 'text-white/60'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div className="p-3 border-t border-white/10">
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Posez votre question..."
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isTyping}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/20 disabled:text-white/40 text-black p-2 rounded-xl transition-colors"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
