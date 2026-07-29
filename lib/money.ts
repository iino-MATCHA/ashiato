/** 金額表記。桁区切りは言語に依らず統一する（¥8,500）。 */
export const yen = (n: number) => `¥${Math.round(n).toLocaleString('en-US')}`;
