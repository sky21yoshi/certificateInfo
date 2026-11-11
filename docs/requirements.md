# certificateInfo

## 要件

- 各サイトから資格の更新情報を収集する
- 収集は一日一回、毎平日実施する
- 各資格ごとに収集した更新情報が前回実行時より新しい情報があるか確認する
- AWS系およびGoogle Cloud系の試験はスプレッドシートの資格情報取得元からカテゴリ、試験期間、試験の形態、費用、受験オプションを取得、またはExam Guideのページからはじめに（Introduction）、試験内容（Exam content）、試験内容の概要（Content outline）を取得し、いずれかが変更された場合、最終更新日時を更新するとともに、それぞれの内容も更新する
- 新しい情報がある場合
  - SpreadSheet([tmp資格情報一覧](https://docs.google.com/spreadsheets/d/1QcS6NJRvvmveI2H31xNifauDQ1A7nmMyuiGFT3xRgO8/edit?usp=sharing))の更新日時、タイトル、URL、説明を最新の情報に更新する
  - Slackの（チャンネル名未定）に更新日時、資格名、タイトル、URL、説明を整形して投稿する
  - Slackの投稿は複数の更新がある場合、それぞれ別々に実施する
