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

スプレッドシートの詳細列（カテゴリ、試験時間・形式、費用、受験方法、概要、試験内容、出題範囲）は、AWS・Google Cloud以外についても資格情報取得元の公式ページから認定機関別の項目名・見出しを使って抽出します。全ページへのアクセスを避けるため、対象URLを5日間に分けて確認し、ページに明記された値だけを記録します。項目が見つからない場合や取得に失敗した場合は既存値を消去せず、通常のお知らせ欄（最終更新日時、タイトル、URL、説明）も詳細情報の更新だけでは上書きしません。

Anthropicは資格告知専用ページを確認できなかったため、公式Claude Academyのコース一覧を監視対象としています。

NTT-ATの資格一覧記載URL（`/certificate/associate.html`、`/certificate/expert.html`）は公式サイトで404となるため、現行の公式WinActor認定情報ページを監視します。現行ページのCWA認定レベルと一覧記載のアソシエイト／エキスパートの名称は一致しないため、資格情報の対応関係は公式ページで確認してください。

全プロバイダーを実行すると、取得結果を共通項目（`fiscalYear`、`date`、`title`、`url`、`description`、詳細8項目、`relatedQualifications`）に正規化して `data/all_state.json` に出力します。取得元に該当する情報がない項目は空文字列、`fiscalYear` がない場合は `null` を設定します。全プロバイダーの取得に失敗がある場合は、統合ファイルを不完全なデータで上書きしません。

GAS版およびNode.js版は、`docs/requirements.md` および `docs/interface.md` に準拠しています：
- **収集頻度**: 一日一回、毎平日（月〜金）に定期実行します（GASでは `setupDailyTrigger` で月〜金の10時JSTトリガーを登録し、実行時にも土日スキップガードを実装）。
- **更新検知**: 各資格ごとに収集した更新情報が前回実行時（シート記載値または前回状態）より新しい情報があるかを確認します。複数の更新候補が同じ資格に関連する場合は、日付が最も新しい情報を反映します。
- **スプレッドシート更新**: `docs/interface.md` の定義に従い、更新を検知した資格行の「最終更新日時」「タイトル」「URL」「説明」と、取得できた詳細列を更新します（ヘッダー「URL」を優先認識し、旧形式の「更新情報URL」にも互換対応）。詳細情報だけの更新では更新情報列を保持し、資格情報取得元などの入力列も保持します。
- **Slack通知 (2つのWebhook)**: 
  - **Webhook 1 (更新通知用)**: スクリプトプロパティ `SLACK_WEBHOOK_URL_1`（または `SLACK_WEBHOOK_URL`）へ、「更新日時」「資格名」「タイトル」「URL」「説明」を整形して投稿します。複数の更新がある場合はそれぞれ別々に投稿します。
  - **Webhook 2 (エラー通知用)**: スクリプトプロパティ `SLACK_WEBHOOK_URL_2`（または `SLACK_ERROR_WEBHOOK_URL`）へ、スクレイピングやプログラム実行時にエラーが発生した場合に発生日時・発生箇所・エラー内容を整形して投稿します（ORACLEの403エラー等は除外）。

スプレッドシートURLはApps Scriptの「プロジェクトの設定」>「スクリプト プロパティ」で `QUALIFICATIONS_SPREADSHEET_URL` に設定できます。未設定時は、上記「tmp資格情報一覧」のURLを使用します。別のタブを使う場合は `QUALIFICATIONS_SHEET_NAME` にシート名を設定してください。毎平日10時（日本時間）に実行するには、Apps Scriptへコードを反映した後、エディタで `setupDailyTrigger` を一度実行して権限を承認します。この関数は既存の同じチェック関数のトリガーを置き換えるため、重複登録されません。テストは `node test/gas_sheet_updates.test.js` および `node test/checker_requirements.test.js` で実行します。また、ローカルTSVは `node scripts/update_tsv.js` で `docs/interface.md` 仕様に同期できます（TSVは基本8項目を保持します）。

## Webhook URLの確認方法

### すでに作成済みのアプリから確認する手順

すでに連携用のSlack Appを作成している場合は、管理画面からURLをコピーできます。

1. Slack APIの管理画面を開く:
ブラウザ操作。
Slack API: Your Apps にアクセスし、一覧から対象のアプリ名をクリックします。Verification: 選択したアプリの「Basic Information（基本情報）」画面が開きます。
2. Incoming Webhooksの設定画面へ移動する:
左メニュー。
画面左側のメニュー（Features内）にある「Incoming Webhooks」をクリックします。Verification: 画面上部の「Activate Incoming Webhooks」のトグルスイッチが「On」になっていることを確認できます。
3. Webhook URLをコピーする:
画面下部。
ページ下部の「Webhook URLs for Your Workspace」の一覧から、目的のチャンネル（またはDM）の右側にある「Copy」ボタンをクリックします。
Verification: [https://hooks.slack.com/services/](https://hooks.slack.com/services/)... から始まるURLがクリップボードにコピーされます。

### 新しくWebhook URLを発行する手順

まだアプリがない場合や、新しいチャンネル用のURLを追加したい場合は以下の手順で発行します。
1. 新規アプリを作成する:
初回のみ。
Slack API: Your Apps の右上にある「Create New App」＞「From scratch」を選び、任意のアプリ名（例：GAS通知用）とワークスペースを指定して「Create App」をクリックします。
Verification: 作成したアプリの管理画面に遷移します。
2. Incoming Webhooksを有効化する:
左メニュー。
左メニューの「Incoming Webhooks」を開き、「Activate Incoming Webhooks」のスイッチを「On」に切り替えます。
Verification: 画面下部に「Add New Webhook to Workspace」ボタンが表示されます。
3. 投稿先を選んでURLを発行する:
権限の許可。
「Add New Webhook to Workspace」をクリックし、プルダウ  ンから投稿先のチャンネル（または自分の名前）を選んで「許可する（Allow）」をクリックします。
Verification: 元の画面の「Webhook URLs for Your Workspace」に新しいURLが追加され、「Copy」ボタンから取得できるようになります。
