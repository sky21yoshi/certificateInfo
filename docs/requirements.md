# certificateInfo

## 要件

- 各サイトから資格の更新情報および詳細情報を収集する
- 収集は一日一回、毎平日実施する
- 対象資格の一覧（No, 認定機関, 資格名, 資格情報取得元）はSpreadSheet([tmp資格情報一覧](https://docs.google.com/spreadsheets/d/1QcS6NJRvvmveI2H31xNifauDQ1A7nmMyuiGFT3xRgO8/edit?usp=sharing))の全レコードから動的に読み込む
- 各資格情報取得元および公式サイトから以下の情報を取得する:
  - E列〜H列: 最新更新日時、タイトル、URL、説明（公式更新情報やページメタ情報）
  - I列〜P列: カテゴリ、試験期間、試験の形態、費用、受験オプション、はじめに（Introduction）、試験内容（Exam content）、試験内容の概要（Content outline）
- 各資格ごとに収集した情報（F列〜P列: タイトル、URL、説明、カテゴリ、試験期間、試験の形態、費用、受験オプション、はじめに、試験内容、試験内容の概要）が前回実行時（シート上の情報）と比較して変更があるか確認する
- F列〜P列のいずれかに変更があった場合:
  - SpreadSheet([tmp資格情報一覧](https://docs.google.com/spreadsheets/d/1QcS6NJRvvmveI2H31xNifauDQ1A7nmMyuiGFT3xRgO8/edit?usp=sharing))の**E列（最終更新日時）に現在日時（JST: yyyy-MM-dd HH:mm）**を設定する
  - 変更のあった各列（タイトル、URL、説明、カテゴリ〜試験内容の概要）を最新情報に更新する
  - Slackの（チャンネル名未定）に更新日時（現在日時）、資格名、タイトル、URL、説明、および変更内容を整形して投稿する
  - Slackの投稿は複数の更新がある場合、それぞれ別々に実施する
