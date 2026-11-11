# certificateInfo

## 概要
このプロジェクトは[tmp資格情報一覧](https://docs.google.com/spreadsheets/d/1QcS6NJRvvmveI2H31xNifauDQ1A7nmMyuiGFT3xRgO8/edit?usp=sharing)の資格情報に変更がある場合、CW-ConsultingのSlackの公開チャンネルに変更された資格情報を投稿する機能を実現する。

## 前提条件・必要な設定
- **Google Sheets プラグイン (`antigravity-plugins-official/plugin/gsheets`)**:
  - 対象資格一覧のスプレッドシートはアクセス権限が管理されているため、AIエージェントから直接スプレッドシートの参照や同期・更新を行うには、Antigravity の **Google Sheets プラグイン** を追加し、対象シートへのアクセス権を持つ Google アカウントでサインイン（連携）する必要があります。

## 取得元
- IPA: [新着情報](https://www.ipa.go.jp/shiken/index.html)
- AWS: [AWS Training and Certification Blog](https://aws.amazon.com/jp/blogs/training-and-certification/feed/)
- AWS_EN: [AWS Training and Certification Blog](https://aws.amazon.com/blogs/training-and-certification/feed/)
- MICROSOFT: [MICROSOFT API CATALOG](https://learn.microsoft.com/api/catalog/)
- LPI: [Linux Professional Institute (LPI)](https://www.lpi.org/feed/)
- LINUC: [お知らせ](https://linuc.org/news/)
- Cisco: [Learn with Cisco 公式RSS](https://blogs.cisco.com/learning/feed)
- Google Cloud: [Training and Certifications 公式記事一覧](https://cloud.google.com/blog/products/training-certifications)
- Oracle: [Oracle University Blog Feed](https://blogs.oracle.com/oracleuniversity/feed)・[新着ニュース](https://www.oracle.com/jp/education/news/)
- Broadcom / VMware: [VMware Certification](https://www.broadcom.com/support/education/vmware/certification)
- CompTIA: [CompTIA Japan Blog](https://www.comptia.org/ja-jp/blog/)
- CNCF / Linux Foundation: [CNCF Blog](https://www.cncf.io/blog/)・[Linux Foundation Education Blog](https://training.linuxfoundation.org/blog/)
- Anthropic: [Claude Academy Courses](https://academy.claude.com/courses)
- UiPath: [UiPath Certification](https://www.uipath.com/ja/learning/certification)
- サーティファイ: [C言語プログラミング能力認定試験](https://www.sikaku.gr.jp/js/cp/)
- Pythonエンジニア育成推進協会: [お知らせRSS](https://pythonic-exam.com/feed/)・[基礎試験](https://www.pythonic-exam.com/exam/basic)・[データ分析試験](https://www.pythonic-exam.com/exam/data-analyst)
- 日本プロジェクトマネジメント協会 (PMAJ): [本年のお知らせ](https://www.pmaj.or.jp/news/news_2026.html)・[前年のお知らせ](https://www.pmaj.or.jp/news/news_2025.html)（取得時点の本年・前年を監視）
- Project Management Institute (PMI): [PMI日本支部 PMP資格・試験情報](https://www.pmi-japan.org/pmp_license/)
- ISACA: [東京支部 (ISACA Engage)](https://engage.isaca.org/tokyochapter)
- PeopleCert: [ITIL Certifications](https://www.peoplecert.org/jp/browse-certifications/it-governance-and-service-management/ITIL-1)
- Fortinet: [認定資格プログラム](https://www.fortinet.com/jp/training-certification)・[NSE認定プログラム改訂情報](https://www.fortinet.com/nse-training-update)
- Palo Alto Networks: [Certification Program](https://www.paloaltonetworks.com/services/education/certification)
- NTTアドバンステクノロジ (NTT-AT): [WinActor認定研修・認定資格](https://winactor.biz/use/winactor_certification.html)

記事URLを一意キーとして監視し、記事一覧がない資格ページはページ内容の指紋を前回状態と比較して更新を検知します。Node.js版では各社の `--provider=<キー>`（例: `node src/index.js --provider=pmi`）で個別実行できます。テストは `node test/additional_fetchers.test.js`、`node test/new_providers.test.js`、`node test/latest_providers.test.js` で実行します。

Anthropicは資格告知専用ページを確認できなかったため、公式Claude Academyのコース一覧を監視対象としています。

NTT-ATの資格一覧記載URL（`/certificate/associate.html`、`/certificate/expert.html`）は公式サイトで404となるため、現行の公式WinActor認定情報ページを監視します。現行ページのCWA認定レベルと一覧記載のアソシエイト／エキスパートの名称は一致しないため、資格情報の対応関係は公式ページで確認してください。

全プロバイダーを実行すると、取得結果をIPA状態ファイルと同じ項目構成（`fiscalYear`、`date`、`title`、`url`、`relatedQualifications`）に正規化して `data/all_state.json` に出力します。`fiscalYear` がない取得元では `null` を設定します。全プロバイダーの取得に失敗がある場合は、統合ファイルを不完全なデータで上書きしません。

GAS版およびNode.js版は、`docs/requirements.md` および `docs/interface.md` に準拠しています：
- **収集頻度**: 一日一回、毎平日（月〜金）に定期実行します（GASでは `setupDailyTrigger` で月〜金の10時JSTトリガーを登録し、実行時にも土日スキップガードを実装）。
- **更新検知**: 各資格ごとに収集した更新情報が前回実行時（シート記載値または前回状態）より新しい情報があるかを確認します。複数の更新候補が同じ資格に関連する場合は、日付が最も新しい情報を反映します。
- **スプレッドシート更新**: `docs/interface.md` の定義（No, 認定機関, 資格名, 資格情報取得元, 最終更新日時, タイトル, URL, 説明）に従い、更新を検知した資格行の「最終更新日時」「タイトル」「URL」「説明」を更新します（ヘッダー「URL」を優先認識し、旧形式の「更新情報URL」にも互換対応）。資格情報取得元などの入力列は保持します。
- **Slack通知**: Slack Webhook（スクリプトプロパティ `SLACK_WEBHOOK_URL` または環境変数 `SLACK_WEBHOOK_URL`）へ、「更新日時」「資格名」「タイトル」「URL」「説明」を整形して投稿します。複数の更新がある場合はそれぞれ別々に投稿します。

スプレッドシートURLはApps Scriptの「プロジェクトの設定」>「スクリプト プロパティ」で `QUALIFICATIONS_SPREADSHEET_URL` に設定できます。未設定時は、上記「tmp資格情報一覧」のURLを使用します。別のタブを使う場合は `QUALIFICATIONS_SHEET_NAME` にシート名を設定してください。毎平日10時（日本時間）に実行するには、Apps Scriptへコードを反映した後、エディタで `setupDailyTrigger` を一度実行して権限を承認します。この関数は既存の同じチェック関数のトリガーを置き換えるため、重複登録されません。テストは `node test/gas_sheet_updates.test.js` および `node test/checker_requirements.test.js` で実行します。また、ローカルTSVは `node scripts/update_tsv.js` で `docs/interface.md` 仕様の8列構成に同期できます。