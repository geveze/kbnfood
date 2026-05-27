import { describe, it, expect } from 'vitest';

// Weighted scoring calculation test
describe('Weighted Scoring System', () => {
  it('should calculate weighted score correctly', () => {
    // Category weights
    const categoryWeights: { [key: string]: number } = {
      'IZGARA / PİŞİRME': 41.5,
      'KASA - PAKET / PAZARYERİ': 12.5,
      'RESTORAN TEMİZLİK VE DÜZEN': 12.5,
      'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ': 15,
      'RESTORAN HİZMET VE KALİTE STANDARTLARI': 17.5
    };

    // Test data: answers with categories
    const answers = [
      // IZGARA / PİŞİRME (41.5%)
      { questionId: 1, earnedPoints: 10, questionPoints: 10, category: 'IZGARA / PİŞİRME' },
      { questionId: 2, earnedPoints: 8, questionPoints: 10, category: 'IZGARA / PİŞİRME' },
      { questionId: 3, earnedPoints: 10, questionPoints: 10, category: 'IZGARA / PİŞİRME' },
      
      // KASA - PAKET / PAZARYERİ (12.5%)
      { questionId: 31, earnedPoints: 10, questionPoints: 10, category: 'KASA - PAKET / PAZARYERİ' },
      { questionId: 32, earnedPoints: 9, questionPoints: 10, category: 'KASA - PAKET / PAZARYERİ' },
      
      // RESTORAN TEMİZLİK VE DÜZEN (12.5%)
      { questionId: 46, earnedPoints: 8, questionPoints: 10, category: 'RESTORAN TEMİZLİK VE DÜZEN' },
      
      // EKİPMAN BAKIMLARI (15%)
      { questionId: 61, earnedPoints: 10, questionPoints: 10, category: 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ' },
      
      // RESTORAN HİZMET (17.5%)
      { questionId: 76, earnedPoints: 9, questionPoints: 10, category: 'RESTORAN HİZMET VE KALİTE STANDARTLARI' }
    ];

    // Calculate category scores
    const categoryScores: { [key: string]: { earned: number; total: number; weight: number } } = {};
    
    for (const answer of answers) {
      const category = answer.category;
      const weight = categoryWeights[category] || 0;
      
      if (!categoryScores[category]) {
        categoryScores[category] = { earned: 0, total: 0, weight };
      }
      
      categoryScores[category].earned += answer.earnedPoints;
      categoryScores[category].total += answer.questionPoints;
    }

    // Calculate weighted total score
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [category, scores] of Object.entries(categoryScores)) {
      if (scores.total > 0) {
        const categoryScore = (scores.earned / scores.total) * 100;
        const weightedScore = (categoryScore * scores.weight) / 100;
        totalScore += weightedScore;
        totalWeight += scores.weight;
      }
    }
    
    // Normalize if total weight is not 100
    if (totalWeight > 0 && totalWeight !== 100) {
      totalScore = (totalScore / totalWeight) * 100;
    }
    
    totalScore = parseFloat(totalScore.toFixed(2));

    // Assertions
    expect(categoryScores['IZGARA / PİŞİRME'].earned).toBe(28);
    expect(categoryScores['IZGARA / PİŞİRME'].total).toBe(30);
    
    expect(categoryScores['KASA - PAKET / PAZARYERİ'].earned).toBe(19);
    expect(categoryScores['KASA - PAKET / PAZARYERİ'].total).toBe(20);
    
    expect(totalScore).toBeGreaterThan(0);
    expect(totalScore).toBeLessThanOrEqual(100);
    expect(totalWeight).toBe(99); // Only 4 categories have answers (missing RESTORAN TEMİZLİK VE DÜZEN is not in answers)
  });

  it('should handle all categories with perfect scores', () => {
    const categoryWeights: { [key: string]: number } = {
      'IZGARA / PİŞİRME': 41.5,
      'KASA - PAKET / PAZARYERİ': 12.5,
      'RESTORAN TEMİZLİK VE DÜZEN': 12.5,
      'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ': 15,
      'RESTORAN HİZMET VE KALİTE STANDARTLARI': 17.5
    };

    // All answers are perfect (earned = total)
    const answers = [
      { questionId: 1, earnedPoints: 10, questionPoints: 10, category: 'IZGARA / PİŞİRME' },
      { questionId: 31, earnedPoints: 10, questionPoints: 10, category: 'KASA - PAKET / PAZARYERİ' },
      { questionId: 46, earnedPoints: 10, questionPoints: 10, category: 'RESTORAN TEMİZLİK VE DÜZEN' },
      { questionId: 61, earnedPoints: 10, questionPoints: 10, category: 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ' },
      { questionId: 76, earnedPoints: 10, questionPoints: 10, category: 'RESTORAN HİZMET VE KALİTE STANDARTLARI' }
    ];

    const categoryScores: { [key: string]: { earned: number; total: number; weight: number } } = {};
    
    for (const answer of answers) {
      const category = answer.category;
      const weight = categoryWeights[category] || 0;
      
      if (!categoryScores[category]) {
        categoryScores[category] = { earned: 0, total: 0, weight };
      }
      
      categoryScores[category].earned += answer.earnedPoints;
      categoryScores[category].total += answer.questionPoints;
    }

    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [category, scores] of Object.entries(categoryScores)) {
      if (scores.total > 0) {
        const categoryScore = (scores.earned / scores.total) * 100;
        const weightedScore = (categoryScore * scores.weight) / 100;
        totalScore += weightedScore;
        totalWeight += scores.weight;
      }
    }
    
    if (totalWeight > 0 && totalWeight !== 100) {
      totalScore = (totalScore / totalWeight) * 100;
    }
    
    totalScore = parseFloat(totalScore.toFixed(2));

    // Perfect score should be 100
    expect(totalScore).toBe(100);
  });

  it('should handle all categories with zero scores', () => {
    const categoryWeights: { [key: string]: number } = {
      'IZGARA / PİŞİRME': 41.5,
      'KASA - PAKET / PAZARYERİ': 12.5,
      'RESTORAN TEMİZLİK VE DÜZEN': 12.5,
      'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ': 15,
      'RESTORAN HİZMET VE KALİTE STANDARTLARI': 17.5
    };

    // All answers are zero (earned = 0)
    const answers = [
      { questionId: 1, earnedPoints: 0, questionPoints: 10, category: 'IZGARA / PİŞİRME' },
      { questionId: 31, earnedPoints: 0, questionPoints: 10, category: 'KASA - PAKET / PAZARYERİ' },
      { questionId: 46, earnedPoints: 0, questionPoints: 10, category: 'RESTORAN TEMİZLİK VE DÜZEN' },
      { questionId: 61, earnedPoints: 0, questionPoints: 10, category: 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ' },
      { questionId: 76, earnedPoints: 0, questionPoints: 10, category: 'RESTORAN HİZMET VE KALİTE STANDARTLARI' }
    ];

    const categoryScores: { [key: string]: { earned: number; total: number; weight: number } } = {};
    
    for (const answer of answers) {
      const category = answer.category;
      const weight = categoryWeights[category] || 0;
      
      if (!categoryScores[category]) {
        categoryScores[category] = { earned: 0, total: 0, weight };
      }
      
      categoryScores[category].earned += answer.earnedPoints;
      categoryScores[category].total += answer.questionPoints;
    }

    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [category, scores] of Object.entries(categoryScores)) {
      if (scores.total > 0) {
        const categoryScore = (scores.earned / scores.total) * 100;
        const weightedScore = (categoryScore * scores.weight) / 100;
        totalScore += weightedScore;
        totalWeight += scores.weight;
      }
    }
    
    if (totalWeight > 0 && totalWeight !== 100) {
      totalScore = (totalScore / totalWeight) * 100;
    }
    
    totalScore = parseFloat(totalScore.toFixed(2));

    // Zero score should be 0
    expect(totalScore).toBe(0);
  });
});
