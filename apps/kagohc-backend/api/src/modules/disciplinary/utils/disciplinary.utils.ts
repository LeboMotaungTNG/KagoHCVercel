export class DisciplinaryUtils {
  static generateCaseNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000);
    return `DISC-${year}-${random.toString().padStart(4, '0')}`;
  }
  
  static calculateSeverityScore(category: string, history: any[]): number {
    const weights: Record<string, number> = {
      'gross': 10,
      'serious': 7,
      'moderate': 4,
      'minor': 1
    };
    
    let score = 0;
    if (history.length > 0) {
      score += history.length * 2;
    }
    
    return score;
  }
  
  static validateHearingTime(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
  
  static formatDate(date: Date): string {
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  static getAppealDeadline(sanctionDate: Date): Date {
    const deadline = new Date(sanctionDate);
    deadline.setDate(deadline.getDate() + 7);
    return deadline;
  }
  
  static sanitizeDescription(description: string): string {
    return description.trim().replace(/\s+/g, ' ');
  }
}
