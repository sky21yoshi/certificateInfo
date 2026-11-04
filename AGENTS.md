# AGENTS.md - certificateInfo プロジェクト規約

このドキュメントは、本リポジトリ（`certificateInfo`）で作業を行うすべての AI エージェントに対する指針、行動規範、開発ルールを定義したものです。

---

## 1. プロジェクト概要

- **リポジトリ名**: `certificateInfo`
- **目的**:
  - `README.md` に記載されたGoogleスプレッドシート（[【公開版】対象資格一覧](https://docs.google.com/spreadsheets/d/1tZbstgdxA83mrdE6w41AwAfezmEVsAELs0PGDdrQQGg/edit?usp=drive_link)）を対象資格一覧のマスターデータとして参照する。
  - リストされた資格について、IPA（独立行政法人 情報処理推進機構）の公式サイト等から資格情報（試験日程、申込期間、シラバス、新着情報等）を定期的に取得・監視する。
  - 資格情報に変更や更新が検知された場合、CW-Consulting の Slack 公開チャンネルに変更内容を自動投稿・通知する。

---

## 2. エージェントの行動規範

1. **言語設定**:
   - ユーザーとの対話、コミットメッセージ、ドキュメント、コード内コメント・docstring は原則として**日本語**で記述してください。
   - 変数名・関数名・クラス名などの識別子は標準的な**英語**（キャメルケース / スネークケースなど）を使用してください。
2. **スクレイピングマナーと負荷配慮**:
   - 公的機関のWebサイト（IPA等）へのアクセス時は、サーバー負荷を最小限に抑えるため、過度なリクエストを避けてください（アクセス間隔を最低1〜2秒以上空ける、定期実行頻度は1日1回〜数時間に1回程度に設定）。
   - 明示的な User-Agent ヘッダーを設定してください。
3. **安全性の重視**:
   - 認証情報（Google Workspace サービスアカウント秘密鍵、OAuth トークン、Webhook URL など）は絶対にコード内に直接埋め込まず、環境変数や Google Apps Script の `ScriptProperties`、GitHub Secrets などを利用して管理してください。
4. **段階的な提案と確認**:
   - 大規模な仕様変更、新しい外部ライブラリの導入、データ設計の決定を行う前に、ユーザーに方針を提示して確認をとってください。

---

## 3. 推奨アーキテクチャ & 技術スタック

プロジェクトのユースケースに応じて以下のいずれか、または組み合わせを採用します：

- **Google Workspace 連携 (GAS ベース)**:
  - 言語: JavaScript / TypeScript (Clasp)
  - 実行形態: 時間主導型トリガー（Time-driven triggers）による定期実行
  - 主な役割: 対象資格一覧スプレッドシートの参照、`UrlFetchApp` によるHTML取得・更新差分検知、Slack Webhook への変更通知
- **スクリプト / CLI ツール (Python または Node.js ベース)**:
  - 言語: Python (`requests`, `beautifulsoup4`, `pydantic` 等) または Node.js (`axios`, `cheerio` 等)
  - 実行環境: GitHub Actions (Cron ワークフロー)、Cloud Functions / Cloud Run
  - 主な役割: 対象資格一覧の取得（Google Sheets API / 共有CSV）、資格情報のスクレイピング、Slack API / Webhook への差分投稿

---

## 4. コーディング規約 & データ設計

- **エラーハンドリング & 耐障害性**:
  - 対象サイトのHTML構造変更（リニューアル・セレクタ変更）やネットワークエラー、一時的なタイムアウトに備え、例外処理を適切に実装し、エラー発生時はログ出力を確実に行ってください。
- **日付・タイムゾーン**:
  - 試験申込期間や試験実施日、合格発表日などの日付データは原則として**日本時間（JST: UTC+9）**を基準として正規化（例: `YYYY-MM-DD` または ISO 8601 形式）して扱ってください。
- **データ構造化**:
  - 取得した資格情報は、再利用しやすいようにモジュール化・型定義（TypeScript型定義やPythonのデータクラス/Pydanticモデル）を行ってください。
  ```json
  {
    "category": "応用情報技術者試験 (AP)",
    "targetExam": "令和X年秋期試験",
    "applicationPeriod": { "start": "202X-07-XX", "end": "202X-08-XX" },
    "examDate": "202X-10-XX",
    "resultDate": "202X-12-XX",
    "officialUrl": "https://www.ipa.go.jp/shiken/kubun/ap.html"
  }
  ```

---

## 5. Git & コミット規約

- **コミットメッセージ**:
  - Conventional Commits（`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:` など）に準拠し、コミットの概要を簡潔な日本語で記載してください。
  ```text
  feat: IPA試験日程ページのスクレイピング機能を追加
  fix: 試験お知らせ一覧のHTMLパース処理のセレクタ修正
  docs: AGENTS.md の資格情報取得プロジェクト向け再作成
  ```
- **コミット前のチェック**:
  - フォーマッター・リンターのエラーがないこと、テストまたは実行確認が行われていることを確認してください。
