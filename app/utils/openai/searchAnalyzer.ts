/**
 * Web検索の必要性判定に関する機能
 *
 * このファイルは、AIの初期応答に基づいて、Web検索による情報補完が
 * 必要かどうかを判断する機能を提供します。
 */

/**
 * テキスト内に「情報がない」や「最新の情報がない」などの表現がないかチェックする高精度な判定
 *
 * AIモデルの回答を解析し、Web検索による情報補完が必要かどうかを判断します。
 * AIモデルは訓練データの制限があるため、現在や最新の情報が必要な質問に対しては
 * 補完情報が必要となります。
 *
 * @param text AIの初期応答
 * @returns Web検索が必要かどうか
 */
export function needsWebSearchInfo(text: string): boolean {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // 強いパターン（検索が必要な強い指標）
  const strongPatterns = [
    /私の(知識|情報|データ)(は|が|では)(.{0,10})(まで|更新|制限)/i,
    /私が(持っている|アクセスできる)(情報|データ|知識)(は|が)(.{0,10})(まで|古い|限られて)/i,
    /(\d{4})年(.*?)までの(情報|データ)/i,
    /最新の(情報|データ|アップデート)(が|は)(ない|あり(ません|ません|ません|ません))/i,
    /現時点での正確な(情報|データ)(は|が)(わから|把握|確認でき)/i,
    /私の(トレーニング|学習)(データ|期間)(は|が)(.{0,15})(まで|終了|制限)/i,
    new RegExp(`${currentYear - 1}年(以前|まで)の(情報|データ)`, "i"),
    new RegExp(`${currentYear - 2}年(以前|まで)の(情報|データ)`, "i"),
  ];

  // 中程度のパターン
  const moderatePatterns = [
    /最新の(状況|バージョン|リリース|製品|技術)/i,
    new RegExp(`${currentYear}年(の|における)`, "i"),
    new RegExp(`${currentYear - 1}年以降`, "i"),
    /最近の(傾向|動向|発展|変化)/i,
    /(現在|今)の(市場|状況|標準|規格)/i,
    /正確な(情報|データ)を(得る|確認する)には/i,
    /公式(サイト|ウェブサイト|情報源)で(確認|参照)/i,
    /最新(情報|アップデート)は(.{0,20})(確認|参照)/i,
    /より詳細な(情報|データ)は(.{0,20})(検索|確認)/i,
  ];

  // 除外パターン（検索不要の指標）
  const exclusionPatterns = [
    /詳細な情報をお持ちしています/i,
    /最新のデータによると/i,
    /現在の情報では/i,
    /最新の研究では/i,
    /最近の調査によれば/i,
    /私の知識によれば/i,
    /詳しく説明します/i,
    /具体的な例を挙げると/i,
  ];

  // 年数に関する判定
  const yearMatch = text.match(/(\d{4})年/g);
  if (yearMatch) {
    const years = yearMatch.map((y) => parseInt(y.replace("年", ""), 10));
    const allYearsOld = years.every((y) => y < currentYear - 2);
    const hasFutureYears = years.some((y) => y > currentYear);

    if (allYearsOld && !hasFutureYears) {
      const hasRecentTerms = /最新|最近|現在|今の/.test(text);
      if (!hasRecentTerms) {
        return false;
      }
    }

    if (hasFutureYears) {
      return true;
    }
  }

  // 強いパターンが1つでもマッチすれば検索必要
  if (strongPatterns.some((pattern) => pattern.test(text))) {
    return true;
  }

  // 除外パターンにマッチし、強いパターンにマッチしない場合は検索不要
  if (exclusionPatterns.some((pattern) => pattern.test(text))) {
    return false;
  }

  // 中程度のパターンが2つ以上マッチすれば検索必要
  const moderateMatchCount = moderatePatterns.filter((pattern) =>
    pattern.test(text)
  ).length;
  if (moderateMatchCount >= 2) {
    return true;
  }

  // 短い回答は情報不足の可能性
  if (
    text.length < 100 &&
    /わかりません|不明|確認できません|把握していません/.test(text)
  ) {
    return true;
  }

  // 時間的コンテキスト判定
  const timeContextMatch = text.match(/(\d{4})年(現在|時点)/);
  if (timeContextMatch) {
    const mentionedYear = parseInt(timeContextMatch[1], 10);
    if (mentionedYear < currentYear - 1) {
      return true;
    }
  }

  // 月の判定
  const monthYearMatch = text.match(/(\d{4})年(\d{1,2})月/);
  if (monthYearMatch) {
    const mentionedYear = parseInt(monthYearMatch[1], 10);
    const mentionedMonth = parseInt(monthYearMatch[2], 10);

    if (
      mentionedYear < currentYear - 1 ||
      (mentionedYear === currentYear - 1 && mentionedMonth < currentMonth)
    ) {
      const historicalFactPattern =
        /(発売|設立|創業|創立|開始|発表|公開)(された|した|れた)/;
      if (!historicalFactPattern.test(text)) {
        return true;
      }
    }
  }

  return false;
}
